# Minipc-LaptopBoardEsp8266Kiosk

A kiosk application for managing ESP8266-based laptop boards with a modern web interface.

## Project Structure

```
├── backend/               # Python backend server
│   ├── esp8266_firmware/  # ESP8266 firmware files
│   ├── app_server.py     # Main server application
│   ├── serial_manager.py # Serial communication manager
│   └── usb_manager.py    # USB device management
├── src/                  # Frontend React/TypeScript application
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── store/           # State management
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── tests/               # Test files
├── docs/                # Documentation
└── scripts/             # Utility scripts
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