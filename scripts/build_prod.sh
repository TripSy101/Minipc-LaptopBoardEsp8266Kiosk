#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting production build...${NC}"

# Create necessary directories
mkdir -p dist
mkdir -p logs
mkdir -p backups

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm ci
cd backend
pip install -r requirements.txt
cd ..

# Run tests
echo -e "${GREEN}Running tests...${NC}"
npm run test
cd backend
pytest
cd ..

# Build frontend
echo -e "${GREEN}Building frontend...${NC}"
npm run build

# Create production configuration
echo -e "${GREEN}Creating production configuration...${NC}"
cp .env.example .env.prod

# Create backup of database
echo -e "${GREEN}Creating database backup...${NC}"
python scripts/backup_db.py

# Run database migrations
echo -e "${GREEN}Running database migrations...${NC}"
cd backend
alembic upgrade head
cd ..

# Create deployment package
echo -e "${GREEN}Creating deployment package...${NC}"
tar -czf dist/deployment.tar.gz \
    dist \
    backend \
    .env.prod \
    package.json \
    package-lock.json \
    README.md \
    LICENSE \
    SECURITY.md

echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "Deployment package created at: ${GREEN}dist/deployment.tar.gz${NC}" 