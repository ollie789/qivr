# QIVR MUI Styling Sandbox

A standalone sandbox environment for experimenting with Material-UI (MUI) styling and components for the QIVR healthcare platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The sandbox will open at [http://localhost:3000](http://localhost:3000)

## 🎨 Features

### Two Dashboard Views
- **Clinic Dashboard**: Healthcare provider interface with appointment management, patient analytics, and performance metrics
- **Patient Portal**: Patient-facing interface with health tracking, appointments, and medical records

### Styling Capabilities
- **Custom MUI Theme**: Comprehensive theme configuration with healthcare-focused color palette
- **Dark/Light Mode Toggle**: Switch between light and dark themes
- **Component Showcase**: Various MUI components with custom styling
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Interactive Charts**: Data visualization with Recharts library

### Key Components Demonstrated

#### Clinic Dashboard
- Stats cards with hover effects
- Appointment scheduling timeline
- Activity tracking lists
- Performance metrics tables
- Analytics charts (Area, Bar, Pie, Radar)
- Real-time notifications

#### Patient Portal
- Health score visualization
- Treatment progress tracking
- Medication management
- Document repository
- Pain tracking charts
- Timeline components for appointments

## 📁 Project Structure

```
sandbox/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ClinicDashboard.tsx
│   │   └── PatientDashboard.tsx
│   ├── data/
│   │   ├── clinicMockData.ts
│   │   └── patientMockData.ts
│   ├── theme/
│   │   └── theme.ts
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
└── package.json
```

## 🎯 Customization Guide

### Theme Customization

Edit `src/theme/theme.ts` to modify:
- Color palette
- Typography settings
- Component overrides
- Custom utility styles
- Spacing and breakpoints

### Adding New Components

1. Create component in `src/components/`
2. Import mock data from `src/data/`
3. Apply theme using `useTheme()` hook or `sx` prop
4. Use custom styles from `customStyles` object

### Mock Data

All mock data generators are in `src/data/`:
- Modify existing generators
- Add new data types
- Adjust random data parameters

## 🛠️ Available Scripts

- `npm start` - Run development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Lint TypeScript files
- `npm run format` - Format code with Prettier

## 💡 Styling Tips

### Using the Theme

```typescript
// In components
import { useTheme } from '@mui/material';

const theme = useTheme();

// Use theme values
<Box sx={{ color: theme.palette.primary.main }} />
```

### Custom Styles

```typescript
import { customStyles } from '../theme/theme';

// Apply glassmorphism effect
<Card sx={{ ...customStyles.glassmorphism }} />

// Apply gradient background
<Box sx={{ background: customStyles.gradientBackground.primary }} />

// Apply hover animation
<Card sx={{ ...customStyles.cardHover }} />
```

### Responsive Design

```typescript
<Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
  <Grid item xs={12} sm={6} md={4}>
    {/* Content */}
  </Grid>
</Grid>
```

## 🔧 Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Material-UI v5** - Component library
- **Recharts** - Data visualization
- **date-fns** - Date utilities
- **Emotion** - CSS-in-JS styling

## 📝 Notes

- This is a standalone sandbox, not connected to the main QIVR backend
- All data is mocked and randomly generated
- Designed for styling experiments and UI prototyping
- Components can be extracted and integrated into the main application

## 🤝 Contributing

When experimenting with new styles:
1. Test in both light and dark modes
2. Ensure responsive behavior
3. Maintain accessibility standards
4. Document any new custom styles in theme.ts

## 📄 License

This sandbox is part of the QIVR project and follows the same licensing terms.