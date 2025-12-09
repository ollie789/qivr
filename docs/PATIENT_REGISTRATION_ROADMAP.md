# Patient Registration & Onboarding Roadmap

## Overview

This document outlines the implementation plan for the complete patient registration flow, from intake submission to first appointment booking.

## Design Philosophy

- **Progressive Data Collection**: Collect minimal data upfront, gather details progressively
- **Patient Self-Service**: Patients book their own appointments (they know their availability)
- **Data Flows Once**: Information entered once carries through the entire system
- **Reduce Friction**: Minimize data entry for both patients and clinic staff

---

## Complete User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. INTAKE WIDGET (Marketing Tool)                                  │
│     Patient submits: Name, Email, Phone, Age Range                  │
│     Chief Complaint, Pain Map (3D), Medical History, Goals          │
│     → Creates: User (unverified), Evaluation, IntakeSubmission      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  2. CLINIC REVIEWS IN KANBAN                                        │
│     Views intake details, AI triage summary                         │
│     Actions: Approve & Invite | Reject | Add Notes                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  3. APPROVE & INVITE                                                │
│     Clinic clicks "Approve & Invite"                                │
│     → Creates PatientInvitation with token                          │
│     → Sends email to patient                                        │
│     → Intake status: "Invited"                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  4. PATIENT RECEIVES EMAIL                                          │
│     Subject: "Complete your registration at [Clinic Name]"          │
│     Body: Welcome message + [Get Started] button                    │
│     Link: https://portal.clinic.com/accept-invite?token=xxx         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  5. ACCEPT INVITE PAGE                                              │
│     • Validates token                                               │
│     • Shows: "Welcome [Name]! Set your password"                    │
│     • Patient creates password                                      │
│     • Creates real Cognito account                                  │
│     • Links to existing User record                                 │
│     • Auto-logs in patient                                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  6. HEALTH DETAILS WIZARD (First Login)                             │
│     Step 1: Personal Details                                        │
│       • Full Date of Birth                                          │
│       • Address (street, city, state, postcode)                     │
│       • Emergency Contact (name, phone, relationship)               │
│                                                                     │
│     Step 2: Insurance & Healthcare                                  │
│       • Insurance Provider                                          │
│       • Member/Policy ID                                            │
│       • Primary Care Physician (optional)                           │
│       • Preferred Pharmacy (optional)                               │
│                                                                     │
│     Step 3: Medical Details                                         │
│       • Allergies (CRITICAL - medications, food, other)             │
│       • Current Medications (name, dosage, frequency)               │
│       • Family Medical History (optional)                           │
│                                                                     │
│     Step 4: Preferences                                             │
│       • Communication preference (Email/SMS/Both)                   │
│       • Appointment reminders (24hr, 1hr, etc.)                     │
│       • Marketing consent                                           │
│                                                                     │
│     [Complete Profile →]                                            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  7. BOOK APPOINTMENT (Patient Self-Service)                         │
│     • "Book Your First Appointment"                                 │
│     • Select service type (pre-filled from intake if applicable)    │
│     • Select provider (or "Any Available")                          │
│     • View calendar with available slots                            │
│     • Select preferred date/time                                    │
│     • Confirm booking                                               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  8. CONFIRMATION                                                    │
│     Patient Portal:                                                 │
│       • "Appointment Confirmed!" message                            │
│       • Appointment details shown                                   │
│       • Add to calendar option                                      │
│       • Redirects to dashboard                                      │
│                                                                     │
│     Email to Patient:                                               │
│       • Confirmation with details                                   │
│       • Calendar invite attachment                                  │
│                                                                     │
│     Clinic Dashboard:                                               │
│       • Notification: "New appointment booked"                      │
│       • Intake status: "Scheduled"                                  │
│       • Appointment appears in calendar                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Tasks

### Phase 1: Backend - Invitation System

#### 1.1 Create PatientInvitation Entity

**File:** `backend/Qivr.Core/Entities/PatientInvitation.cs`

```csharp
public class PatientInvitation : TenantEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }  // Links to existing User from intake
    public Guid? EvaluationId { get; set; }  // Links to intake evaluation
    public string Token { get; set; }  // Unique invite token
    public string Email { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public DateTime ExpiresAt { get; set; }  // Token expiry (e.g., 7 days)
    public DateTime? AcceptedAt { get; set; }  // When patient accepted
    public InvitationStatus Status { get; set; }  // Pending, Accepted, Expired
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }  // Clinic staff who sent invite
}

public enum InvitationStatus
{
    Pending,
    Accepted,
    Expired,
    Revoked
}
```

