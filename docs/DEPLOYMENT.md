# Deployment Guide

This document outlines the process for deploying the Minipc-LaptopBoardEsp8266Kiosk application to production.

## Prerequisites

- Node.js 16+
- Python 3.8+
- PostgreSQL (optional, SQLite is used by default)
- Nginx (recommended for production)
- Systemd (for service management)

## Deployment Steps

### 1. Server Setup

1. Update system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

2. Install required system packages:
```bash
sudo apt install -y python3-pip python3-venv nodejs npm nginx
```

3. Install PostgreSQL (optional):
```bash
sudo apt install -y postgresql postgresql-contrib
```

### 2. Application Deployment

1. Clone the repository:
```bash
git clone https://github.com/TripSy101/Minipc-LaptopBoardEsp8266Kiosk.git
cd Minipc-LaptopBoardEsp8266Kiosk
```

2. Run the production build script:
```bash
chmod +x scripts/build_prod.sh
./scripts/build_prod.sh
```

3. Extract the deployment package:
```bash
tar -xzf dist/deployment.tar.gz -C /opt/kiosk
```

4. Set up environment:
```bash
cd /opt/kiosk
cp .env.example .env
# Edit .env with production settings
```

### 3. Database Setup

1. If using PostgreSQL:
```bash
sudo -u postgres psql
CREATE DATABASE kiosk_db;
CREATE USER kiosk_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE kiosk_db TO kiosk_user;
```

2. Run migrations:
```bash
cd /opt/kiosk/backend
alembic upgrade head
```

### 4. Service Setup

1. Create systemd service file:
```bash
sudo nano /etc/systemd/system/kiosk.service
```

Add the following content:
```ini
[Unit]
Description=Kiosk Application
After=network.target

[Service]
User=kiosk
WorkingDirectory=/opt/kiosk
Environment="PATH=/opt/kiosk/venv/bin"
ExecStart=/opt/kiosk/venv/bin/python backend/app_server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

2. Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/kiosk
```

Add the following content:
```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/kiosk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Start Services

1. Start the application:
```bash
sudo systemctl start kiosk
sudo systemctl enable kiosk
```

2. Verify the service is running:
```bash
sudo systemctl status kiosk
```

## Monitoring

1. Check application logs:
```bash
tail -f /opt/kiosk/logs/app.log
```

2. Check error logs:
```bash
tail -f /opt/kiosk/logs/error.log
```

## Backup and Recovery

1. Database backups are automatically created daily using the backup script:
```bash
/opt/kiosk/scripts/backup_db.py
```

2. To restore from backup:
```bash
# For SQLite
sqlite3 /opt/kiosk/backend/app.db < backup_file.sql

# For PostgreSQL
pg_restore -d kiosk_db backup_file.sql
```

## Troubleshooting

1. Check service status:
```bash
sudo systemctl status kiosk
```

2. Check Nginx status:
```bash
sudo systemctl status nginx
```

3. Check logs:
```bash
sudo journalctl -u kiosk
```

## Security Considerations

1. Keep the system updated:
```bash
sudo apt update && sudo apt upgrade
```

2. Configure firewall:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

3. Enable HTTPS using Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

## Maintenance

1. Regular updates:
```bash
cd /opt/kiosk
git pull
./scripts/build_prod.sh
sudo systemctl restart kiosk
```

2. Database maintenance:
```bash
# Vacuum SQLite database
sqlite3 /opt/kiosk/backend/app.db "VACUUM;"

# PostgreSQL maintenance
sudo -u postgres vacuumdb --analyze kiosk_db
``` 