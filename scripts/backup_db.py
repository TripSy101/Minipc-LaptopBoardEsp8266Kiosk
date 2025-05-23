#!/usr/bin/env python3
import os
import sys
import subprocess
from datetime import datetime
from pathlib import Path
import logging
from logging_config import get_logger

logger = get_logger('backup')

def create_backup_dir():
    """Create backup directory if it doesn't exist."""
    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)
    return backup_dir

def get_backup_filename():
    """Generate backup filename with timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"backup_{timestamp}.sql"

def backup_database():
    """Create a backup of the database."""
    try:
        backup_dir = create_backup_dir()
        backup_file = backup_dir / get_backup_filename()
        
        # Get database URL from environment
        db_url = os.getenv("DATABASE_URL", "sqlite:///app.db")
        
        if db_url.startswith("sqlite"):
            # SQLite backup
            db_path = db_url.replace("sqlite:///", "")
            subprocess.run(["sqlite3", db_path, f".backup '{backup_file}'"], check=True)
        elif db_url.startswith("postgresql"):
            # PostgreSQL backup
            subprocess.run([
                "pg_dump",
                "-F", "c",  # Custom format
                "-f", str(backup_file),
                db_url
            ], check=True)
        else:
            logger.error(f"Unsupported database type: {db_url}")
            sys.exit(1)
            
        logger.info(f"Backup created successfully: {backup_file}")
        
        # Clean up old backups (keep last 7 days)
        cleanup_old_backups(backup_dir)
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Backup failed: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error during backup: {e}")
        sys.exit(1)

def cleanup_old_backups(backup_dir, days_to_keep=7):
    """Remove backups older than specified days."""
    try:
        current_time = datetime.now()
        for backup_file in backup_dir.glob("backup_*.sql"):
            file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
            age_days = (current_time - file_time).days
            
            if age_days > days_to_keep:
                backup_file.unlink()
                logger.info(f"Removed old backup: {backup_file}")
    except Exception as e:
        logger.error(f"Error cleaning up old backups: {e}")

if __name__ == "__main__":
    backup_database() 