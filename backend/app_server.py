#!/usr/bin/env python3
import os
import sys
import json
import time
import logging
import logging.config
import threading
import sqlite3
from typing import Optional, Dict, Any, List, Union
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from usb_manager import monitor_usb_devices
from serial_manager import SerialManager
from config import LOG_SETTINGS, APP_SETTINGS

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.database import (
    setup_database, get_services, get_logs, 
    update_service, get_setting, update_setting
)

# Configure logging
logging.config.dictConfig(LOG_SETTINGS)
logger = logging.getLogger(__name__)

# Create logs directory if it doesn't exist
os.makedirs(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs"), exist_ok=True)

# Global variables
serial_manager: Optional[SerialManager] = None
messages: List[str] = []

class ESPControlHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query = parse_qs(parsed_path.query)
        
        try:
            # Get services
            if path == '/api/services':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                services = get_services()
                self.wfile.write(json.dumps(services).encode())
            
            # Get logs
            elif path == '/api/logs':
                limit = int(query.get('limit', ['50'])[0])
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                logs = get_logs(limit)
                self.wfile.write(json.dumps(logs).encode())
            
            # Get settings
            elif path == '/api/settings':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                settings = {
                    'admin_password': get_setting('admin_password'),
                    'maintenance_mode': get_setting('maintenance_mode') == 'true'
                }
                self.wfile.write(json.dumps(settings).encode())
            
            # Get ESP status
            elif path == '/api/esp/status':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                status = {
                    'connected': serial_manager.connected if serial_manager else False,
                    'last_message': serial_manager.get_last_message() if serial_manager else None,
                    'port': serial_manager.port if serial_manager else None
                }
                self.wfile.write(json.dumps(status).encode())
            
            # Get ESP messages
            elif path == '/api/esp/messages':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                global messages
                self.wfile.write(json.dumps(messages).encode())
            
            # Invalid endpoint
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Not Found'}).encode())
        
        except Exception as e:
            logger.error(f"Error handling GET request: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(post_data) if post_data else {}
            
            # Send command to ESP8266
            if path == '/api/esp/command':
                if not serial_manager:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Serial manager not initialized'}).encode())
                    return

                command = data.get('command', '')
                if not command:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Command is required'}).encode())
                    return
                
                success = serial_manager.send_command(command)
                self.send_response(200 if success else 500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response: Dict[str, Union[bool, str]] = {'success': success}
                if not success:
                    response['error'] = 'Failed to send command'
                
                self.wfile.write(json.dumps(response).encode())
            
            # Update service
            elif path == '/api/services/update':
                service_id = data.get('id')
                name = data.get('name')
                description = data.get('description')
                price = data.get('price')
                duration = data.get('duration')
                service_type = data.get('type')
                
                if not all([service_id, name, price, duration, service_type]):
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Missing required fields'}).encode())
                    return
                
                success = update_service(service_id, name, description, price, duration, service_type)
                self.send_response(200 if success else 500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {'success': success}
                self.wfile.write(json.dumps(response).encode())
            
            # Update setting
            elif path == '/api/settings/update':
                key = data.get('key')
                value = data.get('value')
                
                if not all([key, value is not None]):
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Missing required fields'}).encode())
                    return
                
                # Convert boolean to string
                if isinstance(value, bool):
                    value = 'true' if value else 'false'
                
                success = update_setting(key, value)
                self.send_response(200 if success else 500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {'success': success}
                self.wfile.write(json.dumps(response).encode())
            
            # Connect to ESP8266
            elif path == '/api/esp/connect':
                global serial_manager
                if not serial_manager:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Serial manager not initialized'}).encode())
                    return

                port = data.get('port')
                baudrate = data.get('baudrate', 9600)
                
                if port:
                    try:
                        serial_manager = SerialManager(port=port, baudrate=baudrate)
                    except Exception as e:
                        self.send_response(500)
                        self.send_header('Content-Type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(json.dumps({'error': f'Failed to initialize serial manager: {e}'}).encode())
                        return
                
                success = serial_manager.connect()
                self.send_response(200 if success else 500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response: Dict[str, Union[bool, str]] = {'success': success}
                if not success:
                    response['error'] = 'Failed to connect to ESP8266'
                
                self.wfile.write(json.dumps(response).encode())
            
            # Disconnect from ESP8266
            elif path == '/api/esp/disconnect':
                if not serial_manager:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Serial manager not initialized'}).encode())
                    return

                serial_manager.disconnect()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                self.wfile.write(json.dumps({'success': True}).encode())
            
            # Invalid endpoint
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Not Found'}).encode())
        
        except Exception as e:
            logger.error(f"Error handling POST request: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

def message_callback(message: str) -> None:
    """Callback function for handling incoming serial messages"""
    global messages
    messages.append(message)
    # Keep only the last 100 messages
    if len(messages) > 100:
        messages = messages[-100:]

def handle_usb_event(action: str, device_node: str) -> None:
    """Handle USB device events"""
    global serial_manager
    if not serial_manager:
        return

    if action == 'add':
        # Try to connect to the new device
        try:
            serial_manager = SerialManager(port=device_node, baudrate=115200)
            if serial_manager.connect():
                logger.info(f"Connected to new device: {device_node}")
        except Exception as e:
            logger.error(f"Failed to connect to device {device_node}: {e}")
    elif action == 'remove':
        # Disconnect if the removed device was our current port
        if serial_manager.port == device_node:
            serial_manager.disconnect()
            logger.info(f"Disconnected from removed device: {device_node}")

def health_check() -> None:
    """Periodic health check of the serial connection"""
    global serial_manager
    if not serial_manager:
        return

    if not serial_manager.connected:
        logger.warning("Serial connection lost, attempting to reconnect...")
        serial_manager.connect()

def run_server(port: int = 8000) -> None:
    """Run the HTTP server"""
    server = HTTPServer(('', port), ESPControlHandler)
    logger.info(f"Server running on port {port}")
    server.serve_forever()

def main() -> None:
    """Main function"""
    global serial_manager
    
    # Initialize serial manager
    serial_manager = SerialManager(port='', baudrate=115200)
    serial_manager.set_callback(message_callback)
    
    # Start USB monitoring in a separate thread
    usb_thread = threading.Thread(target=monitor_usb_devices, args=(handle_usb_event,))
    usb_thread.daemon = True
    usb_thread.start()
    
    # Start health check in a separate thread
    health_thread = threading.Thread(target=lambda: [time.sleep(30), health_check()])
    health_thread.daemon = True
    health_thread.start()
    
    # Run the server
    run_server()

if __name__ == '__main__':
    main()