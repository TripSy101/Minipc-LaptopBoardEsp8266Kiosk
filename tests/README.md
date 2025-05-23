# ESQUIMA Test Suite

## Directory Structure
```
tests/
├── unit/              # Unit tests
│   ├── backend/       # Backend unit tests
│   ├── frontend/      # Frontend unit tests
│   └── firmware/      # ESP8266 firmware tests
├── integration/       # Integration tests
│   ├── api/          # API integration tests
│   └── hardware/     # Hardware integration tests
└── e2e/              # End-to-end tests
    ├── ui/           # UI tests
    └── system/       # System tests
```

## Running Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Test Coverage
- Unit Tests: 80% minimum coverage
- Integration Tests: 70% minimum coverage
- E2E Tests: Critical path coverage 