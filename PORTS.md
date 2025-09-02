# QIVR Port Reference Card

## 🚀 STANDARDIZED PORTS - ALWAYS USE THESE

| Service | Port | URL |
|---------|------|-----|
| **Backend API** | `5000` | http://localhost:5000/api |
| **Patient Portal** | `3000` | http://localhost:3000 |
| **Clinic Dashboard** | `3001` | http://localhost:3001 |
| **PostgreSQL** | `5432` | - |
| **Widget** (if used) | `3003` | http://localhost:3003 |

## 🛑 DO NOT USE THESE PORTS
- ❌ 5001 (old backend port)
- ❌ 3002 (old patient portal port)  
- ❌ 5173 (default Vite port)

## 📝 Quick Commands

### Start Everything (Recommended)
```bash
./start-all.sh
```

### Start Individual Services
```bash
# Backend (port 5000)
cd backend && dotnet run --urls "http://localhost:5000"

# Patient Portal (port 3000)
cd apps/patient-portal && PORT=3000 npm run dev

# Clinic Dashboard (port 3001)
cd apps/clinic-dashboard && PORT=3001 npm run dev
```

### Check What's Running
```bash
lsof -i :5000  # Check backend
lsof -i :3000  # Check patient portal
lsof -i :3001  # Check clinic dashboard
```

### Kill Services on Ports
```bash
lsof -ti:5000 | xargs kill -9  # Kill backend
lsof -ti:3000 | xargs kill -9  # Kill patient portal  
lsof -ti:3001 | xargs kill -9  # Kill clinic dashboard
```

## ⚙️ Environment Variables

All `.env` files should use:
```env
VITE_API_URL=http://localhost:5000/api
```

## 🔴 IMPORTANT
**NEVER CHANGE THESE PORTS** - All configurations, scripts, and documentation assume these standard ports.
