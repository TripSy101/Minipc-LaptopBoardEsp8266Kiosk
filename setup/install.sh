#!/bin/bash

# ESQUIMA Kiosk Setup Script
# This script sets up the ESQUIMA Kiosk system on Ubuntu 24.04.2 LTS

# Exit on error
set -e

# Variables
PROJECT_DIR=$(pwd)
AUTOSTART_DIR="$HOME/.config/autostart"
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Function to print status messages
print_status() {
  echo -e "${YELLOW}[*] $1${RESET}"
}

print_success() {
  echo -e "${GREEN}[+] $1${RESET}"
}

print_error() {
  echo -e "${RED}[-] $1${RESET}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  print_error "Please do not run this script as root"
  exit 1
fi

# Update package lists
print_status "Updating package lists..."
sudo apt-get update

# Install required packages
print_status "Installing required packages..."
sudo apt-get install -y \
  python3 python3-pip python3-venv \
  xdotool unclutter \
  nodejs npm \
  sqlite3 \
  python3-serial \
  x11-xserver-utils

# Create Python virtual environment
print_status "Setting up Python virtual environment..."
python3 -m venv "$PROJECT_DIR/venv"
source "$PROJECT_DIR/venv/bin/activate"

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install pyserial

# Build the Tauri application
print_status "Building the application..."
cd "$PROJECT_DIR"
npm install
npm run build

# Setup systemd service for backend server
print_status "Setting up systemd service for backend server..."
mkdir -p "$SYSTEMD_USER_DIR"

cat > "$SYSTEMD_USER_DIR/esquima-backend.service" << EOF
[Unit]
Description=ESQUIMA Kiosk Backend Server
After=network.target

[Service]
Type=simple
WorkingDirectory=$PROJECT_DIR
ExecStart=$PROJECT_DIR/venv/bin/python3 $PROJECT_DIR/backend/app_server.py
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=default.target
EOF

# Setup autostart for kiosk mode
print_status "Setting up kiosk autostart..."
mkdir -p "$AUTOSTART_DIR"

cat > "$AUTOSTART_DIR/esquima-kiosk.desktop" << EOF
[Desktop Entry]
Type=Application
Name=ESQUIMA Kiosk
Exec=bash -c "cd $PROJECT_DIR && ./setup/start_kiosk.sh"
Terminal=false
X-GNOME-Autostart-enabled=true
EOF

# Create kiosk startup script
print_status "Creating kiosk startup script..."
cat > "$PROJECT_DIR/setup/start_kiosk.sh" << EOF
#!/bin/bash

# Wait for desktop to fully load
sleep 5

# Disable screen blanking and screensaver
xset s off
xset -dpms
xset s noblank

# Hide mouse cursor when not in use
unclutter -idle 3 -root &

# Start the application in fullscreen
cd $PROJECT_DIR
npm run tauri dev

EOF

chmod +x "$PROJECT_DIR/setup/start_kiosk.sh"

# Setup udev rules for USB serial devices
print_status "Setting up udev rules for USB serial devices..."
sudo tee /etc/udev/rules.d/99-esquima-usb.rules > /dev/null << EOF
# CP210x USB to UART Bridge
SUBSYSTEM=="tty", ATTRS{idVendor}=="10c4", ATTRS{idProduct}=="ea60", SYMLINK+="esquima_esp", GROUP="dialout", MODE="0666"

# CH340 USB to UART
SUBSYSTEM=="tty", ATTRS{idVendor}=="1a86", ATTRS{idProduct}=="7523", SYMLINK+="esquima_esp", GROUP="dialout", MODE="0666"

# FTDI USB to UART
SUBSYSTEM=="tty", ATTRS{idVendor}=="0403", ATTRS{idProduct}=="6001", SYMLINK+="esquima_esp", GROUP="dialout", MODE="0666"
EOF

# Reload udev rules
sudo udevadm control --reload-rules

# Add user to dialout group for serial port access
sudo usermod -a -G dialout $USER

# Enable services
print_status "Enabling services..."
systemctl --user daemon-reload
systemctl --user enable esquima-backend.service

# Create data directory
mkdir -p "$PROJECT_DIR/data"

# Finalize setup
print_success "ESQUIMA Kiosk setup complete!"
print_status "Please reboot your system to complete the installation."
print_status "After reboot, the kiosk will start automatically."