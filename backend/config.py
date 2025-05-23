import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Serial settings
SERIAL_SETTINGS = {
    "baudrate": 9600,
    "timeout": 1,
    "write_timeout": 1,
    "inter_byte_timeout": 0.1
}

# USB settings
USB_SETTINGS = {
    "subsystem": "tty",
    "vendor_ids": {
        "CH340": "1a86:7523",
        "CP210x": "10c4:ea60"
    }
}

# Logging settings
LOG_SETTINGS = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "INFO",
            "formatter": "standard",
            "stream": "ext://sys.stdout"
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "DEBUG",
            "formatter": "standard",
            "filename": str(LOG_DIR / "app.log"),
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5
        }
    },
    "loggers": {
        "": {  # Root logger
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": True
        },
        "serial": {
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": False
        },
        "usb": {
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": False
        }
    }
}

# Application settings
APP_SETTINGS = {
    "reconnect_attempts": 3,
    "reconnect_delay": 5,  # seconds
    "health_check_interval": 30,  # seconds
} 