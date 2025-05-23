/*
 * ESQUIMA Kiosk - ESP8266 Firmware (Enhanced Version)
 * 
 * Added Features:
 * - Enhanced error handling
 * - Configuration system
 * - Service state persistence
 * - System monitoring
 * - Power management
 */

#include <ESP8266WiFi.h>
#include <Ticker.h>
#include <EEPROM.h>
#include <SoftwareSerial.h>  // Add SoftwareSerial for additional serial ports

// Updated Pin definitions
#define COIN_PIN D0       // GPIO16 (No interrupt available)
#define RELAY1_PIN D1     // GPIO5
#define RELAY2_PIN D2     // GPIO4
#define RELAY3_PIN D5     // GPIO14
#define RELAY4_PIN D6     // GPIO12
#define RELAY5_PIN D7     // GPIO13
#define RELAY6_PIN D8     // GPIO15 (Requires external pull-down resistor)
#define UPS_PIN D3        // Add UPS status pin
#define AUX_RX_PIN D4     // GPIO2 for additional serial port
#define AUX_TX_PIN D3     // GPIO0 for additional serial port

// Enhanced Constants
#define BAUD_RATE 9600
#define MAX_SERVICES 6    // Reduced to match available relays
#define DEBOUNCE_TIME 100 // milliseconds
#define RECONNECT_INTERVAL 5000 // 5 seconds between reconnection attempts
#define COIN_POLL_INTERVAL 50 // ms for polling coin input
#define POWER_CHECK_INTERVAL 300000  // 5 minutes
#define MAX_SERVICE_TIME 3600000     // 1 hour maximum
#define EEPROM_SIZE 512
#define CONFIG_VERSION 1
#define ERROR_LOG_SIZE 10
#define MAX_SERIAL_PORTS 4  // Maximum number of serial ports to monitor

// Error codes
enum ErrorCode {
  ERROR_NONE = 0,
  ERROR_RELAY_FAILURE = 1,
  ERROR_COIN_DETECTOR = 2,
  ERROR_POWER_LOW = 3,
  ERROR_SYSTEM = 4
};

// Renamed from Config to ESPConfig to avoid ambiguity
struct ESPConfig {
  uint8_t version;
  uint32_t serviceDurations[MAX_SERVICES];
  uint8_t errorCount[MAX_SERVICES];
  bool autoRecovery;
  uint32_t maxServiceTime;
};

// Error log structure
struct ErrorLog {
  uint32_t timestamp;
  ErrorCode code;
  char message[32];
};

// Enhanced Service state
struct Service {
  bool active;
  uint32_t durationMillis;
  uint32_t remainingMillis;
  uint32_t startTime;
  Ticker timer;
  uint8_t errorCount;
  bool isError;
};

// Serial port structure
struct SerialPort {
    bool isActive;
    bool isConnected;
    unsigned long lastActivity;
    String buffer;
};

// Global variables
Service services[MAX_SERVICES];
ESPConfig espConfig;  // Renamed from config to espConfig
ErrorLog errorLog[ERROR_LOG_SIZE];
SerialPort serialPorts[MAX_SERIAL_PORTS];
SoftwareSerial auxSerial(AUX_RX_PIN, AUX_TX_PIN);  // Additional serial port
volatile unsigned long lastCoinTime = 0;
volatile bool coinInserted = false;
unsigned long lastReconnectAttempt = 0;
unsigned long lastPowerCheck = 0;
unsigned long lastSystemCheck = 0;
bool isConnected = false;
unsigned long lastCoinPoll = 0;
uint8_t currentErrorLogIndex = 0;

// Forward declarations
void setupPins();
void setupSerial();
void setupEEPROM();
void loadConfig();
void saveConfig();
void handleCommand(String command);
void startService(int serviceId, uint32_t durationMillis);
void stopService(int serviceId);
void updateService(int serviceId);
void checkCoinInput();
void checkConnection();
void checkPowerStatus();
void checkSystemStatus();
void logError(ErrorCode code, const char* message);
void handleError(ErrorCode code, const char* message);
bool validatePinConfiguration();
void handlePowerFailure();
void recoverFromError();
void checkUPSStatus();
bool validateServiceState(int serviceId);
void sendHeartbeat();
void checkSerialPorts();
void broadcastMessage(String message);

// Message structure
struct Message {
    uint8_t type;
    uint8_t length;
    uint8_t data[32];
    uint16_t checksum;
};

// Calculate checksum for message
uint16_t calculateChecksum(const Message& msg) {
    uint16_t sum = 0;
    sum += msg.type;
    sum += msg.length;
    for (int i = 0; i < msg.length; i++) {
        sum += msg.data[i];
    }
    return sum;
}

