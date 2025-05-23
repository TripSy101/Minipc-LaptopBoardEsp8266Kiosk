# Minipc-LaptopBoardEsp8266Kiosk

A kiosk application for managing ESP8266-based laptop boards with a modern web interface.

## Project Structure

```
├── .github/                      # GitHub configuration
│   └── workflows/               # CI/CD workflows
│       ├── ci.yml              # Continuous Integration
│       └── security.yml        # Security scanning
│
├── src-tauri/                   # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs            # Main application entry
│   │   ├── hardware.rs        # Hardware management
│   │   └── database.rs        # Database operations
│   ├── Cargo.toml             # Rust dependencies
│   └── tauri.conf.json        # Tauri configuration
│
├── src/                        # Frontend source (React/TypeScript)
│   ├── components/            # React components
│   │   ├── admin/            # Admin panel components
│   │   │   ├── AdminPanel.tsx
│   │   │   ├── HeaderConfig.tsx
│   │   │   ├── LogViewer.tsx
│   │   │   ├── ServiceSettings.tsx
│   │   │   └── SystemSettings.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── PaymentModal.tsx
│   │   ├── ServiceCard.tsx
│   │   ├── ServiceGrid.tsx
│   │   ├── SplashScreen.tsx
│   │   └── StatusIndicator.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAdminPanel.ts
│   │   ├── useOrientation.ts
│   │   └── useSerialConnection.ts
│   ├── store/                 # State management
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Utility functions
│   ├── App.tsx               # Main application component
│   └── main.tsx              # Frontend entry point
│
├── backend/                    # Python backend
│   ├── esp8266_firmware/      # ESP8266 firmware
│   │   └── esp8266_firmware.ino
│   ├── migrations/           # Database migrations
│   ├── app_server.py         # Main server
│   ├── logging_config.py     # Logging configuration
│   ├── serial_manager.py     # Serial communication
│   ├── usb_manager.py        # USB device management
│   └── requirements.txt      # Python dependencies
│
├── tests/                     # Test files
│   ├── test_database.rs      # Database tests
│   └── test_hardware.rs      # Hardware tests
│
├── docs/                      # Documentation
│   ├── API.md                # API documentation
│   ├── DEPLOYMENT.md         # Deployment guide
│   ├── ENVIRONMENT.md        # Environment setup
│   └── README.md             # Documentation overview
│
├── scripts/                   # Utility scripts
│   ├── backup.sh             # Backup script
│   ├── backup_db.py          # Database backup
│   └── build_prod.sh         # Production build
│
├── setup/                     # Setup scripts
│   └── install.sh            # Installation script
│
├── .gitignore                # Git ignore rules
├── .pre-commit-config.yaml   # Pre-commit hooks
├── SECURITY.md               # Security documentation
├── LICENSE                   # Project license
├── README.md                 # Project overview
├── package.json              # Node.js dependencies
├── package-lock.json         # Node.js lock file
├── tailwind.config.js        # Tailwind CSS config
├── eslint.config.js          # ESLint configuration
├── index.html                # HTML entry point
├── postcss.config.js         # PostCSS configuration
├── tsconfig.json             # TypeScript config
├── tsconfig.app.json         # App-specific TS config
├── tsconfig.node.json        # Node-specific TS config
└── vite.config.ts            # Vite configuration
```

## Prerequisites

- Node.js 16+
- Python 3.8+
- ESP8266 development board
- USB-to-Serial adapter

## Setup

1. Clone the repository:
```bash
git clone https://github.com/TripSy101/Minipc-LaptopBoardEsp8266Kiosk.git
cd Minipc-LaptopBoardEsp8266Kiosk
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Copy `.env.example` to `.env` and configure your environment variables:
```bash
cp .env.example .env
```

5. Start the development servers:
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd backend
python app_server.py
```

## Development

- Frontend: `npm run dev`
- Backend: `python app_server.py`
- Tests: `npm run test`
- Build: `npm run build`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

Please report any security issues to [security@example.com](mailto:security@example.com)

## Support

For support, please open an issue in the GitHub repository or contact the maintainers. 