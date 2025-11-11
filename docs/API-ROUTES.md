# Qivr API Routes Documentation

**Base URL**: `https://clinic.qivr.pro/api`

## 🔐 Authentication Routes
**Base**: `/api/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | User login | ❌ |
| POST | `/register` | User registration | ❌ |
| POST | `/signup` | Alias for register | ❌ |
| GET | `/user-info` | Get current user info | ✅ |
| POST | `/refresh` | Refresh auth token | ✅ |
| POST | `/logout` | User logout | ✅ |
| POST | `/confirm-signup` | Confirm email signup | ❌ |
| POST | `/forgot-password` | Request password reset | ❌ |
| POST | `/confirm-forgot-password` | Confirm password reset | ❌ |
| POST | `/change-password` | Change user password | ✅ |
| POST | `/mfa/setup` | Setup MFA | ✅ |
| POST | `/mfa/verify` | Verify MFA | ✅ |
| PUT | `/user-attributes` | Update user attributes | ✅ |

## 👥 Patients Routes
**Base**: `/api/patients`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List patients (cursor pagination) | ✅ |
| GET | `/page` | List patients (traditional pagination) | ✅ |
| GET | `/search?query={q}` | Search patients | ✅ |
| GET | `/{patientId}` | Get patient details | ✅ |
| POST | `/` | Create new patient | ✅ |
| PUT | `/{patientId}` | Update patient | ✅ |
| DELETE | `/{patientId}` | Delete patient (soft delete) | ✅ |

## 📅 Appointments Routes
**Base**: `/api/appointments`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List appointments | ✅ |
| GET | `/page` | List appointments (paginated) | ✅ |
| GET | `/{id}` | Get appointment details | ✅ |
| POST | `/` | Create appointment | ✅ |
| PUT | `/{id}` | Update appointment | ✅ |
| DELETE | `/{id}` | Cancel appointment | ✅ |

## 💬 Messages Routes
**Base**: `/api/messages`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/threads` | List message threads | ✅ |
| GET | `/threads/{threadId}` | Get thread messages | ✅ |
| POST | `/threads` | Create new thread | ✅ |
| POST | `/threads/{threadId}/messages` | Send message | ✅ |
| PUT | `/threads/{threadId}/read` | Mark thread as read | ✅ |

## 📋 Medical Records Routes
**Base**: `/api/medical-records`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/patient/{patientId}` | Get patient records | ✅ |
| GET | `/{recordId}` | Get specific record | ✅ |
| POST | `/` | Create medical record | ✅ |
| PUT | `/{recordId}` | Update medical record | ✅ |
| DELETE | `/{recordId}` | Delete medical record | ✅ |

## 📄 Documents Routes
**Base**: `/api/documents`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List documents | ✅ |
| GET | `/{documentId}` | Get document details | ✅ |
| POST | `/upload` | Upload document | ✅ |
| GET | `/{documentId}/download` | Download document | ✅ |
| DELETE | `/{documentId}` | Delete document | ✅ |

## 📊 Analytics Routes
**Base**: `/api/analytics`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/overview` | Dashboard overview stats | ✅ |
| GET | `/patients` | Patient analytics | ✅ |
| GET | `/appointments` | Appointment analytics | ✅ |
| GET | `/revenue` | Revenue analytics | ✅ |

## 📝 PROM Routes
**Base**: `/api/proms`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List PROM templates | ✅ |
| GET | `/{templateId}` | Get PROM template | ✅ |
| POST | `/` | Create PROM template | ✅ |
| PUT | `/{templateId}` | Update PROM template | ✅ |
| GET | `/instances/patient/{patientId}` | Get patient PROM instances | ✅ |
| POST | `/instances` | Create PROM instance | ✅ |
| POST | `/instances/{instanceId}/submit` | Submit PROM response | ✅ |

## 📥 Intake Routes
**Base**: `/api/intake`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/forms` | List intake forms | ✅ |
| GET | `/forms/{formId}` | Get intake form | ✅ |
| POST | `/forms` | Create intake form | ✅ |
| POST | `/submissions` | Submit intake form | ❌ |

## ⚙️ Settings Routes
**Base**: `/api/settings`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/clinic` | Get clinic settings | ✅ |
| PUT | `/clinic` | Update clinic settings | ✅ |
| GET | `/user` | Get user settings | ✅ |
| PUT | `/user` | Update user settings | ✅ |

## 🏢 Tenant Management Routes
**Base**: `/api/tenants`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/{tenantId}` | Get tenant info | ✅ |
| POST | `/` | Create tenant | ✅ |
| PUT | `/{tenantId}` | Update tenant | ✅ |

## 🎛️ Admin Routes
**Base**: `/api/admin`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/tenants` | List all tenants | ✅ (Admin) |
| GET | `/users` | List all users | ✅ (Admin) |
| POST | `/users/{userId}/impersonate` | Impersonate user | ✅ (Admin) |

## 🔔 Notifications Routes
**Base**: `/api/notifications`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List notifications | ✅ |
| PUT | `/{notificationId}/read` | Mark as read | ✅ |
| POST | `/send` | Send notification | ✅ |

## 🪝 Webhooks Routes
**Base**: `/api/webhooks`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/calendar` | Calendar webhook | ❌ (Webhook) |
| POST | `/messages` | Message webhook | ❌ (Webhook) |
| POST | `/payments` | Payment webhook | ❌ (Webhook) |

## 🛠️ Debug Routes
**Base**: `/api/debug`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | ❌ |
| GET | `/auth` | Auth debug info | ✅ |
| GET | `/tenant` | Tenant debug info | ✅ |

---

## 📋 Request/Response Standards

### Authentication Headers
```
Authorization: Bearer {token}  // For JWT (if used)
Cookie: accessToken=...; refreshToken=...  // httpOnly cookies (preferred)
X-Tenant-Id: {tenantId}  // Required for tenant-aware endpoints
```

### Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message",
  "errors": []
}
```

### Error Response Format
```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

### Pagination Response Format
```json
{
  "items": [...],
  "nextCursor": "cursor_string",
  "previousCursor": "cursor_string", 
  "hasNext": true,
  "hasPrevious": false,
  "count": 25
}
```

---

## 🔧 Testing Endpoints

### Using curl
```bash
# Login
curl -X POST https://clinic.qivr.pro/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@clinic.test","password":"Password123!"}'

# Get patients (with auth cookies)
curl -X GET https://clinic.qivr.pro/api/patients \
  -H "X-Tenant-Id: your-tenant-id" \
  --cookie "accessToken=your-token"
```

### Using Test Scripts
```bash
# Full system test
node scripts/tests/test-live-system.mjs

# Data flow test
node scripts/tests/test-data-flow.mjs

# Auth test
node scripts/tests/test-auth-victory.mjs
```

---

*Last Updated: November 11, 2025*
*Total Endpoints: ~60+ across all controllers*