#### 1.2 Create PatientInvitationsController

**File:** `backend/Qivr.Api/Controllers/PatientInvitationsController.cs`

Endpoints:

- `POST /api/patient-invitations` - Create invitation, send email
- `GET /api/patient-invitations/{token}` - Validate token, get patient info
- `POST /api/patient-invitations/{token}/accept` - Accept invite, create Cognito account
- `GET /api/patient-invitations` - List invitations (clinic view)
- `DELETE /api/patient-invitations/{id}` - Revoke invitation

#### 1.3 Create Email Service

**File:** `backend/Qivr.Infrastructure/Services/EmailService.cs`

- Integration with AWS SES or SendGrid
- Email templates:
  - `PatientInvitation` - Invite to register
  - `AppointmentConfirmation` - Booking confirmed
  - `AppointmentReminder` - Upcoming appointment

#### 1.4 Database Migration

- Add `patient_invitations` table
- Add `profile_completed` flag to `users` table
- Add `invitation_id` to track how user was created

---

### Phase 2: Patient Portal - Accept Invite Flow

#### 2.1 Accept Invite Page

**File:** `apps/patient-portal/src/pages/AcceptInvite.tsx`

- Route: `/accept-invite?token=xxx`
- Validates token via API
- Shows welcome message with patient name
- Password creation form (password + confirm)
- On submit:
  - Creates Cognito account
  - Updates User record
  - Marks invitation as accepted
  - Auto-logs in patient
  - Redirects to health wizard

#### 2.2 Update Auth Context

- Handle invite-based registration
- Set `profileCompleted: false` for new invites
- Redirect incomplete profiles to wizard

---

### Phase 3: Patient Portal - Health Details Wizard

#### 3.1 Health Wizard Component

**File:** `apps/patient-portal/src/features/onboarding/HealthDetailsWizard.tsx`

Multi-step form with progress indicator:

1. Personal Details
2. Insurance & Healthcare
3. Medical Details
4. Preferences

#### 3.2 Health Profile Types

**File:** `packages/eval/src/health-profile/types.ts`

```typescript
interface HealthProfile {
  // Personal
  dateOfBirth: string;
  address: Address;
  emergencyContact: EmergencyContact;

  // Insurance
  insuranceProvider?: string;
  insuranceMemberId?: string;
  primaryCarePhysician?: string;
  preferredPharmacy?: string;

  // Medical
  allergies: Allergy[];
  medications: Medication[];
  familyHistory?: string[];

  // Preferences
  communicationPreference: "email" | "sms" | "both";
  reminderPreferences: ReminderPreferences;
  marketingConsent: boolean;
}
```

#### 3.3 Health Profile API

**Backend:** `PATCH /api/patients/{id}/health-profile`

- Updates patient health profile
- Marks profile as complete

---

### Phase 4: Patient Portal - Self-Service Booking

#### 4.1 Appointment Booking Page

**File:** `apps/patient-portal/src/pages/BookAppointment.tsx`

- Route: `/book-appointment`
- Optional: `?evaluationId=xxx` to link to intake
- Service type selector
- Provider selector (with "Any Available" option)
- Calendar view with available slots
- Time slot selection
- Confirmation step

#### 4.2 Availability API

**Backend:** `GET /api/appointments/availability`

- Query params: `providerId`, `serviceType`, `startDate`, `endDate`
- Returns available time slots
- Respects provider working hours, time off, existing appointments

#### 4.3 Patient Booking API

**Backend:** `POST /api/appointments/book`

- Creates appointment from patient side
- Links to evaluation if provided
- Sends confirmation email
- Notifies clinic

---

### Phase 5: Clinic Dashboard Updates

#### 5.1 Update Intake Actions

**File:** `apps/clinic-dashboard/src/components/dialogs/IntakeDetailsDialog.tsx`

Replace "Schedule" button with "Approve & Invite":

- Opens confirmation dialog
- Sends invitation email
- Updates intake status to "Invited"

#### 5.2 New Intake Statuses

```typescript
type IntakeStatus =
  | "pending" // New submission
  | "reviewing" // Under review
  | "approved" // Approved, invite sent
  | "invited" // Invitation sent, waiting
  | "registered" // Patient created account
  | "scheduled" // Patient booked appointment
  | "completed" // Appointment completed
  | "rejected"; // Rejected by clinic
```

#### 5.3 Invitation Tracking

- Show invitation status on intake card
- "Resend Invite" option if expired
- "Revoke Invite" option if needed

---

### Phase 6: Notifications & Emails

#### 6.1 Email Templates

**Patient Invitation Email:**

