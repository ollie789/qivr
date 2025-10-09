import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Paper,
  Radio,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowDownward as ArrowDownIcon,
  ArrowUpward as ArrowUpIcon,
  Checklist as LibraryIcon,
  ContentCopy as DuplicateIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  QuestionAnswer as QuestionIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material/Select';

export type PromQuestionType =
  | 'radio'
  | 'checkbox'
  | 'scale'
  | 'slider'
  | 'text'
  | 'number'
  | 'boolean'
  | 'date';

interface PromQuestion {
  id: string;
  title: string;
  description?: string;
  type: PromQuestionType;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  scaleLabels?: { min: string; max: string };
  guidance?: string;
}

interface PromSchedule {
  triggers: Array<'manual' | 'post-appointment' | 'recurring'>;
  frequency: 'daily' | 'weekly' | 'monthly' | 'adhoc';
  reminderDays: number[];
}

interface PromScoringRange {
  min: number;
  max: number;
  label: string;
  color: string;
}

interface PromTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedTime: number;
  tags: string[];
  questions: PromQuestion[];
  schedule: PromSchedule;
  scoring: {
    method: 'sum' | 'average' | 'weighted';
    ranges: PromScoringRange[];
  };
  outcomesTracked: string[];
  isPublished: boolean;
}

interface QuestionLibraryCategory {
  name: string;
  description: string;
  questions: Array<Pick<PromQuestion, 'title' | 'type' | 'options' | 'min' | 'max' | 'step' | 'scaleLabels'>>;
}

const questionLibrary: QuestionLibraryCategory[] = [
  {
    name: 'Pain & Symptoms',
    description: 'Baseline pain intensity, frequency, and medication usage',
    questions: [
      {
        title: 'Rate your average pain level today',
        type: 'scale',
        min: 0,
        max: 10,
        step: 1,
        scaleLabels: { min: 'No pain', max: 'Worst possible pain' },
      },
      {
        title: 'How often did pain disrupt your sleep?',
        type: 'radio',
        options: ['Never', '1-2 nights', '3-4 nights', 'Every night'],
      },
      {
        title: 'Which activities increased your pain?',
        type: 'checkbox',
        options: ['Walking', 'Sitting', 'Lifting', 'Sleeping', 'Work duties'],
      },
    ],
  },
  {
    name: 'Function & Mobility',
    description: 'Daily activity performance and confidence levels',
    questions: [
      {
        title: 'How confident are you walking without assistance?',
        type: 'radio',
        options: ['Very confident', 'Somewhat confident', 'Not confident'],
      },
      {
        title: 'How many minutes of moderate activity did you complete?',
        type: 'number',
        min: 0,
        max: 120,
        step: 5,
      },
      {
        title: 'Select the mobility aids you are currently using',
        type: 'checkbox',
        options: ['None', 'Walker', 'Crutches', 'Cane'],
      },
    ],
  },
  {
    name: 'Wellness & Mental Health',
    description: 'Mood, stress, and overall wellbeing indicators',
    questions: [
      {
        title: 'Overall, how was your mood this week?',
        type: 'radio',
        options: ['Very positive', 'Somewhat positive', 'Neutral', 'Low'],
      },
      {
        title: 'Rate your stress today',
        type: 'slider',
        min: 0,
        max: 10,
        step: 1,
      },
      {
        title: 'Share something positive from your week',
        type: 'text',
      },
    ],
  },
];

