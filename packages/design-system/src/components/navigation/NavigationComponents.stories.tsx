import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { PageHeader } from './PageHeader';
import { QivrButton } from '../QivrButton';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import Container from '@mui/material/Container';

// Breadcrumbs Stories
const breadcrumbsMeta: Meta<typeof Breadcrumbs> = {
  title: 'Design System/Navigation/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default breadcrumbsMeta;
type BreadcrumbsStory = StoryObj<typeof breadcrumbsMeta>;

export const Simple: BreadcrumbsStory = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Patients', href: '/patients' },
      { label: 'John Smith' },
    ],
  },
};

export const WithClickHandlers: BreadcrumbsStory = {
  args: {
    items: [
      { label: 'Dashboard', onClick: () => alert('Dashboard clicked') },
      { label: 'Settings', onClick: () => alert('Settings clicked') },
      { label: 'Profile' },
    ],
  },
};

export const LongPath: BreadcrumbsStory = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Patients', href: '/patients' },
      { label: 'Medical Records', href: '/patients/records' },
      { label: 'Documents', href: '/patients/records/documents' },
      { label: 'Lab Results' },
    ],
  },
};

// PageHeader Stories
const pageHeaderMeta: Meta<typeof PageHeader> = {
  title: 'Design System/Navigation/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Container maxWidth="lg">
        <Story />
      </Container>
    ),
  ],
};

export { pageHeaderMeta as PageHeaderMeta };
type PageHeaderStory = StoryObj<typeof pageHeaderMeta>;

export const BasicHeader: PageHeaderStory = {
  args: {
    title: 'Patients',
    description: 'Manage patient records and medical history',
  },
};

export const WithActions: PageHeaderStory = {
  args: {
    title: 'Patients',
    description: 'Manage patient records and medical history',
    actions: (
      <>
        <QivrButton variant="outlined" emphasize="subtle" startIcon={<DownloadIcon />}>
          Export
        </QivrButton>
        <QivrButton variant="contained" startIcon={<AddIcon />}>
          New Patient
        </QivrButton>
      </>
    ),
  },
};

export const WithBreadcrumbs: PageHeaderStory = {
  args: {
    title: 'Patient Details',
    description: 'View and edit patient information',
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Patients', href: '/patients' },
      { label: 'John Smith' },
    ],
    actions: (
      <QivrButton variant="outlined">Edit</QivrButton>
    ),
  },
};

export const CompleteExample: PageHeaderStory = {
  args: {
    title: 'Medical Records',
    description: 'Review patient medical history and documents',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Patients', href: '/patients' },
      { label: 'Sarah Johnson', href: '/patients/123' },
      { label: 'Medical Records' },
    ],
    actions: (
      <>
        <QivrButton variant="outlined" emphasize="subtle">
          Print
        </QivrButton>
        <QivrButton variant="outlined" emphasize="subtle" startIcon={<DownloadIcon />}>
          Download PDF
        </QivrButton>
        <QivrButton variant="contained" startIcon={<AddIcon />}>
          Add Record
        </QivrButton>
      </>
    ),
  },
};

export const NoDescription: PageHeaderStory = {
  args: {
    title: 'Dashboard',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Dashboard' },
    ],
  },
};
