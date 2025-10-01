#!/bin/bash

echo "Starting QIVR Services..."
echo ""

# Start backend
echo "Starting Backend API on port 5050..."
cd /Users/oliver/Projects/qivr/backend
nohup dotnet run --project Qivr.Api --urls "http://localhost:5050" > /tmp/backend.log 2>&1 &
echo "Backend PID: $!"

# Wait for backend to start
sleep 5

# Start Patient Portal
echo "Starting Patient Portal on port 3005..."
cd /Users/oliver/Projects/qivr/apps/patient-portal
nohup npm run dev > /tmp/patient-portal.log 2>&1 &
echo "Patient Portal PID: $!"

# Start Clinic Dashboard  
echo "Starting Clinic Dashboard on port 3010..."
cd /Users/oliver/Projects/qivr/apps/clinic-dashboard
nohup npm run dev > /tmp/clinic-dashboard.log 2>&1 &
echo "Clinic Dashboard PID: $!"

# Wait for everything to start
sleep 10

echo ""
echo "Services started! Checking status..."
echo ""

# Check if services are running
if lsof -i :5050 -P | grep -q LISTEN; then
  echo "✅ Backend API: http://localhost:5050"
else
  echo "❌ Backend API failed to start"
fi

if lsof -i :3005 -P | grep -q LISTEN; then
  echo "✅ Patient Portal: http://localhost:3005"
else
  echo "❌ Patient Portal failed to start"
fi

if lsof -i :3010 -P | grep -q LISTEN; then
  echo "✅ Clinic Dashboard: http://localhost:3010"
else
  echo "❌ Clinic Dashboard failed to start"
fi

echo ""
echo "Logs available at:"
echo "  Backend: /tmp/backend.log"
echo "  Patient Portal: /tmp/patient-portal.log"
echo "  Clinic Dashboard: /tmp/clinic-dashboard.log"