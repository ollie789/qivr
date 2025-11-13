# Clinic Dashboard - Complete Structure for Figma AI

## Design System Components (25)

### Buttons & Actions
- **QivrButton**: Primary action button with variants (contained, outlined, text), emphasis levels (primary, secondary, subtle), loading state with spinner

### Cards & Containers
- **QivrCard**: Base card with optional elevation
- **DashboardSectionCard**: Card with header section and content area, optional header actions
- **ProviderCard**: Selectable card showing provider avatar, name, title, subtitle, selected state with border highlight

### Layout Components
- **FlexBetween**: Flexbox container with space-between alignment
- **TabPanel**: Conditional content panel for tabs
- **DialogSection**: Consistent padding wrapper for dialog content
- **IconWithLabel**: Icon + text label in horizontal layout

### Navigation
- **PageHeader**: Page title, optional description, breadcrumbs, action buttons in top-right
- **Breadcrumbs**: Breadcrumb trail with arrow separators, clickable links, last item as plain text

### Forms
- **FormSection**: Section with title, description, and form fields grouped together
- **FormRow**: Label on left (or top on mobile), input field on right, optional required indicator

### Feedback & States
- **LoadingSpinner**: Centered circular spinner with optional text below
- **EmptyState**: Icon (large, centered), title, description, optional action button
- **SkeletonLoader**: Animated loading placeholder rectangles

### Data Display
- **StatCard**: Large value number, label below, optional icon in top-right, optional trend chip (up/down arrow with percentage)
- **DataTable**: Table with sortable columns, pagination, row actions
- **TableSection**: Table with title header and optional action buttons

### Calendar/Scheduling
- **CalendarGridCell**: Calendar date cell with date number, optional events/dots
- **AppointmentChip**: Compact chip showing time and status color
- **AvailabilitySlot**: Clickable time slot button, selected state
- **TimeSlotPicker**: Grid of time slot chips, selected state highlighted

### Dialogs
- **StepperDialog**: Multi-step dialog with stepper at top, content area, back/next/complete buttons at bottom

## Page Layouts (15 Pages)

### Dashboard Page
**Layout:** 
- PageHeader with title "Dashboard", no breadcrumbs
- StatCardGrid: 4 cards in row (Total Patients, Appointments Today, Pending PROMs, Unread Messages)
- Grid layout: 2 columns
  - Left column (8/12): AppointmentTrendCard (line chart), TopDiagnosesCard (bar chart)
  - Right column (4/12): PromCompletionCard (pie chart), Recent activity list

### Patients Page
**Layout:**
- PageHeader: title "Patients", description "Manage patient records", action button "New Patient"
- Search bar and filters row
- DataTable: columns (Name, Email, Phone, Last Visit, Status), row actions (View, Edit, Message)
- Pagination at bottom

### Patient Detail Page
**Layout:**
- PageHeader: breadcrumbs (Dashboard > Patients > [Name]), title "[Patient Name]", tabs below (Overview, Medical Records, Appointments, Documents, Messages)
- TabPanel content:
  - **Overview Tab**: Patient info card, recent appointments list, recent PROMs list
  - **Medical Records Tab**: TableSection with medical history entries
  - **Appointments Tab**: Calendar view + appointments list
  - **Documents Tab**: FileUpload component + document list with download buttons
  - **Messages Tab**: Message thread list

### Appointments Page
**Layout:**
- PageHeader: title "Appointments", action buttons (Today, Week, Month views, "New Appointment")
- Calendar grid view (7 columns for days)
- Each cell: CalendarGridCell with AppointmentChips stacked
- Side panel: Selected day's appointments in list format

### Messages Page
**Layout:**
- 2-column layout:
  - Left (4/12): Conversation list with search, each item shows patient name, last message preview, timestamp
  - Right (8/12): Message thread with MessageComposer at bottom
- MessageComposer: Recipient selector, message type toggle (Email/SMS), template selector, text area, send button

### PROM Page
**Layout:**
- PageHeader: title "PROMs", tabs (Templates, Sent, Responses)
- **Templates Tab**: Grid of template cards, each showing template name, version, question count, "Send" button
- **Sent Tab**: TableSection with sent PROMs (Patient, Template, Sent Date, Due Date, Status)
- **Responses Tab**: TableSection with completed responses, "View" action opens response details

