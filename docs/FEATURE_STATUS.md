# Qivr Feature Status & Integration Roadmap

## ✅ Fully Integrated Features

### Authentication & User Management
- ✅ AWS Cognito authentication
- ✅ Role-based access control
- ✅ Multi-tenant support
- ✅ Staff management UI

### Patient Management
- ✅ Patient listing
- ✅ Patient search
- ✅ Basic patient details

### Dashboard
- ✅ Main dashboard view
- ✅ Quick stats
- ✅ Navigation

## 🔧 Built but Not Fully Integrated

### 📱 Messaging System
**Backend Built:**
- ✅ SMS service via MessageMedia
- ✅ Email service with templates
- ✅ Notification preferences
- ✅ Quiet hours service
- ✅ Webhook handlers for delivery status

**Frontend Missing:**
- ❌ Messaging UI/compose view
- ❌ Message history
- ❌ Template management
- ❌ Bulk messaging
- ❌ Delivery status tracking

### 📎 File Upload & Documents
**Backend Built:**
- ✅ S3/MinIO storage service
- ✅ Document upload endpoints
- ✅ Medical records controller
- ✅ File type validation
- ✅ Secure URL generation

**Frontend Missing:**
- ❌ File upload component
- ❌ Document viewer
- ❌ Medical records management
- ❌ Image preview
- ❌ Drag & drop upload

### 📋 PROMs (Patient-Reported Outcome Measures)
**Backend Built:**
- ✅ PROM template service
- ✅ PROM instance management
- ✅ Answer submission
- ✅ Scoring algorithms
- ✅ Anonymous submission support

**Frontend Partial:**
- ✅ PROM Builder page (exists)
- ❌ PROM sending workflow
- ❌ Response viewer
- ❌ Analytics dashboard
- ❌ Template library

### 📅 Appointments
**Backend Built:**
- ✅ Appointment CRUD
- ✅ Provider availability
- ✅ Google Calendar integration
- ✅ Conflict detection
- ✅ Reminder notifications

**Frontend Partial:**
- ✅ Basic appointments page
- ❌ Calendar view
- ❌ Booking wizard
- ❌ Availability management
- ❌ Rescheduling UI

### 🔔 Notifications
**Backend Built:**
- ✅ Push notifications
- ✅ In-app notifications
- ✅ Email notifications
- ✅ SMS notifications
- ✅ Notification preferences

**Frontend Missing:**
- ❌ Notification bell/dropdown
- ❌ Notification center
- ❌ Preference settings UI
- ❌ Real-time updates

### 📊 Analytics & Reporting
**Backend Built:**
- ✅ Data aggregation endpoints
- ✅ Report generation
- ✅ Export capabilities

**Frontend Partial:**
- ✅ Analytics page (basic)
- ❌ Charts and graphs
- ❌ Custom reports
- ❌ Data export UI

### 🏥 Intake System
**Backend Built:**
- ✅ Intake queue processing
- ✅ Evaluation service
- ✅ Pain mapping
- ✅ Triage logic
- ✅ Assignment workflow

**Frontend Partial:**
- ✅ Intake queue page
- ❌ Evaluation viewer
- ❌ Pain map visualization
- ❌ Assignment UI
- ❌ Triage dashboard

## 🚀 Implementation Priority

### Phase 1: Core Functionality (Week 1)
1. **File Upload Component**
   - Add drag & drop file upload
   - Integrate with S3 service
   - Add to patient records

2. **Messaging UI**
   - Add compose message modal
   - SMS/Email toggle
   - Template selector
   - Send to patient/group

3. **Notification Bell**
   - Add notification dropdown
   - Real-time updates
   - Mark as read functionality

### Phase 2: Enhanced Features (Week 2)
1. **PROM Workflow**
   - Complete sending workflow
   - Response viewer
   - Analytics integration

2. **Appointment Calendar**
   - Full calendar view
   - Drag & drop scheduling
   - Availability management

3. **Document Management**
   - Document viewer
   - Medical records section
   - File categorization

### Phase 3: Advanced Features (Week 3)
1. **Analytics Dashboard**
   - Chart components
   - Custom reports
   - Export functionality

2. **Intake Visualization**
   - Pain map component
   - Evaluation details
   - Assignment workflow

3. **Bulk Operations**
   - Bulk messaging
   - Bulk appointments
   - Bulk PROM sending

## 📝 Quick Wins to Implement Now

### 1. Add File Upload to Patient Detail
```typescript
// Add to PatientDetail.tsx
import FileUpload from '../components/FileUpload';

// In the component
<FileUpload 
  patientId={patientId}
  onUpload={handleFileUpload}
/>
```

### 2. Add Message Button to Patient List
```typescript
// Add to patient actions
<IconButton onClick={() => openMessageDialog(patient)}>
  <MessageIcon />
</IconButton>
```

### 3. Add Notification Bell to Header
```typescript
// Add to DashboardLayout.tsx toolbar
<NotificationBell />
```

### 4. Enable PROM Sending
```typescript
// Add send button to PROM builder
<Button onClick={sendProm}>
  Send to Patients
</Button>
```

## 🔌 API Endpoints Available but Unused

### Messaging
- `POST /api/v1/notifications/send` - Send notification
- `POST /api/v1/messages/sms` - Send SMS
- `POST /api/v1/messages/email` - Send email
- `GET /api/v1/messages/templates` - Get templates

### Documents
- `POST /api/v1/documents/upload` - Upload file
- `GET /api/v1/documents/{id}` - Get document
- `DELETE /api/v1/documents/{id}` - Delete document
- `GET /api/v1/patients/{id}/documents` - Get patient documents

### Notifications
- `GET /api/v1/notifications` - Get notifications
- `PUT /api/v1/notifications/{id}/read` - Mark as read
- `GET /api/v1/notifications/unread-count` - Get unread count

### PROMs
- `POST /api/v1/proms/schedule` - Schedule PROM
- `GET /api/v1/proms/instances` - Get instances
- `POST /api/v1/proms/instances/{id}/send` - Send to patient
- `GET /api/v1/proms/instances/{id}/responses` - Get responses

## 🛠️ Next Steps

1. **Create reusable components:**
   - FileUpload component
   - MessageComposer component
   - NotificationBell component
   - DocumentViewer component

2. **Add to existing pages:**
   - Add upload to patient detail
   - Add messaging to patient list
   - Add notifications to header
   - Complete PROM sending flow

3. **Create new pages:**
   - Messages page
   - Documents page
   - Notification center

4. **Wire up APIs:**
   - Create API service files
   - Add to React Query hooks
   - Handle loading/error states

## 💡 Quick Implementation Commands

```bash
# Generate component templates
npx plop component FileUpload
npx plop component MessageComposer
npx plop component NotificationBell

# Add new routes
# Edit App.tsx to add:
# - /messages
# - /documents
# - /notifications

# Create service files
touch src/services/messageService.ts
touch src/services/documentService.ts
touch src/services/notificationService.ts
```
