# Qivr Clinic Dashboard - Design System Specification for Figma

**Version:** 2.0  
**Last Updated:** November 13, 2025  
**Purpose:** Complete specification for Figma AI to generate modern clinic dashboard designs with glassmorphism UI

---

## Table of Contents

1. [Visual Design Direction](#visual-design-direction)
2. [Design Tokens](#design-tokens)
3. [Component Library](#component-library)
4. [Page Layouts](#page-layouts)
5. [Design Patterns](#design-patterns)

---

## Visual Design Direction

### Modern Glassmorphism UI

**Core Aesthetic:** Clean, high-tech, medical-grade interface with depth and transparency

**Glassmorphism Properties:**
- Semi-transparent backgrounds with backdrop blur (blur: 10-20px)
- Subtle borders with light opacity (1px solid rgba(255,255,255,0.18))
- Layered depth with multiple glass panels
- Light reflections and subtle gradients
- Shadow depth for floating elements

**Background Treatment:**
- Gradient backgrounds (soft blues, purples, whites)
- Subtle mesh gradients or abstract medical patterns
- Light texture overlays for depth
- Clean white base with colored accent gradients

**Card & Panel Styling:**
- Background: rgba(255, 255, 255, 0.7) with backdrop-filter blur(10px)
- Border: 1px solid rgba(255, 255, 255, 0.18)
- Box shadow: 0 8px 32px rgba(31, 38, 135, 0.15)
- Rounded corners: 12-16px for cards, 8px for smaller elements

**Color Overlays:**
- Primary glass: White with blue tint rgba(25, 118, 210, 0.05)
- Success glass: White with green tint rgba(46, 125, 50, 0.05)
- Warning glass: White with orange tint rgba(237, 108, 2, 0.05)
- Error glass: White with red tint rgba(211, 47, 47, 0.05)

### Animations & Micro-interactions

**Transition Timing:**
- Fast: 150ms (hover states, button presses)
- Medium: 300ms (panel slides, fades)
- Slow: 500ms (page transitions, complex animations)
- Easing: cubic-bezier(0.4, 0, 0.2, 1) for smooth, natural motion

**Hover Effects:**
- Cards: Lift up 4px, increase shadow, slight scale (1.02)
- Buttons: Brighten background 10%, scale 1.05
- List items: Slide in colored left border, background tint
- Icons: Rotate 5-10deg, color shift, scale 1.1

**Click/Press Effects:**
- Scale down to 0.98 on press
- Ripple effect from click point
- Brief color flash
- Haptic feedback indication (visual pulse)

**Loading States:**
- Skeleton shimmer animation (gradient sweep left to right)
- Spinner with smooth rotation and fade-in
- Progress bars with animated gradient fill
- Pulsing opacity for loading elements

**Page Transitions:**
- Fade in content with 300ms delay
- Slide up from bottom (20px) with fade
- Stagger animation for lists (50ms delay per item)
- Blur-to-focus effect on page load

**Data Visualization:**
- Animated chart drawing (lines draw in, bars grow up)
- Smooth value transitions when data updates
- Hover tooltips with slide-in animation
- Color transitions on state changes

**Form Interactions:**
- Input focus: Border color transition, subtle glow
- Label float animation on focus
- Success checkmark animation (draw path)
- Error shake animation (3 quick horizontal movements)
- Dropdown slide down with fade
- Toggle switch smooth slide with color transition

**Notification Animations:**
- Slide in from top-right with bounce
- Auto-dismiss with fade out and slide up
- Progress bar countdown animation
- Icon entrance with scale and rotate

### High-Tech Visual Elements

**Accent Lines & Dividers:**
- Thin gradient lines (1-2px)
- Animated gradient borders on active elements
- Glowing dividers with subtle pulse
- Diagonal accent lines in corners

**Icons:**
- Outlined style (not filled) for modern look
- Consistent 24px size, 2px stroke width
- Animated on interaction (rotate, scale, color shift)
- Gradient fills for primary actions

**Typography:**
- Clean sans-serif (Roboto, Inter, or SF Pro)
- Generous letter spacing for headings (0.5-1px)
- Subtle text shadows for depth on glass
- Gradient text for hero titles

**Shadows & Depth:**
- Multiple shadow layers for depth
- Colored shadows matching element color
- Inner shadows for inset elements
- Glow effects for active/selected states

**Status Indicators:**
- Animated pulsing dots for live status
- Gradient progress rings
- Smooth color transitions between states
- Glow effect for critical alerts

---

## Design Tokens

### Color System

**Primary Palette:**
- Primary Main: #1976d2 (Blue)
- Primary Light: #42a5f5
- Primary Dark: #1565c0
- Primary Glass: rgba(25, 118, 210, 0.1)

**Secondary Palette:**
- Secondary Main: #dc004e (Pink/Red)
- Secondary Light: #f50057
- Secondary Dark: #c51162

**Semantic Colors:**
- Success: #2e7d32 (Green)
- Error: #d32f2f (Red)
- Warning: #ed6c02 (Orange)
- Info: #0288d1 (Light Blue)

**Neutral Palette:**
- Background: Linear gradient from #f5f7fa to #c3cfe2
- Surface: rgba(255, 255, 255, 0.7) with backdrop blur
- Text Primary: rgba(0, 0, 0, 0.87)
- Text Secondary: rgba(0, 0, 0, 0.6)
- Border: rgba(255, 255, 255, 0.18)
- Divider: rgba(0, 0, 0, 0.08)

**Gradient Accents:**
- Primary Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- Success Gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
- Info Gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- xxl: 48px

### Typography
- Font Family: Roboto, Inter, SF Pro
- Font Sizes: 12px, 14px, 16px, 18px, 24px, 32px, 48px
- Font Weights: 400 (regular), 500 (medium), 700 (bold)
- Line Heights: 1.5 for body, 1.2 for headings
- Letter Spacing: 0.5px for headings, 0px for body

### Border Radius
- Small: 8px (buttons, inputs)
- Medium: 12px (cards)
- Large: 16px (large cards, dialogs)
- Round: 50% (avatars, icon buttons)

### Shadows
- Small: 0 2px 8px rgba(0, 0, 0, 0.1)
- Medium: 0 8px 32px rgba(31, 38, 135, 0.15)
- Large: 0 16px 48px rgba(31, 38, 135, 0.2)
- Glow: 0 0 20px rgba(25, 118, 210, 0.3)

---

## Component Library (25 Components)

### 1. QivrButton
Primary button with loading states and glassmorphism styling.

**Props:** emphasize (primary/secondary/subtle), loading, variant, color, disabled, startIcon, endIcon

**Visual States:**
- Default: Glass background with subtle gradient, 8px radius
- Hover: Lift 2px, brighten 10%, scale 1.02, glow shadow
- Active: Scale 0.98, darker shade
- Loading: Spinner animation, disabled state
- Disabled: 50% opacity, no interaction

**Variants:**
- Contained: Solid color with glass overlay
- Outlined: Transparent with colored border
- Text: No background, colored text

### 2. QivrCard
Base card with glassmorphism effect.

**Props:** elevated, sx

**Styling:**
- Background: rgba(255, 255, 255, 0.7) with backdrop blur
- Border: 1px solid rgba(255, 255, 255, 0.18)
- Border radius: 12px
- Shadow: Medium depth
- Padding: 24px
- Hover: Lift 4px, increase shadow

### 3. StepperDialog
Multi-step workflow dialog with progress indicator.

**Props:** open, onClose, title, steps, activeStep, onNext, onBack, onComplete, children, isStepValid, loading, maxWidth

**Layout:** Dialog with horizontal stepper at top, content area, action buttons at bottom

**Stepper Styling:**
- Active step: Primary color with glow
- Completed step: Success color with checkmark
- Inactive step: Gray with outline
- Connector lines: Gradient when completed

**Animation:** Step transitions slide left/right with fade

### 4. TimeSlotPicker
Time slot selection with chip-based UI.

**Props:** slots, selectedSlot, onSelectSlot, disabled, label

**Styling:**
- Chips in flex wrap layout with 8px gap
- Default: Outlined with glass background
- Selected: Filled primary with glow effect
- Hover: Scale 1.05, brighten
- Disabled: 50% opacity

### 5. ProviderCard
Selectable provider card with avatar.

**Props:** id, name, title, subtitle, selected, onSelect, avatar

**Layout:** List item with avatar (left), text content (center), selection indicator (right)

**Styling:**
- Glass card with border
- Selected: Primary border with glow, tinted background
- Hover: Lift effect, border color shift
- Avatar: 48px circle with gradient border

### 6. DataTable
Feature-rich table with sorting, search, pagination.

**Props:** columns, data, loading, emptyState, searchable, paginated, pageSize, onRowClick

**Styling:**
- Glass container with subtle border
- Header: Sticky, gradient background, bold text
- Rows: Hover effect with background tint, border bottom
- Sort indicators: Animated arrows
- Pagination: Glass buttons with hover effects

**Features:** Column sorting, search bar with icon, pagination controls, loading skeletons, empty state

### 7. DashboardSectionCard
Card for dashboard sections with header.

**Props:** header, headerProps, children, elevated

**Layout:** Header section with divider, content section below

**Styling:**
- Glass card with medium radius
- Header: Gradient background, 20px padding
- Divider: Gradient line
- Content: 24px padding

### 8. StatCard
Metric display card with icon.

**Props:** label, value, icon, iconColor, compact

**Layout:** Icon (left), label (top), value (bottom)

**Styling:**
- Glass card with gradient accent
- Large value text (32px, bold)
- Icon with colored background circle
- Hover: Lift and glow effect

### 9. EmptyState
No-data state with icon and actions.

**Props:** icon, title, description, actionText, onAction, secondaryActionText, onSecondaryAction

**Layout:** Centered content with large icon (64px), title, description, action buttons

**Styling:**
- Icon: Gray with subtle animation (float up/down)
- Text: Centered, secondary color
- Buttons: Primary and outlined variants

### 10. LoadingSpinner
Loading indicator with message.

**Props:** size, message, centered, progressProps

**Animation:** Smooth circular rotation with gradient trail

**Sizes:** Small (24px), Medium (40px), Large (60px)

### 11. SkeletonLoader
Loading placeholders with shimmer effect.

**Props:** type (text/card/table/list), count, height

**Animation:** Gradient shimmer sweeping left to right, 1.5s duration, infinite loop

### 12. PageHeader
Page title with breadcrumbs and actions.

**Props:** title, description, breadcrumbs, actions

**Layout:** Breadcrumbs (top), title and actions (middle), description (bottom)

**Styling:**
- Title: 32px, bold, gradient text option
- Breadcrumbs: Small text with separator icons
- Actions: Button group on right

### 13. Breadcrumbs
Navigation breadcrumb trail.

**Props:** items, separator

**Styling:** Small text with icon separators, last item bold, hover underline

### 14. FormSection
Form section with title and description.

**Props:** title, description, divider, children

**Layout:** Title and description at top, form fields below, optional divider

### 15. FormRow
Horizontal form field layout.

**Props:** children, spacing

**Layout:** Grid container with responsive columns

### 16. DialogSection
Dialog content section with spacing.

**Props:** children

**Styling:** Consistent padding and margins for dialog content

### 17. FlexBetween
Flex container with space-between.

**Props:** Standard Box props

**Layout:** Flex with justify-content space-between, align-items center

### 18. TabPanel
Tab content panel.

**Props:** value, index, children

**Behavior:** Conditional rendering based on active tab, fade-in animation

### 19. IconWithLabel
Icon with text label.

**Props:** icon, label, iconColor, spacing

**Layout:** Horizontal flex with icon and text

### 20. TableSection
Table container with header.

**Props:** title, children, actions

**Layout:** Header with title and actions, table content below

### 21. CalendarGridCell
Calendar cell with selection states.

**Props:** selected, isToday, children

**Styling:**
- Glass background
- Today: Primary tint with glow
- Selected: Primary border with glow
- Hover: Lift effect

### 22. AppointmentChip
Compact appointment card for calendar.

**Props:** time, patientName, status, onClick

**Styling:**
- Small glass card with status color accent
- Status dot with pulse animation
- Hover: Scale and glow

### 23. AvailabilitySlot
Provider availability indicator.

**Props:** time, available, onClick

**Styling:**
- Available: Green tint with checkmark
- Unavailable: Gray with X icon
- Hover: Brighten and scale

### 24. AppointmentTrendCard
Line chart for appointment trends.

**Props:** data, period

**Chart Styling:**
- Gradient fill under line
- Animated line drawing
- Glass tooltip on hover
- Smooth data transitions

### 25. PromCompletionCard
PROM completion progress card.

**Props:** data, period

**Styling:**
- Progress bar with gradient fill
- Animated fill on load
- Percentage text with count

---

## Page Layouts (15 Pages)

### Global Layout Structure

**Sidebar Navigation (240px width):**
- Glass background with blur
- Logo at top with gradient
- Navigation items with icons
- Hover: Slide in colored accent bar, background tint
- Active: Primary background with glow
- Collapse button at bottom

**Main Content Area:**
- Gradient background
- Max width: 1400px, centered
- Padding: 24px
- Smooth scroll behavior

**Top Bar (Optional):**
- Glass bar with user profile, notifications, search
- Sticky position
- Shadow on scroll

---

### 1. Dashboard Page

**Route:** /dashboard

**Layout:**
- Page header with title "Dashboard" and period selector
- 4 stat cards in grid (Total Patients, Today's Appointments, Pending Tasks, Overdue Items)
- 2-column grid: Appointment Trends chart (left), Today's Appointments list (right)
- 2-column grid: PROM Completion card (left), Top Diagnoses card (right)
- Full-width Recent Activity feed

**Key Features:**
- Real-time data refresh
- Animated chart drawing
- Hover tooltips
- Quick action buttons

---

### 2. Patients Page

**Route:** /patients

**Layout:**
- Page header with breadcrumbs, title "Patients", Add Patient button
- Search bar with filter dropdowns (Status, Date Range)
- DataTable with columns: Avatar+Name, Email, Phone, DOB, Status, Actions
- Pagination controls

**Dialogs:**
- Add Patient: StepperDialog with 3 steps (Personal Info, Contact, Medical History)
- Edit Patient: Same as add, pre-filled
- Patient Detail: Full-screen dialog with tabs

**Key Features:**
- Real-time search
- Sortable columns
- Status chips with colors
- Row click to view details
- Bulk actions

---

### 3. Appointments Page

**Route:** /appointments

**Layout:**
- Page header with title "Appointments", Schedule button
- View mode toggle (Month/Week/Day/List)
- Calendar grid or list view
- Filter controls (Provider, Status, Date Range)

**Calendar Views:**
- Month: Grid with appointment count badges
- Week: Time-slotted grid with appointment chips
- Day: Detailed timeline with full appointment cards
- List: DataTable format

**Schedule Dialog:**
- Step 1: Select Provider (ProviderCard list)
- Step 2: Choose Date and Time (Calendar + TimeSlotPicker)
- Step 3: Confirm Details (Summary with form fields)

**Key Features:**
- Drag-and-drop rescheduling
- Color-coded by status
- Conflict detection
- Animated transitions between views

---

### 4. Medical Records Page

**Route:** /medical-records

**Layout:**
- Page header with title "Medical Records", Add Record button
- Patient selector dropdown
- Tab navigation (Overview, Diagnoses, Medications, Procedures)
- Record cards in timeline format
- Load more button

**Record Card:**
- Glass card with icon, title, date, provider
- Expandable details section
- Attached documents list
- Action buttons (Edit, Delete, Print)

**Key Features:**
- Patient filtering
- Record type filtering
- Date range filtering
- Export functionality
- Document attachments

---

### 5. Documents Page

**Route:** /documents

**Layout:**
- Page header with title "Documents", Upload button
- Search bar with filters (Type, Patient, Date)
- DataTable with columns: Icon+Name, Type, Patient, Date, Size, Actions
- Pagination controls

**Upload Dialog:**
- Drag-and-drop zone with animation
- File preview thumbnails
- Patient selector
- Document type selector
- Description field

**Key Features:**
- Multi-file upload
- File preview
- Download/delete actions
- Patient association
- Type categorization

---

### 6. Messages Page

**Route:** /messages

**Layout:**
- Page header with title "Messages", New Message button
- Tab navigation (Inbox, Sent, Drafts)
- 2-column layout: Conversation list (left, 300px), Message thread (right)
- Message input at bottom of thread

**Conversation List:**
- Glass cards with avatar, name, last message preview, timestamp
- Unread indicator badge
- Hover: Lift effect

**Message Thread:**
- Messages in chat bubble format
- Sender bubbles: Right-aligned, primary color
- Receiver bubbles: Left-aligned, gray
- Timestamps between message groups
- Typing indicator animation

**Key Features:**
- Real-time messaging
- Unread counts
- Search conversations
- Message templates
- File attachments

---

### 7. Analytics Page

**Route:** /analytics

**Layout:**
- Page header with title "Analytics", Export button
- Date range selector
- 4 stat cards (Total Visits, Revenue, Avg Wait Time, Patient Satisfaction)
- Full-width Appointment Volume chart
- 2-column grid: Top Diagnoses chart (left), Provider Performance table (right)
- Full-width Patient Demographics chart

**Charts:**
- Line charts with gradient fills
- Bar charts with animated growth
- Pie charts with hover segments
- Radar charts for multi-dimensional data

**Key Features:**
- Date range filtering
- Export to PDF/CSV
- Interactive charts
- Drill-down details

---

### 8. PROM Page

**Route:** /prom

**Layout:**
- Page header with title "PROM Questionnaires", Create button
- Tab navigation (Active, Completed, Templates)
- DataTable with columns: Name, Type, Sent Date, Completion Rate, Actions
- Pagination controls

**Send PROM Dialog:**
- Step 1: Select Questionnaire (card grid)
- Step 2: Choose Patients (searchable list with checkboxes)
- Step 3: Schedule and Send (date picker, message field)

**Key Features:**
- Template library
- Patient selection
- Completion tracking
- Response viewing
- Analytics dashboard

---

### 9. Intake Management Page

**Route:** /intake

**Layout:**
- Page header with title "Intake Forms", Create button
- Tab navigation (Active, Completed, Templates)
- DataTable with columns: Form Name, Patient, Submitted Date, Status, Actions
- Pagination controls

**Form Builder:**
- Drag-and-drop form fields
- Field type selector (text, dropdown, checkbox, date, file upload)
- Conditional logic builder
- Preview mode

**Key Features:**
- Custom form creation
- Patient assignment
- Submission tracking
- PDF export
- E-signature support

---

### 10. Providers Page

**Route:** /providers

**Layout:**
- Page header with title "Providers", Add Provider button
- Grid view of provider cards (3 columns)
- Each card: Avatar, name, title, specialization, availability status, action buttons

**Provider Card:**
- Glass card with gradient accent
- Large avatar with status indicator
- Contact information
- Schedule button
- Edit button

**Add/Edit Dialog:**
- Form with fields: Name, Title, Specialization, Email, Phone, Bio, Avatar upload
- Availability schedule builder
- Save button

**Key Features:**
- Provider directory
- Availability management
- Schedule integration
- Contact information

---

### 11. Settings Page

**Route:** /settings

**Layout:**
- Page header with title "Settings"
- Vertical tab navigation (left sidebar, 200px): Clinic, Users, Billing, Integrations, Security
- Content area (right): Form sections for selected tab

**Clinic Settings:**
- Clinic name, address, phone, email
- Business hours
- Appointment settings (duration, buffer time)
- Notification preferences

**User Settings:**
- User list table
- Role management
- Invite user button
- Permission matrix

**Key Features:**
- Multi-section forms
- Save indicators
- Validation feedback
- Confirmation dialogs

---

### 12. Login Page

**Route:** /login

**Layout:**
- Full-screen gradient background with abstract medical pattern
- Centered glass card (400px width)
- Logo at top
- Login form: Email, Password, Remember Me checkbox
- Login button
- Forgot password link
- Sign up link

**Styling:**
- Large glass card with strong blur
- Animated gradient background
- Floating elements animation
- Form inputs with glass effect

---

### 13. Signup Page

**Route:** /signup

**Layout:**
- Similar to login page
- Signup form: Name, Email, Password, Confirm Password
- Terms checkbox
- Signup button
- Login link

**Validation:**
- Real-time field validation
- Password strength indicator
- Error messages with shake animation

---

### 14. Clinic Registration Page

**Route:** /register-clinic

**Layout:**
- Multi-step form (3 steps)
- Step 1: Clinic Information (name, address, phone)
- Step 2: Admin Account (name, email, password)
- Step 3: Subscription Plan (plan cards with pricing)

**Styling:**
- Full-screen with progress indicator at top
- Large glass card
- Step content with fade transitions

---

### 15. Patient Detail Page

**Route:** /patients/:id

**Layout:**
- Page header with breadcrumbs, patient name, action buttons (Edit, Schedule, Message)
- Patient info card: Avatar, contact info, demographics, status
- Tab navigation (Overview, Medical Records, Appointments, Documents, Messages)
- Tab content area

**Overview Tab:**
- Recent appointments list
- Active medications list
- Recent diagnoses list
- Quick stats (total visits, last visit, next appointment)

**Key Features:**
- Comprehensive patient view
- Quick actions
- Related data aggregation
- Activity timeline

---

## Design Patterns

### Glassmorphism Implementation

**Card Pattern:**
- Background: rgba(255, 255, 255, 0.7)
- Backdrop filter: blur(10px)
- Border: 1px solid rgba(255, 255, 255, 0.18)
- Box shadow: 0 8px 32px rgba(31, 38, 135, 0.15)
- Border radius: 12px

**Layering:**
- Background layer: Gradient or pattern
- Mid layer: Glass panels with blur
- Top layer: Content with shadows
- Floating layer: Modals and dialogs with strong blur

**Color Tinting:**
- Apply subtle color overlays to glass for context
- Primary actions: Blue tint
- Success states: Green tint
- Warnings: Orange tint
- Errors: Red tint

### Animation Patterns

**Page Load:**
1. Fade in background (200ms)
2. Slide up and fade in header (300ms, delay 100ms)
3. Stagger in content cards (300ms each, 50ms delay between)

**List Items:**
- Stagger animation: Each item delays by 50ms
- Slide in from left with fade
- Hover: Slide in colored accent bar from left

**Form Submission:**
1. Button shows loading spinner
2. Form fields fade out
3. Success message fades in with checkmark animation
4. Auto-redirect after 2s with fade out

**Data Updates:**
- Smooth number counting animation
- Chart data transitions with easing
- Color transitions for status changes

### Responsive Behavior

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Mobile Adaptations:**
- Sidebar collapses to hamburger menu
- Stat cards stack vertically
- Tables switch to card view
- Dialogs become full-screen
- Touch-friendly button sizes (min 44px)

**Tablet Adaptations:**
- Sidebar remains visible but narrower
- 2-column grids become 1-column
- Reduced padding and margins

### Accessibility

**Focus States:**
- Visible focus ring with primary color
- Skip to content link
- Keyboard navigation support

**Color Contrast:**
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- Status indicators include icons, not just color

**Screen Reader Support:**
- Proper ARIA labels
- Semantic HTML
- Alt text for images
- Form labels and descriptions

---

## Implementation Notes for Figma

**Design System Setup:**
1. Create color styles for all tokens
2. Create text styles for typography scale
3. Create effect styles for shadows and blurs
4. Create component variants for all states

**Component Organization:**
- Group by category (Forms, Layout, Feedback, etc.)
- Use auto-layout for responsive behavior
- Create variants for all states (default, hover, active, disabled)
- Use component properties for customization

**Glassmorphism in Figma:**
- Use background blur effect (10-20px)
- Layer semi-transparent white fill (70-80% opacity)
- Add subtle border (1px, white, 18% opacity)
- Apply shadow effects
- Use blend modes for color tints

**Animation Specifications:**
- Document all transitions in component descriptions
- Use Smart Animate for prototypes
- Specify easing curves and durations
- Create interaction examples for key flows

**Responsive Design:**
- Create frames for mobile, tablet, desktop
- Use constraints and auto-layout
- Test all breakpoints
- Document responsive behavior

---

**End of Specification**

This document provides complete specifications for recreating the Qivr Clinic Dashboard in Figma with modern glassmorphism UI, smooth animations, and a clean high-tech aesthetic. All 25 components, 15 pages, design tokens, and interaction patterns are documented for Figma AI generation.
