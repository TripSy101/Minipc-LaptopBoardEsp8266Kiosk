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
import logging
from queue import Queue
from config import SERIAL_SETTINGS, APP_SETTINGS

# Database setup
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "esquima.db")

logger = logging.getLogger("serial")

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
    def __init__(self, port, baudrate=SERIAL_SETTINGS["baudrate"]):
        self.port = port
        self.baudrate = baudrate
        self.serial = None
        self.running = False
        self.message_queue = Queue()
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = APP_SETTINGS["reconnect_attempts"]
        self.reconnect_delay = APP_SETTINGS["reconnect_delay"]

    def start(self):
        try:
            self.serial = serial.Serial(
                self.port,
                self.baudrate,
                timeout=SERIAL_SETTINGS["timeout"],
                write_timeout=SERIAL_SETTINGS["write_timeout"],
                inter_byte_timeout=SERIAL_SETTINGS["inter_byte_timeout"]
            )
            self.running = True
            self.reconnect_attempts = 0
            
            # Start read and write threads
            threading.Thread(target=self.read_loop, daemon=True).start()
            threading.Thread(target=self.write_loop, daemon=True).start()
            
            logger.info(f"Connected to {self.port}")
            return True
        except serial.SerialException as e:
            logger.error(f"Error opening serial port: {e}")
            return False

    def read_loop(self):
        while self.running:
            if not self.serial or not self.serial.is_open:
                if not self._attempt_reconnect():
                    break
                continue

            try:
                line = self.serial.readline().decode().strip()
                if line:
                    logger.debug(f"RX: {line}")
                    # Process received data here
            except serial.SerialException as e:
                logger.error(f"Serial read error: {e}")
                if not self._attempt_reconnect():
                    break
            except Exception as e:
                logger.error(f"Unexpected read error: {e}")
                time.sleep(1)

    def write_loop(self):
        while self.running:
            try:
                message = self.message_queue.get(timeout=1)
                if self.serial and self.serial.is_open:
                    self.serial.write(f"{message}\n".encode())
                    logger.debug(f"TX: {message}")
            except Queue.Empty:
                continue
            except serial.SerialException as e:
                logger.error(f"Serial write error: {e}")
                if not self._attempt_reconnect():
                    break
            except Exception as e:
                logger.error(f"Unexpected write error: {e}")

    def _attempt_reconnect(self):
        if self.reconnect_attempts >= self.max_reconnect_attempts:
            logger.error(f"Max reconnection attempts ({self.max_reconnect_attempts}) reached")
            self.stop()
            return False

        self.reconnect_attempts += 1
        logger.warning(f"Attempting to reconnect (attempt {self.reconnect_attempts}/{self.max_reconnect_attempts})")
        
        try:
            if self.serial:
                self.serial.close()
            time.sleep(self.reconnect_delay)
            return self.start()
        except Exception as e:
            logger.error(f"Reconnection failed: {e}")
            return False

    def send(self, message):
        if not self.running:
            logger.warning("Cannot send message: Serial manager is not running")
            return False
        try:
            self.message_queue.put(message)
            return True
        except Exception as e:
            logger.error(f"Error queueing message: {e}")
            return False

    def stop(self):
        logger.info("Stopping serial manager")
        self.running = False
        if self.serial:
            try:
                self.serial.close()
                logger.info(f"Closed connection to {self.port}")
            except Exception as e:
                logger.error(f"Error closing serial port: {e}")
        self.serial = None

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
    if not serial_manager.start():
        print("Failed to connect to ESP8266. Make sure it's connected and try again.")
        return
    
    # Simple test loop
    try:
        while True:
            command = input("Enter command to send (or 'q' to quit): ")
            if command.lower() == 'q':
                break
            
            serial_manager.send(command)
            time.sleep(0.5)
            print(f"Last message: {serial_manager.message_queue.queue[-1]}")
    
    except KeyboardInterrupt:
        print("\nExiting...")
    
    finally:
        serial_manager.stop()

if __name__ == "__main__":
    main()