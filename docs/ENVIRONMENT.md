# Environment Variables

This document describes all environment variables used in the application.

## Required Variables

### Server Configuration
- `PORT`: Port number for the server (default: 5000)
- `HOST`: Host address (default: localhost)
- `DEBUG`: Enable debug mode (default: false)

### Database Configuration
- `DATABASE_URL`: Database connection URL
  - SQLite format: `sqlite:///app.db`
  - PostgreSQL format: `postgresql://user:password@localhost:5432/dbname`

### Security
- `JWT_SECRET`: Secret key for JWT token generation
- `API_KEY`: API key for external services

### ESP8266 Configuration
- `ESP8266_BAUD_RATE`: Serial communication baud rate (default: 115200)
- `ESP8266_TIMEOUT`: Serial communication timeout in seconds (default: 1)
- `ESP8266_RETRY_COUNT`: Number of retry attempts (default: 3)

## Optional Variables

### Logging
- `LOG_LEVEL`: Logging level (default: INFO)
  - Options: DEBUG, INFO, WARNING, ERROR, CRITICAL
- `LOG_FILE`: Path to log file (default: logs/app.log)

### Frontend Configuration
- `VITE_API_URL`: API URL for frontend (default: http://localhost:5000)
- `VITE_WS_URL`: WebSocket URL for frontend (default: ws://localhost:5000)

## Development Variables
- `NODE_ENV`: Node environment (development/production)
- `PYTHONPATH`: Python path for development
- `TEST_DATABASE_URL`: Database URL for testing

## Production Variables
- `SSL_CERT_PATH`: Path to SSL certificate
- `SSL_KEY_PATH`: Path to SSL private key
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins
- `RATE_LIMIT`: API rate limit (requests per minute)

## Security Notes

1. Never commit `.env` files to version control
2. Use strong, unique values for secrets
3. Rotate secrets regularly
4. Use different values for development and production
5. Keep production secrets secure and limited to production environment

## Example Configuration

```bash
# Server
PORT=5000
HOST=localhost
DEBUG=false

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kiosk_db

# Security
JWT_SECRET=your-secure-jwt-secret
API_KEY=your-api-key

# ESP8266
ESP8266_BAUD_RATE=115200
ESP8266_TIMEOUT=1
ESP8266_RETRY_COUNT=3

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log

# Frontend
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

## Setting Up Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` with your configuration:
```bash
nano .env
```

3. For production, use a secure method to set environment variables:
```bash
# Systemd service
Environment="DATABASE_URL=postgresql://user:password@localhost:5432/kiosk_db"
Environment="JWT_SECRET=your-secure-jwt-secret"

# Docker
docker run -e DATABASE_URL=postgresql://user:password@localhost:5432/kiosk_db ...
``` 