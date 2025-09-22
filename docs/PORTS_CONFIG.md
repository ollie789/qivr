# Port Configuration

## Service Port Mappings

| Service | Default Port | Alternative | Environment Variable |
|---------|-------------|------------|---------------------|
| Backend API | 5050 | 5000 | API_PORT |
| Clinic Dashboard | 3001 | 3010 | CLINIC_PORT |
| Patient Portal | 3000 | 3005 | PATIENT_PORT |
| Widget | 3003 | - | WIDGET_PORT |
| PostgreSQL | 5432 | - | DB_PORT |
| Redis | 6379 | - | REDIS_PORT |
| MinIO | 9000/9001 | - | MINIO_PORT |
| Mailhog | 1025/8025 | - | MAIL_PORT |
| pgAdmin | 8081 | - | PGADMIN_PORT |

## Port Conflict Resolution

### macOS AirPlay Conflict (Port 5000)
The backend API uses port 5050 to avoid conflict with macOS AirPlay.

### User Preferences
Per user preferences:
- Patient Portal: 3005
- Doctor Dashboard: 3010

