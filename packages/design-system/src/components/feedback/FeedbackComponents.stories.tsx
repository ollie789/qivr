import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { SkeletonLoader } from './SkeletonLoader';
import { QivrCard } from '../QivrCard';
import Box from '@mui/material/Box';
import InboxIcon from '@mui/icons-material/Inbox';
import FolderOffIcon from '@mui/icons-material/FolderOff';
import SearchOffIcon from '@mui/icons-material/SearchOff';

// LoadingSpinner Stories
const spinnerMeta: Meta<typeof LoadingSpinner> = {
  title: 'Design System/Feedback/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default spinnerMeta;
type SpinnerStory = StoryObj<typeof spinnerMeta>;

export const SmallSpinner: SpinnerStory = {
  args: {
    size: 'small',
  },
};

export const MediumSpinner: SpinnerStory = {
  args: {
    size: 'medium',
  },
};

export const LargeSpinner: SpinnerStory = {
  args: {
    size: 'large',
  },
};

export const SpinnerWithMessage: SpinnerStory = {
  args: {
    message: 'Loading appointments...',
    size: 'medium',
  },
};

export const CenteredSpinner: SpinnerStory = {
  args: {
    centered: true,
    message: 'Please wait...',
  },
  decorators: [
    (Story) => (
      <Box sx={{ width: 500, height: 300, border: '1px dashed grey' }}>
        <Story />
      </Box>
    ),
  ],
};

// EmptyState Stories
const emptyStateMeta: Meta<typeof EmptyState> = {
  title: 'Design System/Feedback/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export { emptyStateMeta as EmptyStateMeta };
type EmptyStateStory = StoryObj<typeof emptyStateMeta>;

export const NoData: EmptyStateStory = {
  args: {
    icon: <InboxIcon />,
    title: 'No data available',
    description: 'There is no data to display at this time.',
  },
};

export const NoPatients: EmptyStateStory = {
  args: {
    icon: <FolderOffIcon />,
    title: 'No patients found',
    description: 'You haven\'t added any patients yet. Get started by inviting your first patient.',
    actionText: 'Invite Patient',
    onAction: () => alert('Invite patient clicked'),
  },
};

export const NoSearchResults: EmptyStateStory = {
  args: {
    icon: <SearchOffIcon />,
    title: 'No results found',
    description: 'Try adjusting your search or filter criteria.',
    actionText: 'Clear Filters',
    secondaryActionText: 'Reset Search',
    onAction: () => alert('Clear filters clicked'),
    onSecondaryAction: () => alert('Reset search clicked'),
  },
};

export const InCard: EmptyStateStory = {
  render: () => (
    <QivrCard sx={{ width: 500 }}>
      <EmptyState
        icon={<InboxIcon />}
        title="No appointments today"
        description="Your schedule is clear for today."
        actionText="Schedule New"
      />
    </QivrCard>
  ),
};

// SkeletonLoader Stories
const skeletonMeta: Meta<typeof SkeletonLoader> = {
  title: 'Design System/Feedback/SkeletonLoader',
  component: SkeletonLoader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export { skeletonMeta as SkeletonLoaderMeta };
type SkeletonStory = StoryObj<typeof skeletonMeta>;

export const TextSkeleton: SkeletonStory = {
  args: {
    type: 'text',
    count: 3,
  },
};

export const CardSkeleton: SkeletonStory = {
  args: {
    type: 'card',
    count: 2,
  },
};

export const ListSkeleton: SkeletonStory = {
  args: {
    type: 'list',
    count: 4,
  },
};

export const TableSkeleton: SkeletonStory = {
  args: {
    type: 'table',
    count: 5,
  },
};

export const LoadingStates: SkeletonStory = {
  render: () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
      <QivrCard elevated>
        <Box sx={{ p: 2 }}>
          <SkeletonLoader type="card" count={1} />
        </Box>
      </QivrCard>
      <QivrCard elevated>
        <Box sx={{ p: 2 }}>
          <SkeletonLoader type="list" count={3} />
        </Box>
      </QivrCard>
    </Box>
  ),
};
