#!/usr/bin/env python3
import os
import sys
import time
import json
import logging
import threading
import serial
import serial.tools.list_ports
from typing import Optional, Callable, Any, List, Union

# Try to import pyudev, with fallback for Windows development
try:
    import pyudev
    PYUDEV_AVAILABLE = True
except ImportError:
    PYUDEV_AVAILABLE = False
    if sys.platform != 'win32':
        raise  # Re-raise if not on Windows

from config import USB_SETTINGS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("usb")

class USBManager:
    def __init__(self) -> None:
        self.context: Optional[pyudev.Context] = None
        self.monitor: Optional[pyudev.Monitor] = None
        self.running: bool = False

    def start(self) -> bool:
        if not PYUDEV_AVAILABLE:
            logger.warning("pyudev not available. Running in limited mode.")
            self.running = True
            return True

        try:
            self.context = pyudev.Context()
            self.monitor = pyudev.Monitor.from_netlink(self.context)
            if self.monitor:
                self.monitor.filter_by(subsystem=USB_SETTINGS["subsystem"])
            self.running = True
            logger.info("USB Manager started successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to start USB Manager: {e}")
            return False

    def validate_device(self, device: Any) -> bool:
        """Validate if the device is a supported ESP8266 board"""
        if not PYUDEV_AVAILABLE:
            return True  # Accept all devices in limited mode

        try:
            # Check if device has vendor and product IDs
            if not device.get('ID_VENDOR_ID') or not device.get('ID_MODEL_ID'):
                return False

            # Get the vendor:product ID
            device_id = f"{device.get('ID_VENDOR_ID')}:{device.get('ID_MODEL_ID')}"

            # Check if it matches any known ESP8266 board IDs
            return device_id in USB_SETTINGS["vendor_ids"].values()
        except Exception as e:
            logger.error(f"Error validating device: {e}")
            return False

    def monitor_devices(self, callback: Callable[[str, str], None]) -> None:
        """Monitor USB devices with error handling and device validation"""
        if not self.start():
            logger.error("Cannot start device monitoring")
            return

        logger.info("Listening for serial device events...")

        if not PYUDEV_AVAILABLE:
            # Fallback for Windows development
            logger.warning("Running in limited mode - using serial port polling")
            while self.running:
                try:
                    ports = list(serial.tools.list_ports.comports())
                    for port in ports:
                        if any(x in port.device for x in ["ttyUSB", "ttyACM", "COM"]):
                            callback("add", port.device)
                    time.sleep(1)
                except Exception as e:
                    logger.error(f"Error in device polling: {e}")
                    time.sleep(1)
            return

        if not self.monitor:
            logger.error("Monitor not initialized")
            return

        try:
            for device in iter(self.monitor.poll, None):
                if device.action in ("add", "remove"):
                    device_node = device.device_node
                    
                    if device.action == "add":
                        if self.validate_device(device):
                            logger.info(f"Valid ESP8266 device detected: {device_node}")
                            callback(device.action, device_node)
                        else:
                            logger.debug(f"Ignoring unsupported device: {device_node}")
                    else:  # remove
                        logger.info(f"Device removed: {device_node}")
                        callback(device.action, device_node)

        except Exception as e:
            logger.error(f"Error in device monitoring: {e}")
        finally:
            self.stop()

    def stop(self) -> None:
        """Stop the USB manager"""
        self.running = False
        logger.info("USB Manager stopped")

def monitor_usb_devices(callback: Callable[[str, str], None]) -> None:
    """Wrapper function to maintain backward compatibility"""
    manager = USBManager()
    manager.monitor_devices(callback)

def main() -> None:
    # Example usage
    def device_callback(action: str, device_node: str) -> None:
        if action == "add":
            logger.info(f"ESP8266 connected: {device_node}")
        else:
            logger.info(f"ESP8266 disconnected: {device_node}")
    
    manager = USBManager()
    manager.monitor_devices(device_callback)
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        manager.stop()

if __name__ == "__main__":
    main() 