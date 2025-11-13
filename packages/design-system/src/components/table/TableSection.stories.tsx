import type { Meta, StoryObj } from '@storybook/react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from '@mui/material';
import { TableSection } from '../components';

const meta: Meta<typeof TableSection> = {
  title: 'Design System/TableSection',
  component: TableSection,
  args: {
    header: <Typography variant="h6">Sample Table</Typography>,
  },
};

export default meta;
type Story = StoryObj<typeof TableSection>;

const rows = [
  { id: 1, name: 'Jane Cooper', role: 'Physio', appointments: 18 },
  { id: 2, name: 'Devon Webb', role: 'OT', appointments: 12 },
  { id: 3, name: 'Courtney Henry', role: 'PT Assistant', appointments: 9 },
];

export const Default: Story = {
  render: (args) => (
    <TableSection {...args}>
      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Provider</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Appointments</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.role}</TableCell>
                <TableCell align="right">{row.appointments}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </TableSection>
  ),
};
