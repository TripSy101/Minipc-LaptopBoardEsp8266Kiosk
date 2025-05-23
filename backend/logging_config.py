import logging
import logging.handlers
import os
from pathlib import Path

# Create logs directory if it doesn't exist
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

# Logging configuration
def setup_logging():
    # Create formatters
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_formatter = logging.Formatter(
        '%(levelname)s: %(message)s'
    )

    # Create handlers
    # File handler for all logs
    all_logs_handler = logging.handlers.RotatingFileHandler(
        log_dir / "app.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    all_logs_handler.setFormatter(file_formatter)
    all_logs_handler.setLevel(logging.INFO)

    # File handler for errors
    error_logs_handler = logging.handlers.RotatingFileHandler(
        log_dir / "error.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    error_logs_handler.setFormatter(file_formatter)
    error_logs_handler.setLevel(logging.ERROR)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(logging.INFO)

    # Setup root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(all_logs_handler)
    root_logger.addHandler(error_logs_handler)
    root_logger.addHandler(console_handler)

    # Setup specific loggers
    loggers = {
        'app': logging.getLogger('app'),
        'serial': logging.getLogger('serial'),
        'usb': logging.getLogger('usb'),
        'api': logging.getLogger('api'),
    }

    for logger in loggers.values():
        logger.setLevel(logging.INFO)
        logger.propagate = True

    return loggers

# Create a function to get a logger
def get_logger(name):
    return logging.getLogger(name)

# Initialize logging when module is imported
loggers = setup_logging() 