void sendMessage(Message msg) {
    // Calculate checksum
    msg.checksum = calculateChecksum(msg);
    Serial.write((uint8_t*)&msg, sizeof(Message));
}

void setup() {
  // Initialize hardware
  setupPins();
  setupSerial();
  setupEEPROM();
  
  // Load configuration
  loadConfig();
  
  // Initialize service states
  for (int i = 0; i < MAX_SERVICES; i++) {
    services[i].active = false;
    services[i].durationMillis = 0;
    services[i].remainingMillis = 0;
    services[i].errorCount = 0;
    services[i].isError = false;
  }
  
  // Validate system
  if (!validatePinConfiguration()) {
    handleError(ERROR_SYSTEM, "Invalid pin configuration");
  }
  
  // Send ready message
  Serial.println("ESP8266_INITIALIZED");
  
  // Enable watchdog
  ESP.wdtEnable(WDTO_8S);
}

void setupEEPROM() {
  EEPROM.begin(EEPROM_SIZE);
}

void loadConfig() {
  EEPROM.get(0, espConfig);
  if (espConfig.version != CONFIG_VERSION) {
    // Set default configuration
    espConfig.version = CONFIG_VERSION;
    espConfig.autoRecovery = true;
    espConfig.maxServiceTime = MAX_SERVICE_TIME;
    
    // Default service durations
    espConfig.serviceDurations[0] = 180 * 1000; // 3 minutes
    espConfig.serviceDurations[1] = 180 * 1000; // 3 minutes
    espConfig.serviceDurations[2] = 120 * 1000; // 2 minutes
    espConfig.serviceDurations[3] = 60 * 1000;  // 1 minute
    espConfig.serviceDurations[4] = 60 * 1000;  // 1 minute
    espConfig.serviceDurations[5] = 60 * 1000;  // 1 minute
    
    saveConfig();
  }
}

void saveConfig() {
  EEPROM.put(0, espConfig);
  EEPROM.commit();
}

void logError(ErrorCode code, const char* message) {
  errorLog[currentErrorLogIndex].timestamp = millis();
  errorLog[currentErrorLogIndex].code = code;
  strncpy(errorLog[currentErrorLogIndex].message, message, 31);
  errorLog[currentErrorLogIndex].message[31] = '\0';
  
  currentErrorLogIndex = (currentErrorLogIndex + 1) % ERROR_LOG_SIZE;
  
  // Save error to EEPROM
  EEPROM.put(100 + (currentErrorLogIndex * sizeof(ErrorLog)), errorLog[currentErrorLogIndex]);
  EEPROM.commit();
}

void handleError(ErrorCode code, const char* message) {
  logError(code, message);
  
  switch (code) {
    case ERROR_RELAY_FAILURE:
      if (espConfig.autoRecovery) {
        // Attempt to recover failed relay
        for (int i = 0; i < MAX_SERVICES; i++) {
          if (services[i].isError) {
            recoverRelay(i + 1);
          }
        }
      }
      break;
      
    case ERROR_POWER_LOW:
      // Stop all services
      for (int i = 0; i < MAX_SERVICES; i++) {
        if (services[i].active) {
          stopService(i + 1);
        }
      }
      break;
      
    case ERROR_SYSTEM:
      // Critical error, attempt system reset
      ESP.restart();
      break;
  }
}

void recoverRelay(int serviceId) {
  int pin = getRelayPin(serviceId);
  if (pin == -1) return;
  
  // Try to reset relay
  digitalWrite(pin, HIGH);
  delay(100);
  digitalWrite(pin, LOW);
  
  // Verify state
  if (digitalRead(pin) != LOW) {
    logError(ERROR_RELAY_FAILURE, "Relay recovery failed");
  } else {
    services[serviceId - 1].isError = false;
    services[serviceId - 1].errorCount = 0;
  }
}

void checkSystemStatus() {
  if (millis() - lastSystemCheck >= 30000) { // Every 30 seconds
    lastSystemCheck = millis();
    
    // Check relay states
    for (int i = 0; i < MAX_SERVICES; i++) {
      if (services[i].active) {
        int pin = getRelayPin(i + 1);
        if (digitalRead(pin) != LOW) {
          services[i].errorCount++;
          if (services[i].errorCount > 3) {
            services[i].isError = true;
            handleError(ERROR_RELAY_FAILURE, "Relay failure detected");
          }
        }
      }
    }
    
    // Check coin detector
    if (digitalRead(COIN_PIN) == LOW) {
      handleError(ERROR_COIN_DETECTOR, "Coin detector error");
    }
  }
}