const initialTemplates: PromTemplate[] = [
  {
    id: 'tmpl-pain',
    name: 'Pain & Function Check-in',
    description: 'Daily pain intensity, medication usage, and functional status tracking.',
    category: 'Pain Management',
    estimatedTime: 6,
    tags: ['daily', 'pain score', 'mobility'],
    outcomesTracked: ['Pain score', 'Function score'],
    isPublished: true,
    questions: [
      {
        id: 'q-pain-intensity',
        title: 'Rate your pain in the last 24 hours',
        type: 'scale',
        required: true,
        min: 0,
        max: 10,
        step: 1,
        scaleLabels: { min: 'No pain', max: 'Worst possible pain' },
        guidance: 'Consider your average pain level for the entire day.',
      },
      {
        id: 'q-pain-medications',
        title: 'How many doses of pain medication did you take?',
        type: 'radio',
        required: true,
        options: ['None', '1 dose', '2 doses', '3+ doses'],
      },
      {
        id: 'q-pain-impact',
        title: 'Select activities where pain limited you',
        type: 'checkbox',
        required: false,
        options: ['Walking', 'Sleeping', 'Work duties', 'Exercise'],
      },
    ],
    schedule: {
      triggers: ['manual', 'recurring'],
      frequency: 'daily',
      reminderDays: [1, 3],
    },
    scoring: {
      method: 'average',
      ranges: [
        { min: 0, max: 3, label: 'Low', color: '#4CAF50' },
        { min: 4, max: 6, label: 'Moderate', color: '#FF9800' },
        { min: 7, max: 10, label: 'Severe', color: '#F44336' },
      ],
    },
  },
  {
    id: 'tmpl-post-op',
    name: 'Post-operative Knee Recovery',
    description: 'Weekly PROM following total knee replacement to monitor recovery milestones.',
    category: 'Orthopedics',
    estimatedTime: 8,
    tags: ['weekly', 'post-op', 'rehab'],
    outcomesTracked: ['Mobility score', 'Exercise adherence'],
    isPublished: false,
    questions: [
      {
        id: 'q-knee-flexion',
        title: 'How far can you bend your knee comfortably?',
        type: 'slider',
        required: true,
        min: 0,
        max: 120,
        step: 5,
        guidance: 'Measured in degrees. 120° equals full flexion.',
      },
      {
        id: 'q-mobility-confidence',
        title: 'How confident are you walking without assistance?',
        type: 'radio',
        required: true,
        options: ['Very confident', 'Somewhat confident', 'Not confident'],
      },
      {
        id: 'q-exercise-count',
        title: 'How many times did you complete your home exercises this week?',
        type: 'number',
        required: false,
        min: 0,
        max: 21,
        step: 1,
      },
    ],
    schedule: {
      triggers: ['post-appointment', 'recurring'],
      frequency: 'weekly',
      reminderDays: [2, 5],
    },
    scoring: {
      method: 'weighted',
      ranges: [
        { min: 0, max: 40, label: 'Needs review', color: '#EF4444' },
        { min: 41, max: 70, label: 'On track', color: '#F59E0B' },
        { min: 71, max: 100, label: 'Excellent', color: '#10B981' },
      ],
    },
  },
];

const questionTypeLabels: Record<PromQuestionType, string> = {
  radio: 'Multiple choice',
  checkbox: 'Multi-select',
  scale: 'Numeric scale',
  slider: 'Slider',
  text: 'Free text',
  number: 'Number',
  boolean: 'Yes / No',
  date: 'Date',
};

