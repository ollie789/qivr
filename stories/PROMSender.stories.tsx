import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import PROMSender from '../apps/clinic-dashboard/src/components/PROMSender';
import { promApi } from '../apps/clinic-dashboard/src/services/promApi';
import { patientApi } from '../apps/clinic-dashboard/src/services/patientApi';

// Mock query client for Storybook
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

// Mock data
const mockTemplates = [
  {
    id: 'template-1',
    key: 'phq9',
    name: 'PHQ-9 Depression Screening',
    description: 'Patient Health Questionnaire for depression screening',
    version: 1,
    category: 'Mental Health',
    frequency: 'Monthly',
    createdAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'template-2',
    key: 'gad7',
    name: 'GAD-7 Anxiety Assessment',
    description: 'Generalized Anxiety Disorder 7-item scale',
    version: 1,
    category: 'Mental Health',
    frequency: 'Quarterly',
    createdAt: new Date('2024-02-10').toISOString(),
  },
  {
    id: 'template-3',
    key: 'pain-scale',
    name: 'Pain Level Assessment',
    description: 'Comprehensive pain and discomfort evaluation',
    version: 2,
    category: 'Pain Management',
    frequency: 'Weekly',
    createdAt: new Date('2024-03-01').toISOString(),
  },
  {
    id: 'template-4',
    key: 'quality-of-life',
    name: 'Quality of Life Survey',
    description: 'SF-36 Short Form Health Survey',
    version: 1,
    category: 'General Health',
    frequency: 'Annually',
    createdAt: new Date('2024-01-20').toISOString(),
  },
];

const mockTemplateDetails = {
  'template-1': {
    id: 'template-1',
    key: 'phq9',
    name: 'PHQ-9 Depression Screening',
    description: 'Patient Health Questionnaire for depression screening',
    version: 1,
    category: 'Mental Health',
    frequency: 'Monthly',
    createdAt: new Date('2024-01-15').toISOString(),
    questions: [
      { id: 'q1', text: 'Little interest or pleasure in doing things?', type: 'scale' },
      { id: 'q2', text: 'Feeling down, depressed, or hopeless?', type: 'scale' },
      { id: 'q3', text: 'Trouble falling or staying asleep, or sleeping too much?', type: 'scale' },
      { id: 'q4', text: 'Feeling tired or having little energy?', type: 'scale' },
      { id: 'q5', text: 'Poor appetite or overeating?', type: 'scale' },
      { id: 'q6', text: 'Feeling bad about yourself?', type: 'scale' },
      { id: 'q7', text: 'Trouble concentrating on things?', type: 'scale' },
      { id: 'q8', text: 'Moving or speaking slowly?', type: 'scale' },
      { id: 'q9', text: 'Thoughts that you would be better off dead?', type: 'scale' },
    ],
  },
  'template-2': {
    id: 'template-2',
    key: 'gad7',
    name: 'GAD-7 Anxiety Assessment',
    description: 'Generalized Anxiety Disorder 7-item scale',
    version: 1,
    category: 'Mental Health',
    frequency: 'Quarterly',
    createdAt: new Date('2024-02-10').toISOString(),
    questions: [
      { id: 'q1', text: 'Feeling nervous, anxious, or on edge?', type: 'scale' },
      { id: 'q2', text: 'Not being able to stop or control worrying?', type: 'scale' },
      { id: 'q3', text: 'Worrying too much about different things?', type: 'scale' },
      { id: 'q4', text: 'Trouble relaxing?', type: 'scale' },
      { id: 'q5', text: 'Being so restless that it\'s hard to sit still?', type: 'scale' },
      { id: 'q6', text: 'Becoming easily annoyed or irritable?', type: 'scale' },
      { id: 'q7', text: 'Feeling afraid as if something awful might happen?', type: 'scale' },
    ],
  },
  'template-3': {
    id: 'template-3',
    key: 'pain-scale',
    name: 'Pain Level Assessment',
    description: 'Comprehensive pain and discomfort evaluation',
    version: 2,
    category: 'Pain Management',
    frequency: 'Weekly',
    createdAt: new Date('2024-03-01').toISOString(),
    questions: [
      { id: 'q1', text: 'Current pain level (0-10)?', type: 'numeric' },
      { id: 'q2', text: 'Where is your pain located?', type: 'multiple-choice' },
      { id: 'q3', text: 'How would you describe your pain?', type: 'text' },
      { id: 'q4', text: 'Does the pain interfere with daily activities?', type: 'boolean' },
      { id: 'q5', text: 'Pain intensity at its worst?', type: 'numeric' },
    ],
  },
  'template-4': {
    id: 'template-4',
    key: 'quality-of-life',
    name: 'Quality of Life Survey',
    description: 'SF-36 Short Form Health Survey',
    version: 1,
    category: 'General Health',
    frequency: 'Annually',
    createdAt: new Date('2024-01-20').toISOString(),
    questions: [
      { id: 'q1', text: 'In general, would you say your health is?', type: 'scale' },
      { id: 'q2', text: 'How much does your health limit moderate activities?', type: 'scale' },
      { id: 'q3', text: 'During the past 4 weeks, how much of the time has your physical health interfered with your social activities?', type: 'scale' },
    ],
  },
};