```
Subject: Complete your registration at [Clinic Name]

Hi [FirstName],

Great news! Your intake has been reviewed and approved by [Clinic Name].

Click the button below to:
✓ Create your account
✓ Complete your health profile
✓ Book your first appointment

[Get Started →]

This link expires in 7 days.

Questions? Contact us at [clinic email/phone]
```

**Appointment Confirmation Email:**

```
Subject: Appointment Confirmed - [Date] at [Time]

Hi [FirstName],

Your appointment is confirmed!

📅 [Date]
🕐 [Time]
📍 [Clinic Address]
👨‍⚕️ [Provider Name]

Add to calendar: [Google] [Outlook] [iCal]

Need to reschedule? Log in to your patient portal.
```

#### 6.2 Clinic Notifications

- In-app notification when patient books
- Optional email to clinic admin
- Dashboard updates in real-time (WebSocket or polling)

---

## Data Flow Summary

```
INTAKE WIDGET                    PATIENT PORTAL                 CLINIC DASHBOARD
─────────────────────────────────────────────────────────────────────────────────

Patient submits ──────────────────────────────────────────────► Intake appears
                                                                in Kanban
                                                                     │
                                                                     ▼
                                                              Clinic reviews
                                                                     │
                                                                     ▼
                                                              "Approve & Invite"
                                                                     │
                              ◄────────────────────────────── Email sent
                                                                     │
Patient clicks link                                                  │
       │                                                             │
       ▼                                                             │
Creates password                                                     │
       │                                                             │
       ▼                                                             │
Health Wizard ───────────────────────────────────────────────► Profile updated
       │                                                             │
       ▼                                                             │
Books appointment ───────────────────────────────────────────► Appointment created
       │                                                        Notification sent
       ▼                                                             │
Confirmation ◄──────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

```sql
-- New table: patient_invitations
CREATE TABLE patient_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    evaluation_id UUID REFERENCES evaluations(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add to users table
ALTER TABLE users ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN invitation_id UUID REFERENCES patient_invitations(id);

-- New status for intake_submissions
-- Update enum to include: 'invited', 'registered'
```

---

## File Structure (New Files)

```
backend/
├── Qivr.Core/
│   └── Entities/
│       └── PatientInvitation.cs          # NEW
├── Qivr.Api/
│   └── Controllers/
│       └── PatientInvitationsController.cs  # NEW
└── Qivr.Infrastructure/
    └── Services/
        └── EmailService.cs               # NEW or UPDATE

apps/patient-portal/src/
├── pages/
│   ├── AcceptInvite.tsx                  # NEW
│   └── BookAppointment.tsx               # NEW
├── features/
│   └── onboarding/
│       ├── HealthDetailsWizard.tsx       # NEW
│       ├── steps/
│       │   ├── PersonalDetailsStep.tsx   # NEW
│       │   ├── InsuranceStep.tsx         # NEW
│       │   ├── MedicalDetailsStep.tsx    # NEW
│       │   └── PreferencesStep.tsx       # NEW
│       └── index.ts                      # NEW
└── components/
    └── booking/
        ├── ProviderSelector.tsx          # NEW
        ├── AvailabilityCalendar.tsx      # NEW
        └── TimeSlotPicker.tsx            # NEW

packages/eval/src/
└── health-profile/
    ├── types.ts                          # NEW
    ├── questions.ts                      # NEW
    └── index.ts                          # NEW
```

---

## Implementation Order

1. **Backend: PatientInvitation entity + migration**
2. **Backend: PatientInvitationsController**
3. **Backend: Email service (basic)**
4. **Patient Portal: AcceptInvite page**
5. **Patient Portal: Health Details Wizard**
6. **Clinic Dashboard: Update "Schedule" → "Approve & Invite"**
7. **Patient Portal: Appointment booking**
8. **Backend: Patient booking endpoint**
9. **Notifications: Email templates**
10. **Testing & Polish**

---

## Questions to Resolve

- [ ] Email provider: AWS SES, SendGrid, or other?
- [ ] Invitation expiry: 7 days? Configurable per clinic?
- [ ] Can patient skip health wizard? Or required before booking?
- [ ] Multiple providers: How to handle "Any Available" option?
- [ ] Appointment types: Pre-defined list or clinic-configurable?
- [ ] Time zones: How to handle patient vs clinic time zones?

---

## Success Metrics

- Time from intake submission to first appointment booked
- Invitation acceptance rate
- Health wizard completion rate
- Patient self-service booking rate (vs clinic-booked)
- Reduction in clinic admin time per patient

---

_Last Updated: December 2024_
_Status: Planning_
