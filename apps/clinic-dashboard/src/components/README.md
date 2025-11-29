# Clinic Dashboard Components

Organized component structure for the clinic dashboard application.

## Structure

```
components/
├── documents/          # Document handling components
│   └── OCRResultsViewer.tsx    # Display OCR extraction results
│
├── messaging/          # Communication components
│   ├── MessageComposer.tsx     # Compose messages to patients
│   ├── MessageTemplateManager.tsx
│   ├── PROMSender.tsx          # Send PROM questionnaires
│   └── PromPreview.tsx
│
├── dialogs/            # Modal dialogs
│   ├── ScheduleAppointmentDialog.tsx
│   ├── IntakeDetailsDialog.tsx
│   ├── TreatmentPlanBuilder.tsx
│   └── PatientInviteDialog.tsx
│
├── shared/             # Shared/reusable components
│   ├── TenantSelector.tsx      # Multi-tenant switcher
│   ├── TenantInfo.tsx          # Display tenant details
│   └── NotificationBell.tsx    # Notification dropdown
│
├── Layout/             # Layout components
│   └── DashboardLayout.tsx     # Main dashboard shell
│
├── Auth/               # Authentication components
│   └── PrivateRoute.tsx
│
├── forms/              # Form components
│   └── SelectField.tsx
│
├── mui/                # MUI re-exports
└── icons/              # Icon re-exports
```

## Usage

Import from organized folders:

```tsx
// Documents
import { OCRResultsViewer } from '../components/documents';

// Messaging
import { MessageComposer, PROMSender, PromPreview } from '../components/messaging';

// Dialogs
import { ScheduleAppointmentDialog, PatientInviteDialog, TreatmentPlanBuilder } from '../components/dialogs';

// Shared
import { TenantSelector, NotificationBell } from '../components/shared';
```

## Component Guidelines

### App-Specific (Keep in clinic-dashboard)
- Components with clinic-specific business logic
- Components tightly coupled to clinic APIs/services
- Components using clinic-specific state management

### Reusable (Consider moving to @qivr/design-system)
- Generic UI components with no business logic
- Components that could be used in patient portal
- Pure presentational components

## Notes

- **TenantSelector**: Uses clinic-specific auth store, not suitable for design system yet
- **NotificationBell**: Could be made generic but currently uses clinic-specific notification types
