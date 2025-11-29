import {
  Box,
  Card,
  Typography,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";

const features = [
  {
    key: "aiTriage",
    name: "AI Triage",
    description: "AI-powered patient intake triage",
    starter: false,
    professional: true,
    enterprise: true,
  },
  {
    key: "aiTreatmentPlans",
    name: "AI Treatment Plans",
    description: "Generate treatment plans with AI",
    starter: false,
    professional: true,
    enterprise: true,
  },
  {
    key: "documentOcr",
    name: "Document OCR",
    description: "Extract text from uploaded documents",
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    key: "smsReminders",
    name: "SMS Reminders",
    description: "Appointment reminders via SMS",
    starter: false,
    professional: true,
    enterprise: true,
  },
  {
    key: "apiAccess",
    name: "API Access",
    description: "External API for integrations",
    starter: false,
    professional: false,
    enterprise: true,
  },
  {
    key: "customBranding",
    name: "Custom Branding",
    description: "White-label with clinic branding",
    starter: false,
    professional: false,
    enterprise: true,
  },
  {
    key: "hipaaAuditLogs",
    name: "HIPAA Audit Logs",
    description: "Detailed access logging for compliance",
    starter: false,
    professional: true,
    enterprise: true,
  },
];

export default function FeatureFlags() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Feature Flags
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Default features by plan tier
      </Typography>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Feature</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">
                  <Chip
                    label="Starter"
                    size="small"
                    sx={{ bgcolor: "#64748b", color: "white" }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label="Professional"
                    size="small"
                    sx={{ bgcolor: "#6366f1", color: "white" }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label="Enterprise"
                    size="small"
                    sx={{ bgcolor: "#ec4899", color: "white" }}
                  />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {features.map((feature) => (
                <TableRow key={feature.key}>
                  <TableCell>
                    <Typography fontWeight={600}>{feature.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Switch checked={feature.starter} disabled />
                  </TableCell>
                  <TableCell align="center">
                    <Switch checked={feature.professional} disabled />
                  </TableCell>
                  <TableCell align="center">
                    <Switch checked={feature.enterprise} disabled />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Note: Individual tenant flags can be overridden in the tenant detail
        page.
      </Typography>
    </Box>
  );
}
