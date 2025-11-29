import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  alpha,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  MedicalServices as MedicalIcon,
  Description as DocumentIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Favorite as HeartIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { glassTokens, auraColors, AuraEmptyState, SelectField, auraTokens } from '@qivr/design-system';
import type { TimelineEvent } from '../types';

interface TimelineTabProps {
  timeline: TimelineEvent[];
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'appointment':
      return <CalendarIcon />;
    case 'prom':
      return <CheckIcon />;
    case 'treatment_plan':
      return <MedicalIcon />;
    case 'document':
      return <DocumentIcon />;
    case 'vital':
      return <HeartIcon />;
    default:
      return <InfoIcon />;
  }
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'completed':
      return auraColors.green.main;
    case 'cancelled':
      return auraColors.red.main;
    case 'scheduled':
      return auraColors.blue.main;
    case 'pending':
      return auraColors.orange.main;
    default:
      return auraColors.grey[500];
  }
};

const TimelineCard: React.FC<{ event: TimelineEvent; isLast: boolean }> = ({ event, isLast }) => {
  const statusColor = getStatusColor(event.status);

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {/* Timeline Line */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: auraTokens.avatar.md,
        }}
      >
        <Box
          sx={{
            width: auraTokens.avatar.md,
            height: auraTokens.avatar.md,
            borderRadius: '50%',
            bgcolor: alpha(statusColor, 0.1),
            color: statusColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { fontSize: auraTokens.iconSize.md },
          }}
        >
          {event.icon || getEventIcon(event.type)}
        </Box>
        {!isLast && (
          <Box
            sx={{
              width: 2,
              flex: 1,
              bgcolor: 'divider',
              my: 1,
            }}
          />
        )}
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          pb: isLast ? 0 : 3,
        }}
      >
        <Box
          sx={{
            p: 2.5,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            boxShadow: glassTokens.shadow.subtle,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {event.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(parseISO(event.date), 'MMM d, yyyy')} at{' '}
                {format(parseISO(event.date), 'h:mm a')}
              </Typography>
            </Box>
            {event.status && (
              <Chip
                label={event.status}
                size="small"
                sx={{
                  height: 22,
                  bgcolor: alpha(statusColor, 0.1),
                  color: statusColor,
                  fontWeight: 500,
                  textTransform: 'capitalize',
                }}
              />
            )}
          </Box>

          {event.description && (
            <Typography variant="body2" color="text.secondary">
              {event.description}
            </Typography>
          )}

          {event.notes && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Note: {event.notes}
            </Typography>
          )}

          <Chip
            label={event.type.replace('_', ' ')}
            size="small"
            variant="outlined"
            sx={{ mt: 1.5, fontSize: '0.75rem', textTransform: 'capitalize' }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export const TimelineTab: React.FC<TimelineTabProps> = ({ timeline }) => {
  const [filter, setFilter] = useState<string>('all');
  const [view, setView] = useState<'timeline' | 'list'>('timeline');

  const filteredTimeline = useMemo(() => {
    if (filter === 'all') return timeline;
    return timeline.filter((e) => e.type === filter);
  }, [timeline, filter]);

  const eventTypes = useMemo(() => {
    const types = new Set(timeline.map((e) => e.type));
    return Array.from(types);
  }, [timeline]);

  if (timeline.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <AuraEmptyState
          title="No timeline events"
          description="Patient activity will appear here as events occur"
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Patient Timeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete history of patient interactions and events
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <SelectField
            label="Filter"
            value={filter}
            onChange={(value) => setFilter(value)}
            options={[
              { value: 'all', label: 'All Events' },
              ...eventTypes.map((t) => ({
                value: t,
                label: t.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
              })),
            ]}
            size="small"
            sx={{ minWidth: 150 }}
          />
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, v) => v && setView(v)}
            size="small"
          >
            <ToggleButton value="timeline">Timeline</ToggleButton>
            <ToggleButton value="list">List</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {[
          { label: 'Total Events', value: timeline.length, color: auraColors.blue.main },
          {
            label: 'Appointments',
            value: timeline.filter((e) => e.type === 'appointment').length,
            color: auraColors.purple.main,
          },
          {
            label: 'Assessments',
            value: timeline.filter((e) => e.type === 'prom' || e.type === 'vital').length,
            color: auraColors.green.main,
          },
          {
            label: 'Documents',
            value: timeline.filter((e) => e.type === 'document').length,
            color: auraColors.orange.main,
          },
        ].map((stat) => (
          <Box
            key={stat.label}
            sx={{
              px: 2.5,
              py: 1.5,
              bgcolor: alpha(stat.color, 0.08),
              borderRadius: 2,
              textAlign: 'center',
              minWidth: 100,
            }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ color: stat.color }}>
              {stat.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Timeline View */}
      {view === 'timeline' ? (
        <Box>
          {filteredTimeline.map((event, index) => (
            <TimelineCard
              key={`${event.date}-${index}`}
              event={event}
              isLast={index === filteredTimeline.length - 1}
            />
          ))}
        </Box>
      ) : (
        /* List View */
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {filteredTimeline.map((event, index) => (
            <Box
              key={`${event.date}-${index}`}
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderBottom: index < filteredTimeline.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: alpha(getStatusColor(event.status), 0.1),
                  color: getStatusColor(event.status),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& svg': { fontSize: 18 },
                }}
              >
                {event.icon || getEventIcon(event.type)}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={500} noWrap>
                  {event.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {event.description}
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                {format(parseISO(event.date), 'MMM d, yyyy')}
              </Typography>

              {event.status && (
                <Chip
                  label={event.status}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.75rem',
                    bgcolor: alpha(getStatusColor(event.status), 0.1),
                    color: getStatusColor(event.status),
                    textTransform: 'capitalize',
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TimelineTab;
