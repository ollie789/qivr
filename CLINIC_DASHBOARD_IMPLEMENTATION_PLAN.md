# Clinic Dashboard Implementation Plan

## Current State vs Specification Gap Analysis

### ✅ Already Implemented
1. **Basic Dashboard Layout** - Stats, appointments, intake queue overview
2. **Authentication** - Cognito integration with MFA for clinic staff  
3. **Basic Routing** - Dashboard, Patients, Appointments, Intake Queue, Analytics, Settings
4. **Multi-tenancy Support** - Tenant ID in auth context
5. **Basic UI Components** - Material-UI setup, responsive layout

### 🔴 Missing Critical Features (Must Have)

#### 1. **Intake & Evaluation Management**
- [ ] Full evaluation review interface with 3D body pain visualization
- [ ] Triage notes and urgency flagging system
- [ ] AI summary review and approval workflow
- [ ] Patient history timeline view
- [ ] Evaluation comparison tools

#### 2. **Calendar & Scheduling Integration**
- [ ] Google Calendar sync
- [ ] Microsoft 365 Calendar sync  
- [ ] Real-time availability management
- [ ] Provider schedule management
- [ ] Double-booking prevention
- [ ] Appointment proposal workflow
- [ ] Recurring appointment templates

#### 3. **PROM (Patient Reported Outcome Measures) Management**
- [ ] PROM template builder with drag-and-drop
- [ ] Dynamic questionnaire designer
- [ ] Branching logic configuration
- [ ] Scoring methodology setup
- [ ] PROM scheduling engine
- [ ] Automated reminder configuration
- [ ] PROM analytics dashboard
- [ ] Longitudinal tracking charts
- [ ] MCID (Minimal Clinically Important Difference) visualization

#### 4. **Patient Communication Hub**
- [ ] SMS messaging interface (MessageMedia integration)
- [ ] Email template management
- [ ] Two-way messaging support
- [ ] Consent and opt-out management
- [ ] Communication history tracking
- [ ] Bulk messaging campaigns
- [ ] Voice callback scheduling

#### 5. **Advanced Analytics & Reporting**
- [ ] Patient outcome trends
- [ ] Provider performance metrics
- [ ] Clinic KPI dashboard
- [ ] Custom report builder
- [ ] Data export functionality (CSV, PDF)
- [ ] FHIR data export

#### 6. **Clinic Settings & Configuration**
- [ ] White-label theming interface
- [ ] Logo and branding upload
- [ ] Color palette customization
- [ ] SSO configuration (SAML/OIDC)
- [ ] User and role management
- [ ] Provider profile management
- [ ] Business hours configuration
- [ ] Service types and pricing

#### 7. **Integration Hub**
- [ ] Practice management system connectors
- [ ] Webhook configuration
- [ ] API key management
- [ ] Data mapping tools
- [ ] Integration health monitoring

## Implementation Priority Order

### Phase 1: Core Clinical Features (Weeks 1-3)
**Goal**: Enable basic clinical operations

1. **Enhanced Intake Queue**
   - Full evaluation viewer with pain map
   - Triage tools and urgency flags
   - Patient history integration
   - Notes and internal comments

2. **Calendar Integration**
   - Google Calendar OAuth setup
   - Basic availability sync
   - Appointment booking from intake
   - Schedule conflict detection

3. **Basic PROM Setup**
   - Pre-built PROM templates
   - Manual PROM assignment
   - Basic completion tracking
   - Simple results viewer

### Phase 2: Communication & Automation (Weeks 4-5)
**Goal**: Streamline patient communication

1. **Messaging Hub**
   - SMS integration with MessageMedia
   - Template management
   - Appointment reminders
   - PROM reminders

2. **Automated Workflows**
   - Post-appointment PROM triggers
   - Follow-up scheduling
   - No-show management

### Phase 3: Advanced Clinical Tools (Weeks 6-8)
**Goal**: Enhance clinical decision support

1. **PROM Builder**
   - Drag-and-drop designer
   - Question library
   - Branching logic
   - Scoring configuration
   - Version management

2. **Analytics Dashboard**
   - Outcome tracking
   - Provider metrics
   - Patient journey analytics
   - Custom reports

3. **AI Integration**
   - Summary review workflow
   - Risk flag management
   - Clinical insights

### Phase 4: Practice Management (Weeks 9-10)
**Goal**: Complete practice operations

1. **Settings & Configuration**
   - Complete theming system
   - User management
   - Role-based permissions
   - Service configuration

