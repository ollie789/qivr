#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Qivr Platform...${NC}"
echo "=============================="

# Function to kill process by PID
kill_pid() {
    if [ -f "/Users/oliver/Projects/qivr/.pids/$1.pid" ]; then
        PID=$(cat /Users/oliver/Projects/qivr/.pids/$1.pid)
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping $1 (PID: $PID)...${NC}"
            kill -9 $PID 2>/dev/null
            echo -e "${GREEN}✓ $1 stopped${NC}"
        else
            echo -e "${YELLOW}$1 was not running${NC}"
        fi
        rm /Users/oliver/Projects/qivr/.pids/$1.pid
    fi
}

# Function to kill process on port
kill_port() {
    if lsof -i :$1 > /dev/null 2>&1; then
        echo -e "${YELLOW}Killing process on port $1...${NC}"
        lsof -ti :$1 | xargs kill -9 2>/dev/null
    fi
}

# Kill processes by PID files
kill_pid "backend"
kill_pid "clinic"
kill_pid "patient"
kill_pid "widget"

# Also kill by port in case PIDs are stale
echo -e "\n${YELLOW}Cleaning up any remaining processes...${NC}"
kill_port 5000
kill_port 3000
kill_port 3001
kill_port 3002

echo -e "\n${GREEN}All Qivr applications stopped!${NC}"
