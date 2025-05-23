# API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
All API endpoints require authentication using a JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Device Management

#### Get All Devices
```http
GET /devices
```
Returns a list of all connected devices.

Response:
```json
{
  "devices": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "status": "string",
      "lastSeen": "string"
    }
  ]
}
```

#### Get Device by ID
```http
GET /devices/{deviceId}
```
Returns details for a specific device.

Response:
```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "status": "string",
  "lastSeen": "string",
  "details": {
    "firmware": "string",
    "version": "string",
    "capabilities": ["string"]
  }
}
```

#### Update Device
```http
PUT /devices/{deviceId}
```
Update device settings.

Request:
```json
{
  "name": "string",
  "settings": {
    "key": "value"
  }
}
```

### Firmware Management

#### Upload Firmware
```http
POST /firmware/upload
```
Upload new firmware for devices.

Request:
```http
Content-Type: multipart/form-data
file: <firmware_file>
```

#### Get Firmware Versions
```http
GET /firmware/versions
```
Returns a list of available firmware versions.

Response:
```json
{
  "versions": [
    {
      "version": "string",
      "releaseDate": "string",
      "description": "string"
    }
  ]
}
```

### System Management

#### Get System Status
```http
GET /system/status
```
Returns the current system status.

Response:
```json
{
  "status": "string",
  "uptime": "string",
  "version": "string",
  "resources": {
    "cpu": "number",
    "memory": "number",
    "disk": "number"
  }
}
```

#### Update System Settings
```http
PUT /system/settings
```
Update system settings.

Request:
```json
{
  "settings": {
    "key": "value"
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "string",
  "message": "string"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
``` 