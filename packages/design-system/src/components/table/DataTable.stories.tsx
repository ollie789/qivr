import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { DataTable, type DataTableColumn } from './DataTable';
import { QivrCard } from '../QivrCard';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import PersonIcon from '@mui/icons-material/Person';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  lastVisit: string;
  age: number;
}

const samplePatients: Patient[] = [
  { id: '1', name: 'John Smith', email: 'john@example.com', phone: '555-0101', status: 'active', lastVisit: '2024-01-15', age: 45 },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', phone: '555-0102', status: 'active', lastVisit: '2024-01-14', age: 32 },
  { id: '3', name: 'Mike Williams', email: 'mike@example.com', phone: '555-0103', status: 'pending', lastVisit: '2024-01-10', age: 58 },
  { id: '4', name: 'Emma Brown', email: 'emma@example.com', phone: '555-0104', status: 'active', lastVisit: '2024-01-12', age: 27 },
  { id: '5', name: 'Chris Davis', email: 'chris@example.com', phone: '555-0105', status: 'inactive', lastVisit: '2023-12-20', age: 41 },
  { id: '6', name: 'Lisa Miller', email: 'lisa@example.com', phone: '555-0106', status: 'active', lastVisit: '2024-01-13', age: 35 },
  { id: '7', name: 'David Wilson', email: 'david@example.com', phone: '555-0107', status: 'active', lastVisit: '2024-01-11', age: 52 },
  { id: '8', name: 'Anna Taylor', email: 'anna@example.com', phone: '555-0108', status: 'pending', lastVisit: '2024-01-09', age: 29 },
];

const patientColumns: DataTableColumn<Patient>[] = [
  {
    id: 'name',
    label: 'Patient',
    sortable: true,
    render: (patient) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar>{patient.name.split(' ').map(n => n[0]).join('')}</Avatar>
        <Box>
          <Typography variant="body1">{patient.name}</Typography>
          <Typography variant="caption" color="text.secondary">{patient.email}</Typography>
        </Box>
      </Box>
    ),
  },
  {
    id: 'phone',
    label: 'Phone',
    render: (patient) => patient.phone,
  },
  {
    id: 'age',
    label: 'Age',
    sortable: true,
    align: 'center',
    width: 80,
    render: (patient) => patient.age,
  },
  {
    id: 'lastVisit',
    label: 'Last Visit',
    sortable: true,
    render: (patient) => new Date(patient.lastVisit).toLocaleDateString(),
  },
  {
    id: 'status',
    label: 'Status',
    align: 'center',
    width: 120,
    render: (patient) => (
      <Chip
        label={patient.status}
        size="small"
        color={patient.status === 'active' ? 'success' : patient.status === 'pending' ? 'warning' : 'default'}
      />
    ),
  },
];

const meta: Meta<typeof DataTable> = {
  title: 'Design System/Table/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    columns: patientColumns,
    data: samplePatients,
  },
};

export const WithSearch: Story = {
  args: {
    columns: patientColumns,
    data: samplePatients,
    searchable: true,
    searchPlaceholder: 'Search patients...',
  },
};

export const Loading: Story = {
  args: {
    columns: patientColumns,
    data: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    columns: patientColumns,
    data: [],
    emptyState: {
      icon: <PersonIcon />,
      title: 'No patients found',
      description: 'Get started by adding your first patient.',
      actionText: 'Add Patient',
      onAction: () => alert('Add patient clicked'),
    },
  },
};

export const Clickable: Story = {
  args: {
    columns: patientColumns,
    data: samplePatients,
    onRowClick: (patient) => alert(`Clicked on ${patient.name}`),
  },
};

export const SmallPageSize: Story = {
  args: {
    columns: patientColumns,
    data: samplePatients,
    pageSize: 5,
  },
};

export const CompletePatientTable: Story = {
  render: () => (
    <QivrCard>
      <DataTable
        columns={patientColumns}
        data={samplePatients}
        searchable
        searchPlaceholder="Search by name, email, or phone..."
        onRowClick={(patient) => console.log('View patient:', patient)}
        getRowId={(patient) => patient.id}
        emptyState={{
          icon: <PersonIcon />,
          title: 'No patients found',
          description: 'Try adjusting your search criteria or add a new patient.',
          actionText: 'Add Patient',
        }}
      />
    </QivrCard>
  ),
};
