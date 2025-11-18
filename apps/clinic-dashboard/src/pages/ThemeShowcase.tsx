import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  TextField,
  Chip,
  Alert,
  Paper,
  Grid,
  Divider,
} from '@mui/material';
import { 
  QivrButton, 
  QivrCard, 
  StatCard,
  EmptyState,
  LoadingSpinner,
} from '@qivr/design-system';
import { 
  CheckCircle, 
  Warning, 
  Error as ErrorIcon,
  Info,
  TrendingUp,
} from '@mui/icons-material';

export default function ThemeShowcase() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom>
        Qivr Design System Showcase
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        All components use the centralized theme. Update colors and styles in one place.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Colors */}
      <Typography variant="h4" gutterBottom>
        Colors
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6">Primary</Typography>
            <Typography variant="body2">Main brand color</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, bgcolor: 'secondary.main', color: 'white' }}>
            <Typography variant="h6">Secondary</Typography>
            <Typography variant="body2">Accent color</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, bgcolor: 'success.main', color: 'white' }}>
            <Typography variant="h6">Success</Typography>
            <Typography variant="body2">Positive actions</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, bgcolor: 'error.main', color: 'white' }}>
            <Typography variant="h6">Error</Typography>
            <Typography variant="body2">Destructive actions</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Buttons */}
      <Typography variant="h4" gutterBottom>
        Buttons
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
        <Button variant="contained">Contained</Button>
        <Button variant="outlined">Outlined</Button>
        <Button variant="text">Text</Button>
        <QivrButton emphasize="primary">Qivr Primary</QivrButton>
        <QivrButton emphasize="secondary">Qivr Secondary</QivrButton>
        <QivrButton emphasize="subtle">Qivr Subtle</QivrButton>
        <Button variant="contained" color="success">Success</Button>
        <Button variant="contained" color="error">Error</Button>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Cards */}
      <Typography variant="h4" gutterBottom>
        Cards
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Standard Card
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Default MUI card with theme styling
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <QivrCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Qivr Card
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Design system card component
              </Typography>
            </CardContent>
          </QivrCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            label="Total Patients"
            value="1,234"
            icon={<TrendingUp />}
            iconColor="success.main"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Form Elements */}
      <Typography variant="h4" gutterBottom>
        Form Elements
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, mb: 4 }}>
        <TextField label="Text Field" placeholder="Enter text" />
        <TextField label="Outlined" variant="outlined" />
        <TextField label="Filled" variant="filled" />
        <TextField label="Disabled" disabled value="Disabled field" />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Chips */}
      <Typography variant="h4" gutterBottom>
        Chips
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4 }}>
        <Chip label="Default" />
        <Chip label="Primary" color="primary" />
        <Chip label="Secondary" color="secondary" />
        <Chip label="Success" color="success" />
        <Chip label="Error" color="error" />
        <Chip label="Warning" color="warning" />
        <Chip label="Clickable" onClick={() => {}} />
        <Chip label="Deletable" onDelete={() => {}} />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Alerts */}
      <Typography variant="h4" gutterBottom>
        Alerts
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
        <Alert severity="success" icon={<CheckCircle />}>
          Success alert - Action completed successfully
        </Alert>
        <Alert severity="info" icon={<Info />}>
          Info alert - Here&apos;s some helpful information
        </Alert>
        <Alert severity="warning" icon={<Warning />}>
          Warning alert - Please review this carefully
        </Alert>
        <Alert severity="error" icon={<ErrorIcon />}>
          Error alert - Something went wrong
        </Alert>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Typography */}
      <Typography variant="h4" gutterBottom>
        Typography
      </Typography>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" gutterBottom>Heading 1</Typography>
        <Typography variant="h2" gutterBottom>Heading 2</Typography>
        <Typography variant="h3" gutterBottom>Heading 3</Typography>
        <Typography variant="h4" gutterBottom>Heading 4</Typography>
        <Typography variant="h5" gutterBottom>Heading 5</Typography>
        <Typography variant="h6" gutterBottom>Heading 6</Typography>
        <Typography variant="body1" gutterBottom>
          Body 1 - Regular paragraph text with comfortable line height
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Body 2 - Smaller text for secondary content
        </Typography>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Design System Components */}
      <Typography variant="h4" gutterBottom>
        Design System Components
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <EmptyState
            title="No data yet"
            description="Get started by adding your first item"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <LoadingSpinner size="large" />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