const PROMBuilder: React.FC = () => {
  const [templates, setTemplates] = useState<PromTemplate[]>(initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplates[0]?.id ?? '');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    initialTemplates[0]?.questions[0]?.id ?? null,
  );
  const [activeSection, setActiveSection] = useState(0);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  const selectedQuestion = useMemo(() => {
    if (!selectedTemplate || !selectedQuestionId) return null;
    return selectedTemplate.questions.find((question) => question.id === selectedQuestionId) ?? null;
  }, [selectedTemplate, selectedQuestionId]);

  const updateTemplate = (updater: (template: PromTemplate) => PromTemplate) => {
    setTemplates((prev) =>
      prev.map((template) => (template.id === selectedTemplateId ? updater(template) : template)),
    );
  };

  const handleAddQuestion = (blueprint: QuestionLibraryCategory['questions'][number]) => {
    if (!selectedTemplate) return;
    const newQuestion: PromQuestion = {
      id: `q-${Date.now()}`,
      title: blueprint.title,
      type: blueprint.type,
      required: true,
      options: blueprint.options,
      min: blueprint.min,
      max: blueprint.max,
      step: blueprint.step,
      scaleLabels: blueprint.scaleLabels,
    };

    updateTemplate((template) => ({
      ...template,
      questions: [...template.questions, newQuestion],
    }));
    setSelectedQuestionId(newQuestion.id);
  };

  const handleInsertBlankQuestion = (type: PromQuestionType) => {
    const newQuestion: PromQuestion = {
      id: `q-${Date.now()}`,
      title: 'New question',
      type,
      required: false,
      options: type === 'radio' || type === 'checkbox' ? ['Option 1', 'Option 2'] : undefined,
      min: type === 'scale' || type === 'slider' ? 0 : undefined,
      max: type === 'scale' || type === 'slider' ? 10 : undefined,
      step: type === 'slider' ? 1 : undefined,
      scaleLabels: type === 'scale' ? { min: 'Low', max: 'High' } : undefined,
    };

    updateTemplate((template) => ({
      ...template,
      questions: [...template.questions, newQuestion],
    }));
    setSelectedQuestionId(newQuestion.id);
  };

  const handleQuestionChange = <K extends keyof PromQuestion>(field: K, value: PromQuestion[K]) => {
    updateTemplate((template) => ({
      ...template,
      questions: template.questions.map((question) =>
        question.id === selectedQuestionId ? { ...question, [field]: value } : question,
      ),
    }));
  };

  const handleDuplicateQuestion = (questionId: string) => {
    updateTemplate((template) => {
      const index = template.questions.findIndex((question) => question.id === questionId);
      if (index === -1) return template;
      const question = template.questions[index];
      const duplicate: PromQuestion = {
        ...question,
        id: `q-${Date.now()}`,
        title: `${question.title} (Copy)`,
      };
      const questions = [...template.questions];
      questions.splice(index + 1, 0, duplicate);
      setSelectedQuestionId(duplicate.id);
      return {
        ...template,
        questions,
      };
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    updateTemplate((template) => {
      const questions = template.questions.filter((question) => question.id !== questionId);
      if (selectedQuestionId === questionId) {
        setSelectedQuestionId(questions[0]?.id ?? null);
      }
      return {
        ...template,
        questions,
      };
    });
  };

  const handleReorderQuestion = (questionId: string, direction: 'up' | 'down') => {
    updateTemplate((template) => {
      const index = template.questions.findIndex((question) => question.id === questionId);
      if (index === -1) return template;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= template.questions.length) {
        return template;
      }
      const questions = [...template.questions];
      const temp = questions[index];
      questions[index] = questions[targetIndex];
      questions[targetIndex] = temp;
      return {
        ...template,
        questions,
      };
    });
  };

  const handleReminderToggle = (day: number) => {
    updateTemplate((template) => {
      const nextReminder = template.schedule.reminderDays.includes(day)
        ? template.schedule.reminderDays.filter((value) => value !== day)
        : [...template.schedule.reminderDays, day].sort((a, b) => a - b);

      return {
        ...template,
        schedule: {
          ...template.schedule,
          reminderDays: nextReminder,
        },
      };
    });
  };

  const renderQuestionList = () => {
    if (!selectedTemplate) {
      return <Alert severity="info">Select a template to begin building questions.</Alert>;
    }

    return (
      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <List disablePadding>
          {selectedTemplate.questions.map((question, index) => (
            <ListItemButton
              key={question.id}
              selected={question.id === selectedQuestionId}
              onClick={() => setSelectedQuestionId(question.id)}
              divider
              alignItems="flex-start"
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2">{question.title}</Typography>
                    <Chip variant="outlined" size="small" label={questionTypeLabels[question.type]} />
                  </Stack>
                }
                secondary={`Question ${index + 1}`}
              />
              <ListItemSecondaryAction>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" onClick={() => handleReorderQuestion(question.id, 'up')}>
                    <ArrowUpIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleReorderQuestion(question.id, 'down')}>
                    <ArrowDownIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDuplicateQuestion(question.id)}>
                    <DuplicateIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteQuestion(question.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </ListItemSecondaryAction>
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {(Object.keys(questionTypeLabels) as PromQuestionType[]).map((type) => (
              <Button
                key={type}
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleInsertBlankQuestion(type)}
              >
                {questionTypeLabels[type]}
              </Button>
            ))}
          </Stack>
        </Box>
      </Paper>
    );
  };

  const renderQuestionEditor = () => {
    if (!selectedQuestion) {
      return (
        <Alert severity="info">Select a question to edit its content and configuration.</Alert>
      );
    }

    const handleOptionsChange = (value: string) => {
      const items = value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
      handleQuestionChange('options', items.length ? items : undefined);
    };

    return (
      <Stack spacing={2}>
        <TextField
          label="Question title"
          value={selectedQuestion.title}
          onChange={(event) => handleQuestionChange('title', event.target.value)}
          fullWidth
        />
        <TextField
          label="Helper text"
          value={selectedQuestion.description ?? ''}
          onChange={(event) => handleQuestionChange('description', event.target.value)}
          multiline
          minRows={2}
          fullWidth
        />
        <FormControlLabel
          control={
            <Switch
              checked={selectedQuestion.required}
              onChange={(event) => handleQuestionChange('required', event.target.checked)}
            />
          }
          label="Required to submit"
        />

        {(selectedQuestion.type === 'radio' || selectedQuestion.type === 'checkbox') && (
          <TextField
            label="Options"
            helperText="Enter one option per line"
            multiline
            minRows={3}
            value={(selectedQuestion.options ?? []).join('\n')}
            onChange={(event) => handleOptionsChange(event.target.value)}
          />
        )}

        {(selectedQuestion.type === 'scale' || selectedQuestion.type === 'slider') && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Minimum"
              type="number"
              value={selectedQuestion.min ?? 0}
              onChange={(event) => handleQuestionChange('min', Number(event.target.value))}
            />
            <TextField
              label="Maximum"
              type="number"
              value={selectedQuestion.max ?? 10}
              onChange={(event) => handleQuestionChange('max', Number(event.target.value))}
            />
            <TextField
              label="Step"
              type="number"
              value={selectedQuestion.step ?? 1}
              onChange={(event) => handleQuestionChange('step', Number(event.target.value))}
            />
          </Stack>
        )}

        {selectedQuestion.type === 'scale' && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Low label"
              value={selectedQuestion.scaleLabels?.min ?? ''}
              onChange={(event) =>
                handleQuestionChange('scaleLabels', {
                  min: event.target.value,
                  max: selectedQuestion.scaleLabels?.max ?? '',
                })
              }
            />
            <TextField
              label="High label"
              value={selectedQuestion.scaleLabels?.max ?? ''}
              onChange={(event) =>
                handleQuestionChange('scaleLabels', {
                  min: selectedQuestion.scaleLabels?.min ?? '',
                  max: event.target.value,
                })
              }
            />
          </Stack>
        )}

        <TextField
          label="Provider guidance"
          value={selectedQuestion.guidance ?? ''}
          onChange={(event) => handleQuestionChange('guidance', event.target.value)}
          multiline
          minRows={2}
        />
      </Stack>
    );
  };

  const renderScheduleTab = () => {
    if (!selectedTemplate) {
      return <Alert severity="info">Select a template to configure scheduling.</Alert>;
    }

    const handleFrequencyChange = (event: SelectChangeEvent<PromSchedule['frequency']>) => {
      const value = event.target.value as PromSchedule['frequency'];
      updateTemplate((template) => ({
        ...template,
        schedule: {
          ...template.schedule,
          frequency: value,
        },
      }));
    };

    const handleTriggerToggle = (trigger: PromSchedule['triggers'][number]) => {
      updateTemplate((template) => {
        const triggers = template.schedule.triggers.includes(trigger)
          ? template.schedule.triggers.filter((value) => value !== trigger)
          : [...template.schedule.triggers, trigger];
        return {
          ...template,
          schedule: {
            ...template.schedule,
            triggers,
          },
        };
      });
    };

    return (
      <Stack spacing={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Delivery cadence
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth sx={{ maxWidth: 220 }}>
                <InputLabel id="frequency-label">Frequency</InputLabel>
                <Select
                  labelId="frequency-label"
                  label="Frequency"
                  value={selectedTemplate.schedule.frequency}
                  onChange={handleFrequencyChange}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="adhoc">Ad-hoc</MenuItem>
                </Select>
              </FormControl>
              <FormGroup row>
                {['manual', 'post-appointment', 'recurring'].map((trigger) => (
                  <FormControlLabel
                    key={trigger}
                    control={
                      <Checkbox
                        checked={selectedTemplate.schedule.triggers.includes(
                          trigger as PromSchedule['triggers'][number],
                        )}
                        onChange={() =>
                          handleTriggerToggle(trigger as PromSchedule['triggers'][number])
                        }
                      />
                    }
                    label={trigger.replace('-', ' ')}
                  />
                ))}
              </FormGroup>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Reminder cadence
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Choose which days patients receive reminders if they have not yet completed the PROM.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {[1, 2, 3, 5, 7, 10, 14].map((day) => (
                <Button
                  key={day}
                  variant={selectedTemplate.schedule.reminderDays.includes(day) ? 'contained' : 'outlined'}
                  onClick={() => handleReminderToggle(day)}
                  size="small"
                >
                  Day {day}
                </Button>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    );
  };

  const renderScoringTab = () => {
    if (!selectedTemplate) {
      return <Alert severity="info">Select a template to configure scoring.</Alert>;
    }

    const handleScoringMethodChange = (event: SelectChangeEvent<'sum' | 'average' | 'weighted'>) => {
      const method = event.target.value as 'sum' | 'average' | 'weighted';
      updateTemplate((template) => ({
        ...template,
        scoring: {
          ...template.scoring,
          method,
        },
      }));
    };

    const handleRangeChange = (index: number, field: keyof PromScoringRange, value: string) => {
      updateTemplate((template) => {
        const ranges = template.scoring.ranges.map((range, i) =>
          i === index
            ? {
                ...range,
                [field]:
                  field === 'label'
                    ? value
                    : field === 'color'
                    ? value
                    : Number(value),
              }
            : range,
        );
        return {
          ...template,
          scoring: {
            ...template.scoring,
            ranges,
          },
        };
      });
    };

    return (
      <Stack spacing={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Scoring method
            </Typography>
            <FormControl sx={{ maxWidth: 240 }}>
              <InputLabel id="scoring-method-label">Method</InputLabel>
              <Select
                labelId="scoring-method-label"
                label="Method"
                value={selectedTemplate.scoring.method}
                onChange={handleScoringMethodChange}
              >
                <MenuItem value="sum">Sum</MenuItem>
                <MenuItem value="average">Average</MenuItem>
                <MenuItem value="weighted">Weighted</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Interpretation ranges
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Define score bands to help clinicians interpret responses at a glance.
            </Typography>
            <Stack spacing={2}>
              {selectedTemplate.scoring.ranges.map((range, index) => (
                <Paper key={range.label} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Label"
                      value={range.label}
                      onChange={(event) => handleRangeChange(index, 'label', event.target.value)}
                    />
                    <TextField
                      label="Min"
                      type="number"
                      value={range.min}
                      onChange={(event) => handleRangeChange(index, 'min', event.target.value)}
                    />
                    <TextField
                      label="Max"
                      type="number"
                      value={range.max}
                      onChange={(event) => handleRangeChange(index, 'max', event.target.value)}
                    />
                    <TextField
                      label="Hex color"
                      value={range.color}
                      onChange={(event) => handleRangeChange(index, 'color', event.target.value)}
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    );
  };

  const renderPreviewTab = () => {
    if (!selectedTemplate) {
      return <Alert severity="info">Choose a template to preview.</Alert>;
    }

    return (
      <Stack spacing={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Patient experience preview
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This preview mirrors how the questionnaire is rendered in the patient portal. Controls are
              interactive for styling review only.
            </Typography>
            <Stack spacing={3}>
              {selectedTemplate.questions.map((question) => (
                <Paper key={question.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {question.title}
                    {question.required && <Typography component="span" color="error"> *</Typography>}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {question.description || 'Sample helper copy to guide patients.'}
                  </Typography>
                  {question.type === 'radio' && (
                    <FormGroup>
                      {(question.options ?? []).map((option) => (
                        <FormControlLabel key={option} control={<Radio disabled />} label={option} />
                      ))}
                    </FormGroup>
                  )}
                  {question.type === 'checkbox' && (
                    <FormGroup>
                      {(question.options ?? []).map((option) => (
                        <FormControlLabel key={option} control={<Checkbox disabled />} label={option} />
                      ))}
                    </FormGroup>
                  )}
                  {question.type === 'text' && (
                    <TextField placeholder="Patient response" fullWidth multiline minRows={3} />
                  )}
                  {(question.type === 'scale' || question.type === 'slider') && (
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        {question.scaleLabels?.min ?? question.min ?? 0}
                      </Typography>
                      <Box sx={{ flexGrow: 1, height: 4, bgcolor: 'divider', borderRadius: 9999 }} />
                      <Typography variant="body2" color="text.secondary">
                        {question.scaleLabels?.max ?? question.max ?? 10}
                      </Typography>
                    </Stack>
                  )}
                  {question.type === 'number' && (
                    <TextField type="number" placeholder="0" sx={{ maxWidth: 160 }} />
                  )}
                  {question.type === 'boolean' && (
                    <FormGroup row>
                      <FormControlLabel control={<Radio disabled />} label="Yes" />
                      <FormControlLabel control={<Radio disabled />} label="No" />
                    </FormGroup>
                  )}
                  {question.guidance && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      {question.guidance}
                    </Alert>
                  )}
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    );
  };

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" gutterBottom>
          PROM Template Builder
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure question libraries, delivery cadence, and scoring to match clinic protocols.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Template library
            </Typography>
            <List>
              {templates.map((template) => (
                <ListItemButton
                  key={template.id}
                  selected={template.id === selectedTemplateId}
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setSelectedQuestionId(template.questions[0]?.id ?? null);
                  }}
                  sx={{ borderRadius: 1, mb: 1 }}
                >
                  <ListItemText
                    primary={template.name}
                    secondary={template.category}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <Chip
                    size="small"
                    label={template.isPublished ? 'Published' : 'Draft'}
                    color={template.isPublished ? 'success' : 'default'}
                  />
                </ListItemButton>
              ))}
            </List>
            <Button fullWidth variant="outlined" startIcon={<AddIcon />} sx={{ mt: 1 }}>
              New template
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <Card variant="outlined">
            <CardContent>
              <Tabs value={activeSection} onChange={(_event, value) => setActiveSection(value)}>
                <Tab label="Questions" icon={<QuestionIcon />} iconPosition="start" />
                <Tab label="Schedule" icon={<TimelineIcon />} iconPosition="start" />
                <Tab label="Scoring" icon={<TuneIcon />} iconPosition="start" />
                <Tab label="Preview" icon={<PreviewIcon />} iconPosition="start" />
              </Tabs>
              <Divider sx={{ my: 2 }} />

              {activeSection === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={5}>
                    {renderQuestionList()}
                  </Grid>
                  <Grid item xs={12} md={7}>
                    {renderQuestionEditor()}
                  </Grid>
                </Grid>
              )}

              {activeSection === 1 && renderScheduleTab()}
              {activeSection === 2 && renderScoringTab()}
              {activeSection === 3 && renderPreviewTab()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {activeSection === 0 && (
        <Card variant="outlined">
          <CardContent>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
              <Box sx={{ flexBasis: '40%' }}>
                <Typography variant="h6" gutterBottom>
                  Question library
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pull from curated question banks to standardize assessments and reduce manual authoring.
                </Typography>
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Stack spacing={2}>
                  {questionLibrary.map((category) => (
                    <Paper key={category.name} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                        <LibraryIcon color="primary" />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1">{category.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {category.description}
                          </Typography>
                        </Box>
                        <Stack spacing={1}>
                          {category.questions.map((question) => (
                            <Button
                              key={question.title}
                              variant="outlined"
                              size="small"
                              onClick={() => handleAddQuestion(question)}
                            >
                              Add “{question.title}”
                            </Button>
                          ))}
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
};

export default PROMBuilder;
