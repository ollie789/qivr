# Qivr Intake Widget

Embeddable intake form for new patients. Clinics can add this to their website to collect patient information before their first visit.

## Embedding on Your Website

Add this code to your website where you want the intake form to appear:

```html
<!-- Qivr Intake Widget -->
<div
  id="qivr-intake-widget"
  data-clinic-id="YOUR_CLINIC_ID"
  data-api-url="https://api.qivr.pro"
></div>
<script src="https://widget.qivr.pro/intake-widget.js"></script>
```

Replace `YOUR_CLINIC_ID` with your clinic's ID from the Qivr dashboard.

## Configuration Options

| Attribute        | Description                                  | Required |
| ---------------- | -------------------------------------------- | -------- |
| `data-clinic-id` | Your clinic's unique identifier              | Yes      |
| `data-api-url`   | API endpoint (default: https://api.qivr.pro) | No       |

## Development

```bash
# Install dependencies
npm install

# Start dev server (port 3030)
npm run dev

# Build for production
npm run build
```

## How It Works

1. Patient fills out the multi-step form:
   - Personal details (name, contact info)
   - Pain location (3D body map)
   - Pain details (intensity, duration, qualities)
   - Medical history
   - Consent

2. Form submits to `/api/intake/submit` endpoint

3. Creates:
   - Patient record (if new email)
   - Evaluation with status "pending"
   - Intake submission for tracking

4. Clinic receives notification and can review in dashboard

## Styling

The widget uses Material UI with a light theme. It's designed to be self-contained and not conflict with your website's styles.
