#!/usr/bin/env python3
import os
import sys
import time
import json
import sqlite3
import threading
import serial
import serial.tools.list_ports
from datetime import datetime

# Database setup
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "esquima.db")

def setup_database():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create tables if they don't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        duration INTEGER NOT NULL,
        type TEXT NOT NULL
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        service_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        amount REAL,
        FOREIGN KEY (service_id) REFERENCES services (id)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    ''')
    
    # Insert default services if they don't exist
    cursor.execute("SELECT COUNT(*) FROM services")
    if cursor.fetchone()[0] == 0:
        services = [
            (1, "CARWASH 1", "Premium Wash", 150.00, 180, "carwash"),
            (2, "CARWASH 2", "Premium Wash", 150.00, 180, "carwash"),
            (3, "SHAMPOO", "Foam Treatment", 50.00, 120, "shampoo"),
            (4, "INFLATOR/BLOWER", "Tire/Air Drying", 20.00, 60, "inflator"),
            (5, "FAUCET", "Water Refill", 10.00, 60, "faucet"),
        ]
        cursor.executemany(
            "INSERT INTO services (id, name, description, price, duration, type) VALUES (?, ?, ?, ?, ?, ?)",
            services
        )
    
    # Insert default settings if they don't exist
    cursor.execute("SELECT COUNT(*) FROM settings")
    if cursor.fetchone()[0] == 0:
        settings = [
            ("admin_password", "admin123"),
            ("maintenance_mode", "false"),
        ]
        cursor.executemany(
            "INSERT INTO settings (key, value) VALUES (?, ?)",
            settings
        )
    
    conn.commit()
    conn.close()

class SerialManager:
    def __init__(self, port=None, baudrate=9600):
        self.port = port
        self.baudrate = baudrate
        self.serial_conn = None
        self.connected = False
        self.running = False
        self.read_thread = None
        self.write_queue = []
        self.last_message = ""
        self.callback = None
        
    def find_esp_port(self):
        """Try to automatically find the ESP8266 serial port"""
        ports = list(serial.tools.list_ports.comports())
        
        for port in ports:
            # Common USB-to-Serial converters used with ESP8266
            if "CP210" in port.description or "CH340" in port.description or "FTDI" in port.description:
                return port.device
            
            # Raspberry Pi and similar boards might have ESP on ttyUSB0 or ttyACM0
            if "ttyUSB" in port.device or "ttyACM" in port.device:
                return port.device
        
        return None
    
    def connect(self):
        """Connect to the ESP8266 via serial"""
        if self.connected:
            return True
        
        if self.port is None:
            self.port = self.find_esp_port()
            if self.port is None:
                print("ESP8266 not found. Check connection and try again.")
                return False
        
        try:
            self.serial_conn = serial.Serial(self.port, self.baudrate, timeout=1)
            time.sleep(2)  # Wait for ESP to reset after serial connection
            self.connected = True
            self.running = True
            self.read_thread = threading.Thread(target=self._read_loop)
            self.read_thread.daemon = True
            self.read_thread.start()
            
            print(f"Connected to ESP8266 on {self.port}")
            return True
        except Exception as e:
            print(f"Error connecting to ESP8266: {e}")
            self.connected = False
            return False
    
    def disconnect(self):
        """Disconnect from the ESP8266"""
        self.running = False
        if self.read_thread:
            self.read_thread.join(timeout=1)
        
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()
        
        self.connected = False
        print("Disconnected from ESP8266")
    
    def send_command(self, command):
        """Send command to ESP8266"""
        if not self.connected or not self.serial_conn:
            print("Not connected to ESP8266")
            return False
        
        try:
            # Ensure command ends with newline
            if not command.endswith('\n'):
                command += '\n'
            
            self.serial_conn.write(command.encode('utf-8'))
            self.serial_conn.flush()
            
            # Log the command to database
            self._log_command(command.strip())
            
            return True
        except Exception as e:
            print(f"Error sending command to ESP8266: {e}")
            return False
    
    def _read_loop(self):
        """Background thread to read messages from ESP8266"""
        while self.running:
            if not self.connected or not self.serial_conn:
                time.sleep(0.1)
                continue
            
            try:
                if self.serial_conn.in_waiting:
                    line = self.serial_conn.readline().decode('utf-8').strip()
                    if line:
                        print(f"Received from ESP8266: {line}")
                        self.last_message = line
                        
                        # Process message (e.g., update database, send to frontend)
                        self._process_message(line)
                        
                        # Call callback if set
                        if self.callback:
                            self.callback(line)
            except Exception as e:
                print(f"Error reading from ESP8266: {e}")
                self.connected = False
                break
            
            time.sleep(0.1)
    
    def _process_message(self, message):
        """Process messages from ESP8266"""
        try:
            # Log to database based on message type
            if message.startswith("SERVICE_STARTED:"):
                service_id = int(message.split(":")[1])
                self._log_event(service_id, "START", "SUCCESS")
            
            elif message.startswith("SERVICE_COMPLETED:"):
                service_id = int(message.split(":")[1])
                self._log_event(service_id, "COMPLETE", "SUCCESS")
            
            elif message == "COIN_INSERTED":
                # For coin insertion, we don't know which service yet
                # This will be linked later when the service starts
                pass
            
            elif message == "INVALID_COMMAND":
                self._log_event(0, "COMMAND", "FAILED", 0)
                
        except Exception as e:
            print(f"Error processing message: {e}")
    
    def _log_command(self, command):
        """Log commands sent to ESP8266"""
        try:
            if command.startswith("START_SERVICE:"):
                service_id = int(command.split(":")[1])
                self._log_event(service_id, "START", "PENDING")
            
            elif command.startswith("SERVICE") and command.endswith("_ON"):
                service_id = int(command.replace("SERVICE", "").replace("_ON", ""))
                self._log_event(service_id, "MANUAL_ON", "SUCCESS")
            
            elif command.startswith("SERVICE") and command.endswith("_OFF"):
                service_id = int(command.replace("SERVICE", "").replace("_OFF", ""))
                self._log_event(service_id, "MANUAL_OFF", "SUCCESS")
            
            elif command == "RESET":
                self._log_event(0, "RESET", "SUCCESS")
                
        except Exception as e:
            print(f"Error logging command: {e}")
    
    def _log_event(self, service_id, action, status, amount=None):
        """Log event to database"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Get price from service if amount is None and we have a valid service_id
            if amount is None and service_id > 0:
                cursor.execute("SELECT price FROM services WHERE id = ?", (service_id,))
                result = cursor.fetchone()
                if result:
                    amount = result[0]
            
            cursor.execute(
                "INSERT INTO logs (timestamp, service_id, action, status, amount) VALUES (?, ?, ?, ?, ?)",
                (datetime.now().isoformat(), service_id, action, status, amount)
            )
            
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error logging event: {e}")
    
    def set_callback(self, callback_function):
        """Set callback function to be called when messages are received"""
        self.callback = callback_function
    
    def get_last_message(self):
        """Get the last message received from ESP8266"""
        return self.last_message

def get_services():
    """Get all services from database"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM services ORDER BY id")
    services = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return services

def get_logs(limit=50):
    """Get recent logs from database"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?", 
        (limit,)
    )
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return logs

def update_service(service_id, name, description, price, duration, service_type):
    """Update service in database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE services SET name = ?, description = ?, price = ?, duration = ?, type = ? WHERE id = ?",
        (name, description, price, duration, service_type, service_id)
    )
    conn.commit()
    conn.close()
    return True

def get_setting(key):
    """Get setting from database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None

def update_setting(key, value):
    """Update setting in database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        (key, value)
    )
    conn.commit()
    conn.close()
    return True

def main():
    # Setup database
    setup_database()
    
    # Create serial manager
    serial_manager = SerialManager()
    
    # Try to connect to ESP8266
    if not serial_manager.connect():
        print("Failed to connect to ESP8266. Make sure it's connected and try again.")
        return
    
    # Simple test loop
    try:
        while True:
            command = input("Enter command to send (or 'q' to quit): ")
            if command.lower() == 'q':
                break
            
            serial_manager.send_command(command)
            time.sleep(0.5)
            print(f"Last message: {serial_manager.get_last_message()}")
    
    except KeyboardInterrupt:
        print("\nExiting...")
    
    finally:
        serial_manager.disconnect()

if __name__ == "__main__":
    main()