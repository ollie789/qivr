import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup,
  Divider,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Save,
  Cancel,
  DragIndicator,
  TextFields,
  RadioButtonChecked,
  CheckBox,
  LinearScale,
  CalendarToday,
  Schedule,
  Functions,
  AccountTree,
  Preview,
  Publish,
  ContentCopy,
  ExpandMore,
} from '@mui/icons-material';
import { promsApi } from '../../../services/proms';

// Types
interface PromQuestion {
  id: string;
  type: 'text' | 'radio' | 'checkbox' | 'scale' | 'date' | 'time' | 'number';
  question: string;
  description?: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  conditionalLogic?: {
    showIf: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
  };
  scoring?: {
    weight: number;
    values?: Record<string, number>;
  };
}

interface PromTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  questions: PromQuestion[];
  scoring: {
    method: 'sum' | 'average' | 'weighted' | 'custom';
    ranges?: Array<{
      min: number;
      max: number;
      label: string;
      color: string;
    }>;
  };
  schedule: {
    triggers: Array<'post-appointment' | 'manual' | 'recurring'>;
    intervals?: number[];
    reminderDays?: number[];
  };
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Question Library
const QUESTION_LIBRARY = {
  pain: [
    { question: 'Rate your pain level', type: 'scale' as const, min: 0, max: 10 },
    { question: 'Describe your pain', type: 'radio' as const, options: ['Sharp', 'Dull', 'Burning', 'Throbbing', 'Aching'] },
    { question: 'When does the pain occur?', type: 'checkbox' as const, options: ['Morning', 'Afternoon', 'Evening', 'Night', 'During activity', 'At rest'] },
  ],
  function: [
    { question: 'Can you perform daily activities?', type: 'radio' as const, options: ['Yes, easily', 'Yes, with difficulty', 'No'] },
    { question: 'Rate your mobility', type: 'scale' as const, min: 0, max: 10 },
    { question: 'Which activities are difficult?', type: 'checkbox' as const, options: ['Walking', 'Sitting', 'Standing', 'Lifting', 'Bending'] },
  ],
  satisfaction: [
    { question: 'How satisfied are you with your treatment?', type: 'scale' as const, min: 0, max: 10 },
    { question: 'Would you recommend our clinic?', type: 'radio' as const, options: ['Definitely', 'Probably', 'Not sure', 'Probably not', 'Definitely not'] },
    { question: 'Additional comments', type: 'text' as const },
  ],
};

// Sortable Question Item
const SortableQuestionItem: React.FC<{
  question: PromQuestion;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ question, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{ mb: 2, cursor: 'move' }}
      elevation={isDragging ? 4 : 1}
    >
      <CardContent>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <IconButton {...attributes} {...listeners} size="small">
              <DragIndicator />
            </IconButton>
          </Grid>
          <Grid item xs>
            <Typography variant="subtitle1">{question.question}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip label={question.type} size="small" />
              {question.required && <Chip label="Required" size="small" color="primary" />}
              {question.conditionalLogic && <Chip label="Conditional" size="small" color="secondary" />}
              {question.scoring && <Chip label={`Weight: ${question.scoring.weight}`} size="small" />}
            </Box>
          </Grid>
          <Grid item>
            <IconButton onClick={onEdit} size="small">
              <Edit />
            </IconButton>
            <IconButton onClick={onDelete} size="small" color="error">
              <Delete />
            </IconButton>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Main Component
