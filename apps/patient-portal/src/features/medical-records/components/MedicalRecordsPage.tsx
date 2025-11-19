import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import { format } from "date-fns";
import { useMedicalRecordsData } from "../hooks/useMedicalRecordsData";

const formatDate = (date?: string) => {
  if (!date) return "Unknown";
  try {
    return format(new Date(date), "MMM dd, yyyy");
  } catch {
    return date;
  }
};

const MedicalRecordsPage: React.FC = () => {
  const {
    vitalSigns,
    labGroups,
    medications,
    allergies,
    immunizations,
    physioHistory,
    loading,
  } = useMedicalRecordsData();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Medical Records
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review recent vitals, lab results, medications, and immunizations.
      </Typography>

      {loading ? (
        <Typography variant="body2">Loading medical data…</Typography>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Medical History
                </Typography>
                {physioHistory.length ? (
                  <List>
                    {physioHistory.slice(0, 5).map((history) => (
                      <React.Fragment key={history.id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                              >
                                <Typography variant="body2">
                                  {history.title}
                                </Typography>
                                <Chip
                                  label={history.category}
                                  size="small"
                                  variant="outlined"
                                />
                              </Stack>
                            }
                            secondary={`${history.status} • ${history.description.substring(0, 50)}${history.description.length > 50 ? "..." : ""}`}
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No medical history recorded.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Latest Pain Assessments
                </Typography>
                {vitalSigns.length ? (
                  <List>
                    {vitalSigns.slice(0, 3).map((assessment) => (
                      <React.Fragment key={assessment.id}>
                        <ListItem>
                          <ListItemText
                            primary={`Pain Level: ${assessment.overallPainLevel || 0}/10`}
                            secondary={`Recorded ${formatDate(assessment.recordedAt)} • Impact: ${assessment.functionalImpact || "none"}`}
                          />
                          <Chip
                            label={
                              assessment.overallPainLevel > 6
                                ? "High"
                                : assessment.overallPainLevel > 3
                                  ? "Moderate"
                                  : "Low"
                            }
                            color={
                              assessment.overallPainLevel > 6
                                ? "error"
                                : assessment.overallPainLevel > 3
                                  ? "warning"
                                  : "success"
                            }
                            size="small"
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No pain assessments recorded.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Medications
                </Typography>
                {medications.length ? (
                  <List>
                    {medications.slice(0, 3).map((medication) => (
                      <React.Fragment key={medication.id}>
                        <ListItem>
                          <ListItemText
                            primary={medication.name}
                            secondary={`${medication.dosage} • ${medication.frequency}`}
                          />
                          <Chip label={medication.status} size="small" />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No medications on file.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Lab Results
                </Typography>
                {labGroups.length ? (
                  <List>
                    {labGroups.slice(0, 3).map((group) => (
                      <React.Fragment key={group.category}>
                        <ListItem>
                          <ListItemText
                            primary={`${group.category} (${group.tests.length} tests)`}
                            secondary={`Last updated ${formatDate(group.date)}`}
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No lab results available.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Allergies & Immunizations
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2">Allergies</Typography>
                    {allergies.length ? (
                      <List>
                        {allergies.slice(0, 3).map((allergy) => (
                          <React.Fragment key={allergy.id}>
                            <ListItem>
                              <ListItemText
                                primary={allergy.allergen}
                                secondary={`${allergy.type} • ${allergy.severity}`}
                              />
                            </ListItem>
                            <Divider component="li" />
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No allergies reported.
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="subtitle2">Immunizations</Typography>
                    {immunizations.length ? (
                      <List>
                        {immunizations.slice(0, 3).map((shot) => (
                          <React.Fragment key={shot.id}>
                            <ListItem>
                              <ListItemText
                                primary={shot.vaccine}
                                secondary={`${shot.facility ?? "Clinic"} • ${formatDate(shot.date)}`}
                              />
                            </ListItem>
                            <Divider component="li" />
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No immunizations on record.
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default MedicalRecordsPage;