2. **Integration Hub**
   - Cliniko connector
   - Webhook management
   - Data sync monitoring

## Technical Implementation Details

### Component Structure
```
src/
├── features/
│   ├── intake/
│   │   ├── components/
│   │   │   ├── EvaluationViewer.tsx
│   │   │   ├── PainMapViewer.tsx
│   │   │   ├── TriagePanel.tsx
│   │   │   └── PatientTimeline.tsx
│   │   ├── hooks/
│   │   │   ├── useEvaluations.ts
│   │   │   └── useTriageActions.ts
│   │   └── services/
│   │       └── intakeService.ts
│   ├── calendar/
│   │   ├── components/
│   │   │   ├── CalendarSync.tsx
│   │   │   ├── AvailabilityGrid.tsx
│   │   │   └── AppointmentProposal.tsx
│   │   ├── hooks/
│   │   │   └── useCalendarSync.ts
│   │   └── services/
│   │       ├── googleCalendarService.ts
│   │       └── microsoftCalendarService.ts
│   ├── proms/
│   │   ├── components/
│   │   │   ├── PromBuilder.tsx
│   │   │   ├── QuestionLibrary.tsx
│   │   │   ├── ScoringConfig.tsx
│   │   │   └── PromAnalytics.tsx
│   │   └── services/
│   │       └── promService.ts
│   ├── messaging/
│   │   ├── components/
│   │   │   ├── MessageComposer.tsx
│   │   │   ├── ConversationView.tsx
│   │   │   └── TemplateManager.tsx
│   │   └── services/
│   │       └── messageService.ts
│   └── analytics/
│       ├── components/
│       │   ├── OutcomeCharts.tsx
│       │   ├── ProviderMetrics.tsx
│       │   └── ReportBuilder.tsx
│       └── services/
│           └── analyticsService.ts
```

### API Endpoints Needed
```typescript
// Intake Management
GET    /api/evaluations?status=pending&urgency=high
GET    /api/evaluations/{id}/full
POST   /api/evaluations/{id}/triage
POST   /api/evaluations/{id}/notes
PUT    /api/evaluations/{id}/ai-summary/approve

// Calendar
POST   /api/calendar/google/auth
POST   /api/calendar/microsoft/auth
GET    /api/calendar/availability
POST   /api/appointments/propose
GET    /api/providers/{id}/schedule

// PROMs
GET    /api/prom-templates
POST   /api/prom-templates
PUT    /api/prom-templates/{id}
POST   /api/prom-instances/schedule
GET    /api/prom-analytics

// Messaging
POST   /api/messages/sms
GET    /api/messages/conversations/{patientId}
POST   /api/messages/templates
POST   /api/messages/campaigns

// Analytics
GET    /api/analytics/outcomes
GET    /api/analytics/provider-metrics
POST   /api/reports/generate
```

### State Management
```typescript
// Zustand stores
interface ClinicStore {
  // Intake
  evaluations: Evaluation[]
  selectedEvaluation: Evaluation | null
  triageQueue: TriageItem[]
  
  // Calendar
  providers: Provider[]
  availability: AvailabilitySlot[]
  appointments: Appointment[]
  
  // PROMs
  promTemplates: PromTemplate[]
  promInstances: PromInstance[]
  
  // Messaging
  conversations: Conversation[]
  messageTemplates: MessageTemplate[]
  
  // Analytics
  outcomeMetrics: OutcomeMetric[]
  providerMetrics: ProviderMetric[]
}
```

## Next Steps

1. **Set up feature structure** - Create the folder structure for new features
2. **Build Intake Management** - Start with evaluation viewer and triage tools
3. **Implement Calendar Sync** - Google Calendar first, then Microsoft
4. **Create PROM Builder** - Start with basic templates, add builder later
5. **Add Messaging Hub** - SMS integration with MessageMedia
6. **Build Analytics** - Start with basic charts, add custom reports

## Success Metrics

- **Efficiency**: Reduce intake review time by 50%
- **Scheduling**: Achieve 90% first-call booking rate
- **PROMs**: 80% completion rate at T+7 days
- **Communication**: <2 min response time for urgent intakes
- **Analytics**: Daily KPI visibility for clinic managers

## Risk Mitigation

1. **Calendar Sync Complexity**: Start with read-only sync, add write later
2. **PROM Builder Complexity**: Use pre-built templates initially
3. **SMS Costs**: Implement message batching and rate limiting
4. **Performance**: Implement pagination and lazy loading for large datasets
5. **Security**: Audit all patient data access, implement field-level permissions