void startService(int serviceId, uint32_t durationMillis) {
  int pin = getRelayPin(serviceId);
  if (pin == -1) {
    handleError(ERROR_SYSTEM, "Invalid relay pin");
    return;
  }
  
  // Verify relay state
  if (digitalRead(pin) != HIGH) {
    handleError(ERROR_RELAY_FAILURE, "Relay not in safe state");
    return;
  }
  
  // Stop any existing service
  if (services[serviceId - 1].active) {
    stopService(serviceId);
  }
  
  // Start new service
  digitalWrite(pin, LOW);
  services[serviceId - 1].active = true;
  services[serviceId - 1].durationMillis = durationMillis;
  services[serviceId - 1].remainingMillis = durationMillis;
  services[serviceId - 1].startTime = millis();
  services[serviceId - 1].errorCount = 0;
  services[serviceId - 1].isError = false;
  
  // Set up timer
  services[serviceId - 1].timer.attach_ms(1000, [serviceId]() {
    updateService(serviceId);
  });
}

void stopService(int serviceId) {
  int pin = getRelayPin(serviceId);
  if (pin == -1) return;
  
  // Stop the timer
  services[serviceId - 1].timer.detach();
  
  // Deactivate relay
  digitalWrite(pin, HIGH);
  
  // Update service state
  services[serviceId - 1].active = false;
  services[serviceId - 1].durationMillis = 0;
  services[serviceId - 1].remainingMillis = 0;
}

void updateService(int serviceId) {
  if (!services[serviceId - 1].active) return;
  
  // Check for maximum service time
  if (millis() - services[serviceId - 1].startTime > espConfig.maxServiceTime) {
    handleError(ERROR_SYSTEM, "Service timeout");
    stopService(serviceId);
    return;
  }
  
  if (services[serviceId - 1].remainingMillis > 0) {
    services[serviceId - 1].remainingMillis -= 1000;
  }
  
  if (services[serviceId - 1].remainingMillis <= 0) {
    stopService(serviceId);
    Serial.print("SERVICE_COMPLETED:");
    Serial.println(serviceId);
  }
}

void loop() {
    // Check all serial ports
    checkSerialPorts();
    
    // Check for coin insertion (polling since GPIO16 doesn't support interrupts)
    checkCoinInput();
    
    // Check system status
    checkSystemStatus();
    
    // Check power status
    checkPowerStatus();
    
    // Check UPS status
    checkUPSStatus();
    
    // Handle coin insertion flag
    if (coinInserted) {
        broadcastMessage("COIN_INSERTED");
        coinInserted = false;
    }
    
    // Send heartbeat
    sendHeartbeat();
}

void setupPins() {
  // Setup relay pins as outputs (active low)
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  pinMode(RELAY3_PIN, OUTPUT);
  pinMode(RELAY4_PIN, OUTPUT);
  pinMode(RELAY5_PIN, OUTPUT);
  pinMode(RELAY6_PIN, OUTPUT);
  
  // Special setup for D8 (GPIO15) which needs pull-down
  #ifdef RELAY6_PIN
    pinMode(RELAY6_PIN, OUTPUT);
    digitalWrite(RELAY6_PIN, HIGH); // Start in OFF state
  #endif
  
  // Set all relays to OFF initially
  digitalWrite(RELAY1_PIN, HIGH);
  digitalWrite(RELAY2_PIN, HIGH);
  digitalWrite(RELAY3_PIN, HIGH);
  digitalWrite(RELAY4_PIN, HIGH);
  digitalWrite(RELAY5_PIN, HIGH);
  digitalWrite(RELAY6_PIN, HIGH);
  
  // Setup coin input pin (GPIO16 doesn't support interrupts)
  pinMode(COIN_PIN, INPUT_PULLDOWN_16); // Special pull-down for GPIO16
}

void setupSerial() {
    // Initialize main serial port
    Serial.begin(BAUD_RATE);
    Serial.setTimeout(50);
    
    // Initialize additional serial port
    auxSerial.begin(BAUD_RATE);
    auxSerial.setTimeout(50);
    
    // Initialize serial port structures
    for (int i = 0; i < MAX_SERIAL_PORTS; i++) {
        serialPorts[i].isActive = false;
        serialPorts[i].isConnected = false;
        serialPorts[i].lastActivity = 0;
        serialPorts[i].buffer = "";
    }
    
    delay(100);
}

void checkSerialPorts() {
    // Check main serial port
    if (Serial.available()) {
        String command = Serial.readStringUntil('\n');
        command.trim();
        handleCommand(command);
        serialPorts[0].lastActivity = millis();
        serialPorts[0].isActive = true;
        serialPorts[0].isConnected = true;
    }
    
    // Check additional serial port
    if (auxSerial.available()) {
        String command = auxSerial.readStringUntil('\n');
        command.trim();
        handleCommand(command);
        serialPorts[1].lastActivity = millis();
        serialPorts[1].isActive = true;
        serialPorts[1].isConnected = true;
    }
    
    // Check for inactive ports
    for (int i = 0; i < MAX_SERIAL_PORTS; i++) {
        if (serialPorts[i].isActive && millis() - serialPorts[i].lastActivity > 30000) {
            serialPorts[i].isConnected = false;
            logError(ERROR_SYSTEM, "Serial port inactive");
        }
    }
}

