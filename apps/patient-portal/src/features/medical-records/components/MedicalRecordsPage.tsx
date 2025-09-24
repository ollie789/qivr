import React from 'react';
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
} from '@mui/material';
import { format } from 'date-fns';
import { useMedicalRecordsData } from '../hooks/useMedicalRecordsData';

const formatDate = (date?: string) => {
  if (!date) return 'Unknown';
  try {
    return format(new Date(date), 'MMM dd, yyyy');
  } catch {
    return date;
  }
};

const MedicalRecordsPage: React.FC = () => {
  const { summary, vitalSigns, labGroups, medications, allergies, immunizations, loading } =
    useMedicalRecordsData();

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
                <Typography variant="h6" gutterBottom>Conditions</Typography>
                {summary?.conditions.length ? (
                  <List>
                    {summary.conditions.slice(0, 5).map((condition) => (
                      <React.Fragment key={condition.id}>
                        <ListItem>
                          <ListItemText
                            primary={condition.condition}
                            secondary={`${condition.status} • Diagnosed ${formatDate(condition.diagnosedDate)}`}
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No conditions recorded.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Latest Vitals</Typography>
                {vitalSigns.length ? (
                  <List>
                    {vitalSigns.slice(0, 3).map((vital) => (
                      <React.Fragment key={vital.id}>
                        <ListItem>
                          <ListItemText
                            primary={`Blood Pressure ${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic}`}
                            secondary={`Recorded ${formatDate(vital.date)} • Heart Rate ${vital.heartRate} bpm`}
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No vitals recorded.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Medications</Typography>
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
                <Typography variant="h6" gutterBottom>Recent Lab Results</Typography>
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
                <Typography variant="h6" gutterBottom>Allergies & Immunizations</Typography>
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
                                secondary={`${shot.facility ?? 'Clinic'} • ${formatDate(shot.date)}`}
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