### Analytics Page
**Layout:**
- PageHeader: title "Analytics", date range selector in actions
- StatCardGrid: 6 cards (Total Patients, Total Appointments, Completion Rate, Avg Response Time, Active PROMs, Revenue)
- Grid layout: 2 rows
  - Row 1: AppointmentTrendCard (full width)
  - Row 2: PromCompletionCard (6/12), TopDiagnosesCard (6/12)

### Medical Records Page
**Layout:**
- PageHeader: breadcrumbs, title "Medical Records"
- Filter bar: Patient selector, date range, record type filter
- TableSection: columns (Date, Patient, Type, Provider, Summary), row action "View Details"

### Documents Page
**Layout:**
- PageHeader: title "Documents", action "Upload Document"
- Filter bar: Patient selector, category filter, search
- Grid view of document cards: thumbnail/icon, filename, size, upload date, download button

### Intake Management Page
**Layout:**
- PageHeader: title "Intake Forms", tabs (Pending, Triaged, Scheduled, Completed)
- TableSection: columns (Submitted, Patient, Chief Complaint, Urgency chip, AI Flags, Status, Actions)
- Row actions: "View Details" (opens IntakeDetailsDialog), "Schedule" (opens ScheduleAppointmentDialog)

### Settings Page
**Layout:**
- PageHeader: title "Settings", tabs (Clinic, Users, Billing, Integrations)
- **Clinic Tab**: FormSections (Clinic Information, Business Hours, Contact Details)
- **Users Tab**: TableSection with staff list, "Invite User" button
- **Billing Tab**: Current plan card, usage stats, payment method
- **Integrations Tab**: List of integration cards (Stripe, Twilio, etc.) with connect/disconnect buttons

### Providers Page
**Layout:**
- PageHeader: title "Providers", action "Add Provider"
- Grid of provider cards: avatar, name, speciality, availability, stats (appointments this week, rating)
- Click card to view provider detail page

### Login/Signup Pages
**Layout:**
- Centered card (max-width 400px)
- Logo at top
- FormSection with email/password fields
- QivrButton (full width)
- Link to other page at bottom

### Clinic Registration Page
**Layout:**
- Multi-step form using StepperDialog pattern
- Steps: Clinic Info, Admin Account, Billing, Confirm
- Each step: FormSection with relevant fields

## Common Patterns

### Dialog Structure
- DialogTitle with FlexBetween (title on left, close button on right)
- DialogContent with DialogSection wrapper
- FormSections inside for grouped fields
- DialogActions with cancel (outlined, subtle) and primary action (contained) buttons

### Form Structure
- FormSection groups related fields
- FormRow for each field (label + input)
- Required fields marked with asterisk
- Helper text below inputs

### Data Display
- TableSection for lists with actions
- EmptyState when no data
- LoadingSpinner while loading
- Pagination at bottom

### Cards
- DashboardSectionCard for dashboard widgets
- QivrCard for general content
- StatCard for metrics
- Elevated cards for emphasis

## Color Usage
- Primary (#1976d2): Main actions, selected states, links
- Secondary (#dc004e): Secondary actions, accents
- Success (#2e7d32): Completed states, positive trends
- Error (#d32f2f): Errors, urgent items, negative trends
- Warning (#ed6c02): Warnings, medium urgency
- Info (#0288d1): Informational messages

## Spacing Scale
- xs (4px): Tight spacing, icon gaps
- sm (8px): Small gaps, chip spacing
- md (16px): Default spacing, form field gaps
- lg (24px): Section spacing
- xl (32px): Large section gaps
- xxl (48px): Page section dividers

## Typography Scale
- xs (12px): Captions, helper text
- sm (14px): Body text, table cells
- md (16px): Default body text
- lg (18px): Subheadings
- xl (24px): Section titles
- xxl (32px): Page titles

## Component States
- Default: Normal state
- Hover: Slight background change
- Selected: Primary color border/background
- Disabled: Reduced opacity, no pointer
- Loading: Spinner replaces content/icon
- Error: Red border, error message below
