# QIVR - Healthcare Platform

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start all services
./start-all.sh
```

## 📍 Service URLs

| Service | Port | URL |
|---------|------|-----|
| **Backend API** | 5000 | http://localhost:5000/api |
| **Patient Portal** | 3000 | http://localhost:3000 |
| **Clinic Dashboard** | 3001 | http://localhost:3001 |

## 🔑 Test Credentials

**Clinic Dashboard:**
- Email: `clinic@qivr.health`
- Password: `Clinic123!`

**Patient Portal:**
- Email: `patient@qivr.health`
- Password: `Patient123!`

## 📁 Project Structure

```
qivr/
├── apps/
│   ├── clinic-dashboard/   # React clinic management app
│   ├── patient-portal/     # React patient app
│   └── widget/             # Embeddable widget
├── backend/                # .NET Core API
├── infrastructure/         # Terraform & deployment
└── docs/                   # Documentation
```

## 🛠 Development

- [SETUP.md](SETUP.md) - Initial setup instructions
- [PORTS.md](PORTS.md) - Port configuration reference
- [QUICK_START.md](QUICK_START.md) - Quick development guide

## 📝 License

Proprietary - All rights reserved
