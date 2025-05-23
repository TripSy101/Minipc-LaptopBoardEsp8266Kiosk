#!/usr/bin/env python3
import os
import sys
import json
import time
import logging
import threading
import sqlite3
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.serial_manager import (
    SerialManager, setup_database, get_services, get_logs, 
    update_service, get_setting, update_setting
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs", "app.log")),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("esquima-server")

# Create logs directory if it doesn't exist
os.makedirs(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs"), exist_ok=True)

# Global variables
serial_manager = SerialManager()
messages = []

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
                    'connected': serial_manager.connected,
                    'last_message': serial_manager.get_last_message(),
                    'port': serial_manager.port
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
                
                response = {'success': success}
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
                port = data.get('port')
                baudrate = data.get('baudrate', 9600)
                
                if port:
                    serial_manager.port = port
                    serial_manager.baudrate = baudrate
                
                success = serial_manager.connect()
                self.send_response(200 if success else 500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {'success': success}
                if not success:
                    response['error'] = 'Failed to connect to ESP8266'
                
                self.wfile.write(json.dumps(response).encode())
            
            # Disconnect from ESP8266
            elif path == '/api/esp/disconnect':
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

def message_callback(message):
    """Callback function for messages from ESP8266"""
    global messages
    messages.append(message)
    # Keep only the last 100 messages
    if len(messages) > 100:
        messages = messages[-100:]

def run_server(port=8000):
    """Run the HTTP server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, ESPControlHandler)
    logger.info(f"Starting server on port {port}")
    httpd.serve_forever()

def main():
    """Main function"""
    # Setup database
    setup_database()
    
    # Set callback for ESP8266 messages
    serial_manager.set_callback(message_callback)
    
    # Try to connect to ESP8266
    if not serial_manager.connect():
        logger.warning("Failed to connect to ESP8266. Will retry in background.")
    
    # Start HTTP server
    server_thread = threading.Thread(target=run_server)
    server_thread.daemon = True
    server_thread.start()
    
    try:
        # Keep main thread alive
        while True:
            time.sleep(1)
    
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        serial_manager.disconnect()
        sys.exit(0)

if __name__ == "__main__":
    main()