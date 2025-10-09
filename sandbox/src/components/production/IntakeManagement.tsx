import React, { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import {
  Assignment as AssignmentIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Archive as ArchiveIcon,
  PlayArrow as StartIcon,
  EventAvailable as ConfirmIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  computeIntakeStats,
  formatSubmittedAt,
  intakeSubmissions,
  type IntakeSubmission,
} from '../../data/intakeMockData';

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type StatusFilter = 'all' | 'pending' | 'reviewing' | 'scheduled' | 'approved' | 'rejected';

type IntakeTab = 0 | 1 | 2;

const severityColor: Record<string, ChipProps['color']> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'default',
};

const statusColor: Record<string, ChipProps['color']> = {
  pending: 'default',
  reviewing: 'warning',
  scheduled: 'info',
  approved: 'success',
  rejected: 'error',
};

const IntakeManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [currentTab, setCurrentTab] = useState<IntakeTab>(0);
  const [records, setRecords] = useState<IntakeSubmission[]>(intakeSubmissions);
  const [selectedIntake, setSelectedIntake] = useState<IntakeSubmission | null>(null);

  const stats = useMemo(() => computeIntakeStats(records), [records]);

  const filtered = useMemo(() => {
    const lowered = search.trim().toLowerCase();
    return records.filter((intake) => {
      const matchesSearch =
        lowered.length === 0 ||
        intake.patientName.toLowerCase().includes(lowered) ||
        intake.email.toLowerCase().includes(lowered) ||
        intake.conditionType.toLowerCase().includes(lowered);

      const matchesSeverity = severity === 'all' || intake.severity === severity;
      const matchesStatus = status === 'all' || intake.status === status;
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [records, search, severity, status]);

  const grouped = useMemo(() => {
    return {
      pending: filtered.filter((item) => item.status === 'pending'),
      reviewing: filtered.filter((item) => item.status === 'reviewing'),
      processed: filtered.filter((item) =>
        item.status === 'scheduled' || item.status === 'approved' || item.status === 'rejected',
      ),
    };
  }, [filtered]);

  const handleUpdateStatus = (intakeId: string, nextStatus: IntakeSubmission['status']) => {
    setRecords((prev) =>
      prev.map((item) =>
        item.id === intakeId
          ? {
              ...item,
              status: nextStatus,
            }
          : item,
      ),
    );
  };

  const handleViewDetails = (intake: IntakeSubmission) => {
    setSelectedIntake(intake);
  };

  const renderIntakeCard = (intake: IntakeSubmission) => (
    <Paper
      key={intake.id}
      variant="outlined"
      sx={{ p: 2, borderRadius: 2, mb: 2 }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {intake.patientName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submitted {formatSubmittedAt(intake.submittedAt)}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip
                size="small"
                label={intake.severity.toUpperCase()}
                color={severityColor[intake.severity] ?? 'default'}
              />
              <Chip
                size="small"
                label={intake.status.replace('-', ' ')}
                color={statusColor[intake.status] ?? 'default'}
              />
              {intake.followUpRequired && <Chip size="small" label="Follow-up" color="primary" variant="outlined" />}
            </Stack>
          </Box>
        </Stack>

        <Stack spacing={1} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
          <Typography variant="body2">{intake.conditionType}</Typography>
          <Typography variant="caption" color="text.secondary">
            Preferred: {intake.preferredVisitType} • Provider: {intake.preferredProvider ?? 'Any'}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="View details">
              <IconButton onClick={() => handleViewDetails(intake)}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            {intake.status === 'pending' && (
              <Tooltip title="Start review">
                <IconButton onClick={() => handleUpdateStatus(intake.id, 'reviewing')}>
                  <StartIcon />
                </IconButton>
              </Tooltip>
            )}
            {intake.status === 'reviewing' && (
              <Tooltip title="Schedule visit">
                <IconButton onClick={() => handleUpdateStatus(intake.id, 'scheduled')}>
                  <ScheduleIcon />
                </IconButton>
              </Tooltip>
            )}
            {intake.status === 'scheduled' && (
              <Tooltip title="Confirm completion">
                <IconButton onClick={() => handleUpdateStatus(intake.id, 'approved')}>
                  <ConfirmIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Archive">
              <IconButton onClick={() => handleUpdateStatus(intake.id, 'rejected')}>
                <ArchiveIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );

  return (
    <Box>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Intake Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review submitted intake forms, prioritize urgent patients, and coordinate follow-up actions.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total submissions
                </Typography>
                <Typography variant="h4">{stats.total}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.today} submitted today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Pending review
                </Typography>
                <Typography variant="h4">{stats.pending}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.critical} marked critical
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  In review
                </Typography>
                <Typography variant="h4">{stats.reviewing}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Updated {format(new Date(), 'MMM d h:mm a')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Processed
                </Typography>
                <Typography variant="h4">{stats.processed}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Includes scheduled and approved
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  placeholder="Search patients, emails, or conditions"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  size="small"
                  sx={{ minWidth: { xs: '100%', md: 320 } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  select
                  size="small"
                  label="Severity"
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value as SeverityFilter)}
                >
                  <MenuItem value="all">All severity</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as StatusFilter)}
                >
                  <MenuItem value="all">All status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="reviewing">Reviewing</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Archived</MenuItem>
                </TextField>
              </Stack>

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="outlined" startIcon={<FilterIcon />} color="inherit">
                  Save filter
                </Button>
                <Button variant="contained" startIcon={<DownloadIcon />} color="primary">
                  Export queue
                </Button>
              </Stack>
            </Stack>

            <Tabs
              value={currentTab}
              onChange={(_event, value) => setCurrentTab(value)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Badge badgeContent={grouped.pending.length} color="warning">
                      <AssignmentIcon fontSize="small" />
                    </Badge>
                    <Typography variant="body2">Queue</Typography>
                  </Stack>
                }
              />
              <Tab
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Badge badgeContent={grouped.reviewing.length} color="info">
                      <ScheduleIcon fontSize="small" />
                    </Badge>
                    <Typography variant="body2">In Review</Typography>
                  </Stack>
                }
              />
              <Tab
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Badge badgeContent={grouped.processed.length} color="success">
                      <ConfirmIcon fontSize="small" />
                    </Badge>
                    <Typography variant="body2">Processed</Typography>
                  </Stack>
                }
              />
            </Tabs>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {currentTab === 0 && (
              <Box>
                {grouped.pending.length === 0 ? (
                  <Alert severity="success">No pending intakes in the queue!</Alert>
                ) : (
                  grouped.pending.map(renderIntakeCard)
                )}
              </Box>
            )}

            {currentTab === 1 && (
              <Box>
                {grouped.reviewing.length === 0 ? (
                  <Alert severity="info">Select an intake to begin the review workflow.</Alert>
                ) : (
                  grouped.reviewing.map(renderIntakeCard)
                )}
              </Box>
            )}

            {currentTab === 2 && (
              <Box>
                {grouped.processed.length === 0 ? (
                  <Alert severity="info">No completed or archived intakes yet.</Alert>
                ) : (
                  grouped.processed.map(renderIntakeCard)
                )}
              </Box>
            )}
          </Stack>
        </Paper>
      </Stack>

      <Dialog
        open={Boolean(selectedIntake)}
        onClose={() => setSelectedIntake(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Intake details</DialogTitle>
        <DialogContent dividers>
          {selectedIntake ? (
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 48, height: 48 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedIntake.patientName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedIntake.email} • {selectedIntake.phone}
                  </Typography>
                </Box>
              </Stack>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Submission</Typography>
                    <Typography variant="body2">Submitted {formatSubmittedAt(selectedIntake.submittedAt)}</Typography>
                    <Typography variant="body2">Severity: {selectedIntake.severity.toUpperCase()}</Typography>
                    <Typography variant="body2">Status: {selectedIntake.status}</Typography>
                    <Typography variant="body2">Preferred provider: {selectedIntake.preferredProvider ?? 'Any'}</Typography>
                    <Typography variant="body2">Preferred visit: {selectedIntake.preferredVisitType}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Insurance</Typography>
                    <Typography variant="body2">Carrier: {selectedIntake.insuranceCarrier ?? 'Not provided'}</Typography>
                    <Typography variant="body2">Status: {selectedIntake.insuranceStatus}</Typography>
                    <Typography variant="body2">Referred by: {selectedIntake.referredBy ?? 'Self'}</Typography>
                    <Typography variant="body2">Visit history: {selectedIntake.appointmentHistoryCount} visits</Typography>
                  </Stack>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Presenting symptoms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedIntake.symptoms}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Notes
                </Typography>
                {selectedIntake.notes.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No care team notes recorded yet.
                  </Typography>
                ) : (
                  <List>
                    {selectedIntake.notes.map((note) => (
                      <ListItem key={note.id} alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>
                            <AssignmentIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle2">{note.author}</Typography>
                              <Chip size="small" label={note.severity} color={note.severity === 'critical' ? 'error' : note.severity === 'warning' ? 'warning' : 'default'} />
                            </Stack>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary" paragraph>
                                {note.message}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(note.timestamp), 'MMM d, yyyy h:mm a')}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Attachments
                </Typography>
                {selectedIntake.attachments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No files uploaded
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {selectedIntake.attachments.map((file) => (
                      <Paper key={file.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                          <Typography variant="body2">{file.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {file.type} • {file.size}
                          </Typography>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedIntake(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntakeManagement;