const mockPatients = [
  {
    id: 'patient-1',
    firstName: 'Emma',
    lastName: 'Johnson',
    email: 'emma.johnson@example.com',
    lastVisit: new Date('2024-03-10').toISOString(),
  },
  {
    id: 'patient-2',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@example.com',
    lastVisit: new Date('2024-03-05').toISOString(),
  },
  {
    id: 'patient-3',
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.williams@example.com',
    lastVisit: new Date('2024-02-28').toISOString(),
  },
  {
    id: 'patient-4',
    firstName: 'David',
    lastName: 'Martinez',
    email: 'david.martinez@example.com',
    lastVisit: new Date('2024-03-12').toISOString(),
  },
  {
    id: 'patient-5',
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa.anderson@example.com',
    lastVisit: new Date('2024-03-08').toISOString(),
  },
  {
    id: 'patient-6',
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'robert.taylor@example.com',
    lastVisit: new Date('2024-02-20').toISOString(),
  },
];

// Mock API responses
const mockPromApi = {
  getTemplates: async () => mockTemplates,
  getTemplate: async (id: string) => mockTemplateDetails[id as keyof typeof mockTemplateDetails],
  sendProm: async () => ({ success: true }),
};

const mockPatientApi = {
  getPatients: async () => ({ data: mockPatients, total: mockPatients.length }),
};

// Override the APIs for Storybook
Object.assign(promApi, mockPromApi);
Object.assign(patientApi, mockPatientApi);

const meta = {
  title: 'Components/PROMSender',
  component: PROMSender,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Multi-step wizard for sending Patient-Reported Outcome Measures (PROMs) to patients. Features template selection, patient selection, scheduling configuration, notification settings, and a final review step.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Story />
        </LocalizationProvider>
      </QueryClientProvider>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof PROMSender>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default state of the PROM sender wizard starting at step 1 (template selection).',
      },
    },
  },
};

export const WithPreSelectedTemplate: Story = {
  args: {
    preSelectedTemplateId: 'template-1',
  },
  parameters: {
    docs: {
      description: {
        story: 'PROM sender with a pre-selected template (PHQ-9 Depression Screening). Useful when sending PROMs from a specific template context.',
      },
    },
  },
};

export const WithPreSelectedPatient: Story = {
  args: {
    preSelectedPatientId: 'patient-1',
  },
  parameters: {
    docs: {
      description: {
        story: 'PROM sender with a pre-selected patient (Emma Johnson). Useful when sending PROMs from a patient detail page.',
      },
    },
  },
};

export const WithBothPreselected: Story = {
  args: {
    preSelectedTemplateId: 'template-2',
    preSelectedPatientId: 'patient-2',
  },
  parameters: {
    docs: {
      description: {
        story: 'PROM sender with both template and patient pre-selected. The user only needs to configure schedule and notifications.',
      },
    },
  },
};

export const WithCompletionHandler: Story = {
  args: {
    onComplete: () => {
      console.log('PROM sent successfully!');
      alert('PROM has been sent successfully!');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'PROM sender with a completion handler that fires after successful submission. Check the console and alert on completion.',
      },
    },
  },
};

export const QuickSendWorkflow: Story = {
  args: {
    preSelectedTemplateId: 'template-3',
    preSelectedPatientId: 'patient-4',
    onComplete: () => {
      console.log('Quick send completed!');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Quick send workflow where template and patient are pre-selected, allowing providers to quickly configure and send PROMs with minimal clicks.',
      },
    },
  },
};

export const MultipleTemplatesView: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'View showing all available PROM templates with different categories (Mental Health, Pain Management, General Health) and frequencies.',
      },
    },
  },
};

export const EmptyState: Story = {
  decorators: [
    (Story) => {
      // Mock empty responses
      const emptyPromApi = {
        getTemplates: async () => [],
        getTemplate: async () => null,
        sendProm: async () => ({ success: true }),
      };
      
      const emptyPatientApi = {
        getPatients: async () => ({ data: [], total: 0 }),
      };
      
      Object.assign(promApi, emptyPromApi);
      Object.assign(patientApi, emptyPatientApi);
      
      return (
        <QueryClientProvider client={queryClient}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Story />
          </LocalizationProvider>
        </QueryClientProvider>
      );
    },
  ],
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no templates or patients are available in the system.',
      },
    },
  },
};

export const InteractiveWizard: Story = {
  args: {
    onComplete: () => {
      console.log('✅ PROM successfully sent!');
      alert('🎉 PROM has been sent to selected patients!');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive wizard for testing the complete flow:\n\n1. **Select Template**: Choose from PHQ-9, GAD-7, Pain Scale, or Quality of Life surveys\n2. **Choose Recipients**: Select one or more patients (search/filter available)\n3. **Configure Schedule**: Immediate, scheduled, or recurring delivery\n4. **Set Notifications**: Email, SMS, push notifications, and reminder settings\n5. **Review & Send**: Final review before sending',
      },
    },
  },
};
