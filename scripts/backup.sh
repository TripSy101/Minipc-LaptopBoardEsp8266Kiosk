#!/bin/bash

# Backup script for ESQUIMA system

# Configuration
BACKUP_DIR="/home/esquima1/backups"
DB_PATH="/home/esquima1/esquima/data/esquima.db"
LOG_PATH="/home/esquima1/esquima/logs"
CONFIG_PATH="/home/esquima1/esquima/backend"
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/esquima_backup_$TIMESTAMP.tar.gz"

# Create backup
echo "Creating backup..."
tar -czf "$BACKUP_FILE" \
    "$DB_PATH" \
    "$LOG_PATH" \
    "$CONFIG_PATH" \
    --exclude="*.pyc" \
    --exclude="__pycache__" \
    --exclude="node_modules"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup created successfully: $BACKUP_FILE"
    
    # Remove old backups
    find "$BACKUP_DIR" -name "esquima_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
    echo "Removed backups older than $RETENTION_DAYS days"
else
    echo "Backup failed!"
    exit 1
fi

# Verify backup
echo "Verifying backup..."
if tar -tzf "$BACKUP_FILE" > /dev/null; then
    echo "Backup verification successful"
else
    echo "Backup verification failed!"
    exit 1
fi

# Log backup completion
echo "$(date): Backup completed successfully" >> "$LOG_PATH/backup.log"

exit 0 