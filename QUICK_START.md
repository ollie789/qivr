# Quick Start Guide - Patient Portal

## Prerequisites Installation

### 1. Install Node.js (Required)

**Option A: Using Homebrew (Recommended for macOS)**
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

**Option B: Direct Download**
- Visit https://nodejs.org/
- Download and install the LTS version

### 2. Install .NET SDK (Required for backend)

**Option A: Using Homebrew**
```bash
brew install --cask dotnet-sdk
```

**Option B: Direct Download**
- Visit https://dotnet.microsoft.com/download
- Download .NET 8.0 SDK

## Running the Patient Portal (Frontend Only)

### Step 1: Install Dependencies
```bash
cd /Users/oliver/Projects/qivr/apps/patient-portal
npm install
```

### Step 2: Start the Development Server
```bash
npm run dev
```

The Patient Portal will be available at http://localhost:3002

## What You'll See

With the current setup:
- ✅ **Authentication**: Automatically logged in as "Test Patient" in development mode
- ✅ **Dashboard**: Mock data for appointments, evaluations, and messages
- ✅ **Pages**: All pages will load with sample data
- ⚠️ **Backend**: API calls will fail (but the UI will still work with mock data)

## Navigation

Once running, you can navigate to:
- Dashboard: http://localhost:3002/
- Evaluations: http://localhost:3002/evaluations
- Medical Records: http://localhost:3002/medical-records
- Messages: http://localhost:3002/messages
- Settings: http://localhost:3002/settings

## Troubleshooting

### Port Already in Use
If port 3002 is already in use:
```bash
# Kill the process using port 3002
lsof -ti:3002 | xargs kill -9

# Or use a different port
PORT=3003 npm run dev
```

### Dependencies Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## Next Steps

### Option 1: Continue with Mock Data
The Patient Portal is fully functional with mock data. You can:
- Review the UI/UX
- Test navigation
- See how data would be displayed

### Option 2: Set Up Real Authentication
Follow the `COGNITO_SETUP.md` guide to set up AWS Cognito for real authentication.

### Option 3: Connect to Backend
To connect to the real backend API:
1. Fix the backend compilation errors (duplicate DTOs)
2. Set up a PostgreSQL database
3. Run database migrations
4. Start the backend API

## Current Authentication Setup

The app uses mock authentication in development mode:
- **Auto-login**: Automatically logs in as a test patient
- **Mock Token**: Creates a fake JWT token for development
- **No Backend Required**: Works without the API running

To switch to real authentication:
1. Set up AWS Cognito (see COGNITO_SETUP.md)
2. Update environment variables
3. Set `NODE_ENV=production` to disable mock auth