void handleCommand(String command) {
    // Broadcast command to all active serial ports
    if (command.startsWith("START_SERVICE:") || 
        command.startsWith("STOP_SERVICE:") || 
        command == "GET_STATUS") {
        
        // Send to main serial
        if (serialPorts[0].isConnected) {
            Serial.println(command);
        }
        
        // Send to auxiliary serial
        if (serialPorts[1].isConnected) {
            auxSerial.println(command);
        }
    }
    
    // Process command as before
    if (command.startsWith("START_SERVICE:")) {
        int serviceId = command.substring(14).toInt();
        
        // Validate service ID
        if (serviceId < 1 || serviceId > MAX_SERVICES) {
            broadcastMessage("INVALID_COMMAND");
            return;
        }
        
        // Get duration based on service ID (in milliseconds)
        uint32_t duration = espConfig.serviceDurations[serviceId - 1];
        
        startService(serviceId, duration);
        broadcastMessage("SERVICE_STARTED:" + String(serviceId));
    }
    else if (command.startsWith("STOP_SERVICE:")) {
        int serviceId = command.substring(13).toInt();
        if (serviceId >= 1 && serviceId <= MAX_SERVICES) {
            stopService(serviceId);
            broadcastMessage("SERVICE_STOPPED:" + String(serviceId));
        }
    }
    else if (command == "GET_STATUS") {
        for (int i = 0; i < MAX_SERVICES; i++) {
            broadcastMessage("SERVICE_" + String(i + 1) + ":" + 
                           (services[i].active ? "ACTIVE" : "INACTIVE"));
        }
    }
}

void broadcastMessage(String message) {
    // Send to main serial
    if (serialPorts[0].isConnected) {
        Serial.println(message);
    }
    
    // Send to auxiliary serial
    if (serialPorts[1].isConnected) {
        auxSerial.println(message);
    }
}

int getRelayPin(int serviceId) {
  switch (serviceId) {
    case 1: return RELAY1_PIN;
    case 2: return RELAY2_PIN;
    case 3: return RELAY3_PIN;
    case 4: return RELAY4_PIN;
    case 5: return RELAY5_PIN;
    case 6: return RELAY6_PIN;
    default: return -1;
  }
}

void checkPowerStatus() {
  // Implementation of checkPowerStatus function
}

bool validatePinConfiguration() {
  // Implementation of validatePinConfiguration function
  return true; // Placeholder return, actual implementation needed
}

void handlePowerFailure() {
    // Save current state to EEPROM
    for (int i = 0; i < MAX_SERVICES; i++) {
        if (services[i].active) {
            EEPROM.put(200 + (i * sizeof(Service)), services[i]);
        }
    }
    EEPROM.commit();
}

void recoverFromError() {
    // Check EEPROM for saved state
    for (int i = 0; i < MAX_SERVICES; i++) {
        Service savedService;
        EEPROM.get(200 + (i * sizeof(Service)), savedService);
        if (savedService.active) {
            // Resume service with remaining time
            startService(i + 1, savedService.remainingMillis);
        }
    }
}

void checkUPSStatus() {
    if (digitalRead(UPS_PIN) == LOW) {
        // UPS is active, system is on backup power
        handleError(ERROR_POWER_LOW, "System running on UPS");
    }
}

bool validateServiceState(int serviceId) {
    if (serviceId < 1 || serviceId > MAX_SERVICES) return false;
    
    Service& service = services[serviceId - 1];
    if (service.active) {
        // Verify relay state matches service state
        int pin = getRelayPin(serviceId);
        return digitalRead(pin) == LOW;
    }
    return true;
}

void sendHeartbeat() {
    static unsigned long lastHeartbeat = 0;
    if (millis() - lastHeartbeat >= 1000) {
        broadcastMessage("HEARTBEAT");
        lastHeartbeat = millis();
    }
}

void checkCoinInput() {
  unsigned long currentMillis = millis();
  if (currentMillis - lastCoinPoll >= COIN_POLL_INTERVAL) {
    lastCoinPoll = currentMillis;
    
    // Detect falling edge (coin insertion)
    static bool lastState = HIGH;
    bool currentState = digitalRead(COIN_PIN);
    
    if (lastState == HIGH && currentState == LOW) {
      if (currentMillis - lastCoinTime > DEBOUNCE_TIME) {
        lastCoinTime = currentMillis;
        coinInserted = true;
      }
    }
    lastState = currentState;
  }
}