export const PromBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [template, setTemplate] = useState<PromTemplate>({
    id: '',
    name: '',
    description: '',
    category: 'general',
    questions: [],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 30, label: 'Low', color: '#4caf50' },
        { min: 31, max: 70, label: 'Medium', color: '#ff9800' },
        { min: 71, max: 100, label: 'High', color: '#f44336' },
      ],
    },
    schedule: {
      triggers: ['post-appointment'],
      intervals: [1, 7, 30],
      reminderDays: [2],
    },
    version: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [editingQuestion, setEditingQuestion] = useState<PromQuestion | null>(null);
  const [questionDialog, setQuestionDialog] = useState(false);
  const [libraryDialog, setLibraryDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setTemplate((prev) => {
        const oldIndex = prev.questions.findIndex((q) => q.id === active.id);
        const newIndex = prev.questions.findIndex((q) => q.id === over?.id);
        return {
          ...prev,
          questions: arrayMove(prev.questions, oldIndex, newIndex),
        };
      });
    }
  };

  const addQuestion = (questionData: Partial<PromQuestion>) => {
    const newQuestion: PromQuestion = {
      id: `q_${Date.now()}`,
      type: questionData.type || 'text',
      question: questionData.question || '',
      required: false,
      ...questionData,
    };
    setTemplate((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const updateQuestion = (questionId: string, updates: Partial<PromQuestion>) => {
    setTemplate((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q
      ),
    }));
  };

  const deleteQuestion = (questionId: string) => {
    setTemplate((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }));
  };

  const handleSaveTemplate = async () => {
    try {
      // Validate template
      if (!template.name) {
        alert('Please enter a template name');
        return;
      }
      if (template.questions.length === 0) {
        alert('Please add at least one question');
        return;
      }

      const payload = {
        key: template.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        name: template.name,
        description: template.description || '',
        schemaJson: JSON.stringify({
          questions: template.questions,
          scoring: template.scoring,
          schedule: template.schedule,
          category: template.category,
        }),
        scoringMethod: template.scoring.method || 'sum',
        scoringRules: JSON.stringify(template.scoring),
        isActive: template.isActive,
        version: template.version,
      };
      
      console.log('Saving template:', payload);
      const res = await promsApi.createTemplate(payload);
      console.log('Template saved successfully:', res);
      alert(`Template "${template.name}" saved successfully!`);
      
      // Reset form after successful save
      setTemplate({
        id: '',
        name: '',
        description: '',
        category: 'general',
        questions: [],
        scoring: {
          method: 'sum',
          ranges: [
            { min: 0, max: 30, label: 'Low', color: '#4caf50' },
            { min: 31, max: 70, label: 'Medium', color: '#ff9800' },
            { min: 71, max: 100, label: 'High', color: '#f44336' },
          ],
        },
        schedule: {
          triggers: ['post-appointment'],
          intervals: [1, 7, 30],
          reminderDays: [2],
        },
        version: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Failed to save template:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save template';
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs>
            <Typography variant="h5">PROM Template Builder</Typography>
            <Typography variant="body2" color="text.secondary">
              Create and customize patient-reported outcome measures
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<Preview />}
              sx={{ mr: 1 }}
            >
              Preview
            </Button>
            <Button
              variant="contained"
              startIcon={<Publish />}
              onClick={handleSaveTemplate}
            >
              Publish Template
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
              <Tab label="Template Info" />
              <Tab label="Questions" />
              <Tab label="Scoring" />
              <Tab label="Schedule" />
            </Tabs>

            {activeTab === 0 && (
              <Box>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={template.description}
                  onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={template.category}
                    onChange={(e) => setTemplate({ ...template, category: e.target.value })}
                    label="Category"
                  >
                    <MenuItem value="general">General</MenuItem>
                    <MenuItem value="pain">Pain Assessment</MenuItem>
                    <MenuItem value="function">Functional Status</MenuItem>
                    <MenuItem value="satisfaction">Patient Satisfaction</MenuItem>
                    <MenuItem value="mental-health">Mental Health</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      checked={template.isActive}
                      onChange={(e) => setTemplate({ ...template, isActive: e.target.checked })}
                    />
                  }
                  label="Active Template"
                />
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                      setEditingQuestion({
                        id: `q_${Date.now()}`,
                        type: 'text',
                        question: '',
                        required: false,
                      });
                      setQuestionDialog(true);
                    }}
                  >
                    Add Question
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Functions />}
                    onClick={() => setLibraryDialog(true)}
                  >
                    Question Library
                  </Button>
                </Box>

                {template.questions.length === 0 ? (
                  <Alert severity="info">
                    No questions added yet. Click "Add Question" or select from the library.
                  </Alert>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={template.questions.map((q) => q.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {template.questions.map((question) => (
                        <SortableQuestionItem
                          key={question.id}
                          question={question}
                          onEdit={() => {
                            setEditingQuestion(question);
                            setQuestionDialog(true);
                          }}
                          onDelete={() => deleteQuestion(question.id)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </Box>
            )}

            {activeTab === 2 && (
              <Box>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Scoring Method</InputLabel>
                  <Select
                    value={template.scoring.method}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        scoring: { ...template.scoring, method: e.target.value as any },
                      })
                    }
                    label="Scoring Method"
                  >
                    <MenuItem value="sum">Sum of Scores</MenuItem>
                    <MenuItem value="average">Average Score</MenuItem>
                    <MenuItem value="weighted">Weighted Score</MenuItem>
                    <MenuItem value="custom">Custom Formula</MenuItem>
                  </Select>
                </FormControl>

                <Typography variant="h6" gutterBottom>
                  Score Ranges
                </Typography>
                {template.scoring.ranges?.map((range, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={3}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Min"
                            value={range.min}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Max"
                            value={range.max}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            fullWidth
                            label="Label"
                            value={range.label}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <Box
                            sx={{
                              width: '100%',
                              height: 36,
                              bgcolor: range.color,
                              borderRadius: 1,
                              cursor: 'pointer',
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outlined" startIcon={<Add />}>
                  Add Range
                </Button>
              </Box>
            )}

            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Trigger Events
                </Typography>
                <FormGroup sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={template.schedule.triggers.includes('post-appointment')}
                      />
                    }
                    label="After Appointment"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={template.schedule.triggers.includes('manual')}
                      />
                    }
                    label="Manual Assignment"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={template.schedule.triggers.includes('recurring')}
                      />
                    }
                    label="Recurring Schedule"
                  />
                </FormGroup>

                <Typography variant="h6" gutterBottom>
                  Follow-up Intervals (days)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                  {template.schedule.intervals?.map((interval, index) => (
                    <Chip
                      key={index}
                      label={`Day ${interval}`}
                      onDelete={() => {}}
                    />
                  ))}
                  <Button size="small" startIcon={<Add />}>
                    Add Interval
                  </Button>
                </Box>

                <Typography variant="h6" gutterBottom>
                  Reminder Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Send reminders after these many days of no response
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {template.schedule.reminderDays?.map((day, index) => (
                    <Chip
                      key={index}
                      label={`${day} days`}
                      onDelete={() => {}}
                    />
                  ))}
                  <Button size="small" startIcon={<Add />}>
                    Add Reminder
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Template Preview
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              {template.name || 'Untitled Template'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {template.description || 'No description'}
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Questions: {template.questions.length}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Required: {template.questions.filter(q => q.required).length}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Scoring: {template.scoring.method}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<ContentCopy />}
                size="small"
              >
                Duplicate Template
              </Button>
              <Button
                variant="outlined"
                startIcon={<Functions />}
                size="small"
              >
                Test Scoring
              </Button>
              <Button
                variant="outlined"
                startIcon={<Preview />}
                size="small"
              >
                Patient View
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Question Editor Dialog */}
      <Dialog
        open={questionDialog}
        onClose={() => setQuestionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingQuestion?.question ? 'Edit Question' : 'Add Question'}
        </DialogTitle>
        <DialogContent>
          {editingQuestion && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Question"
                value={editingQuestion.question}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, question: e.target.value })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description (optional)"
                value={editingQuestion.description || ''}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, description: e.target.value })
                }
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={editingQuestion.type}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, type: e.target.value as any })
                  }
                  label="Question Type"
                >
                  <MenuItem value="text">Text Input</MenuItem>
                  <MenuItem value="radio">Single Choice</MenuItem>
                  <MenuItem value="checkbox">Multiple Choice</MenuItem>
                  <MenuItem value="scale">Scale/Rating</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="time">Time</MenuItem>
                </Select>
              </FormControl>

              {(editingQuestion.type === 'radio' || editingQuestion.type === 'checkbox') && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Options
                  </Typography>
                  {editingQuestion.options?.map((option, index) => (
                    <TextField
                      key={index}
                      fullWidth
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(editingQuestion.options || [])];
                        newOptions[index] = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: newOptions });
                      }}
                      sx={{ mb: 1 }}
                      size="small"
                    />
                  ))}
                  <Button
                    size="small"
                    startIcon={<Add />}
                    onClick={() =>
                      setEditingQuestion({
                        ...editingQuestion,
                        options: [...(editingQuestion.options || []), ''],
                      })
                    }
                  >
                    Add Option
                  </Button>
                </Box>
              )}

              {(editingQuestion.type === 'scale' || editingQuestion.type === 'number') && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Min Value"
                      value={editingQuestion.min || 0}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          min: parseInt(e.target.value),
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Max Value"
                      value={editingQuestion.max || 10}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          max: parseInt(e.target.value),
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Step"
                      value={editingQuestion.step || 1}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          step: parseInt(e.target.value),
                        })
                      }
                    />
                  </Grid>
                </Grid>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={editingQuestion.required}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, required: e.target.checked })
                    }
                  />
                }
                label="Required Question"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (editingQuestion) {
                if (editingQuestion.id.startsWith('q_')) {
                  addQuestion(editingQuestion);
                } else {
                  updateQuestion(editingQuestion.id, editingQuestion);
                }
              }
              setQuestionDialog(false);
              setEditingQuestion(null);
            }}
          >
            Save Question
          </Button>
        </DialogActions>
      </Dialog>

      {/* Question Library Dialog */}
      <Dialog
        open={libraryDialog}
        onClose={() => setLibraryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Question Library</DialogTitle>
        <DialogContent>
          {Object.entries(QUESTION_LIBRARY).map(([category, questions]) => (
            <Accordion key={category}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>{category.charAt(0).toUpperCase() + category.slice(1)}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {questions.map((q, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => {
                        addQuestion(q);
                        setLibraryDialog(false);
                      }}
                    >
                      <ListItemText
                        primary={q.question}
                        secondary={`Type: ${q.type}`}
                      />
                      <Button size="small">Add</Button>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLibraryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
