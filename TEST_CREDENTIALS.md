# Qivr Platform - Test Credentials & URLs

## 🌐 Running Services

### Frontend Applications
- **Patient Portal**: http://localhost:3002
- **Clinic Dashboard**: http://localhost:3001
- **Widget (3D Intake)**: http://localhost:5173

### Backend Services
- **API**: http://localhost:5000
- **Swagger Docs**: http://localhost:5000/swagger

### Infrastructure
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MinIO Console**: http://localhost:9001
- **Mailhog (Email Testing)**: http://localhost:8025

## 🔐 Test Login Credentials

### Patient Portal (http://localhost:3002)
```
Email: demo@qivr.health
Password: Demo123!
```

### Clinic Dashboard (http://localhost:3001)
```
Email: clinic@qivr.health
Password: Clinic123!
```

## 📝 Sign Up
You can create new accounts through the sign-up page. The mock authentication service will accept any valid email format.

## 🔗 Social Login
Currently using mock authentication for local development. Social login buttons will simulate the flow but won't connect to actual providers.

## ⚠️ Important Notes
- These are MOCK credentials for local development only
- Real AWS Cognito integration requires AWS account setup
- All data is stored locally in Docker containers
- Email notifications will appear in Mailhog at http://localhost:8025

## 🚀 Quick Test Steps

1. **Test Patient Portal Login**:
   - Go to http://localhost:3002
   - Click "Sign In"
   - Use credentials: demo@qivr.health / Demo123!

2. **Test Sign Up**:
   - Go to http://localhost:3002
   - Click "Sign Up"
   - Fill in any details (use any email)
   - Password must be 8+ characters with uppercase, lowercase, and number

3. **View Widget**:
   - Go to http://localhost:5173
   - This is the embeddable intake widget with 3D body mapping

4. **Check API**:
   - Go to http://localhost:5000/swagger
   - Test API endpoints directly

## 🛠️ Troubleshooting

If login isn't working:
1. Check backend is running: `tail -f logs/backend.log`
2. Restart backend: `pkill -f dotnet && cd backend/Qivr.Api && dotnet run &`
3. Check browser console for errors (F12)

If services aren't responding:
```bash
./scripts/health-check.sh
```

To restart everything:
```bash
./scripts/stop-all.sh
./scripts/start-all.sh
```
