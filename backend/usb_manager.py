#!/usr/bin/env python3
import os
import sys
import time
import json
import logging
import threading
import serial
import serial.tools.list_ports
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("usb-manager")

class USBEventHandler(FileSystemEventHandler):
    def __init__(self, callback):
        self.callback = callback
        
    def on_created(self, event):
        if event.is_directory:
            return
        if event.src_path.startswith('/dev/ttyUSB') or event.src_path.startswith('/dev/ttyACM'):
            logger.info(f"New USB device detected: {event.src_path}")
            self.callback(event.src_path)
            
    def on_deleted(self, event):
        if event.is_directory:
            return
        if event.src_path.startswith('/dev/ttyUSB') or event.src_path.startswith('/dev/ttyACM'):
            logger.info(f"USB device removed: {event.src_path}")
            self.callback(event.src_path, removed=True)

class USBManager:
    def __init__(self):
        self.connected_devices = {}
        self.callback = None
        self.observer = None
        self.running = False
        
    def start_monitoring(self, callback):
        """Start monitoring USB ports for ESP8266 devices"""
        self.callback = callback
        self.running = True
        
        # Start file system observer
        event_handler = USBEventHandler(self._handle_device_change)
        self.observer = Observer()
        self.observer.schedule(event_handler, path='/dev', recursive=False)
        self.observer.start()
        
        # Initial scan for connected devices
        self._scan_ports()
        
        logger.info("USB monitoring started")
        
    def stop_monitoring(self):
        """Stop monitoring USB ports"""
        if self.observer:
            self.observer.stop()
            self.observer.join()
        self.running = False
        logger.info("USB monitoring stopped")
        
    def _scan_ports(self):
        """Scan for connected ESP8266 devices"""
        ports = list(serial.tools.list_ports.comports())
        
        for port in ports:
            if self._is_esp8266(port):
                self._handle_device_change(port.device)
                
    def _is_esp8266(self, port):
        """Check if the port is likely an ESP8266 device"""
        # Common USB-to-Serial converters used with ESP8266
        if any(x in port.description for x in ["CP210", "CH340", "FTDI"]):
            return True
            
        # Check for common port names
        if any(x in port.device for x in ["ttyUSB", "ttyACM"]):
            return True
            
        return False
        
    def _handle_device_change(self, port_path, removed=False):
        """Handle device connection/disconnection"""
        if removed:
            if port_path in self.connected_devices:
                del self.connected_devices[port_path]
                if self.callback:
                    self.callback(port_path, connected=False)
        else:
            if port_path not in self.connected_devices:
                self.connected_devices[port_path] = {
                    'connected': True,
                    'last_seen': time.time()
                }
                if self.callback:
                    self.callback(port_path, connected=True)
                    
    def get_connected_devices(self):
        """Get list of currently connected ESP8266 devices"""
        return list(self.connected_devices.keys())
        
    def is_device_connected(self, port_path):
        """Check if a specific device is connected"""
        return port_path in self.connected_devices

def main():
    # Example usage
    def device_callback(port_path, connected=True):
        if connected:
            logger.info(f"ESP8266 connected: {port_path}")
        else:
            logger.info(f"ESP8266 disconnected: {port_path}")
    
    manager = USBManager()
    manager.start_monitoring(device_callback)
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        manager.stop_monitoring()

if __name__ == "__main__":
    main() 