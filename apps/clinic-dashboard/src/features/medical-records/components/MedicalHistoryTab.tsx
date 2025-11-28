import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  LocalHospital as HospitalIcon,
  Warning as WarningIcon,
  Medication as MedicationIcon,
  Vaccines as VaccineIcon,
  FitnessCenter as FitnessIcon,
  Work as WorkIcon,
  Flag as GoalIcon,
  Healing as HealingIcon,
  MonitorHeart as SymptomIcon,
  Circle as CircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { IconButton, Menu, MenuItem, ListItemIcon as MenuListItemIcon } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { glassTokens, auraColors, AuraButton, AuraEmptyState } from '@qivr/design-system';
import type { MedicalHistory, MedicalHistoryCategory } from '../types';

interface MedicalHistoryTabProps {
  medicalHistory: MedicalHistory[];
  onAddEntry: () => void;
  onEditEntry?: (item: MedicalHistory) => void;
  onDeleteEntry?: (item: MedicalHistory) => void;
}

interface CategoryConfig {
  key: MedicalHistoryCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'injury', label: 'Injuries', icon: <HealingIcon />, color: auraColors.red.main },
  { key: 'symptom', label: 'Symptoms', icon: <SymptomIcon />, color: auraColors.orange.main },
  { key: 'treatment', label: 'Treatments', icon: <HospitalIcon />, color: auraColors.blue.main },
  { key: 'activity', label: 'Activity', icon: <FitnessIcon />, color: auraColors.green.main },
  { key: 'occupation', label: 'Occupation', icon: <WorkIcon />, color: auraColors.purple.main },
  { key: 'goal', label: 'Goals', icon: <GoalIcon />, color: auraColors.cyan.main },
  { key: 'allergy', label: 'Allergies', icon: <WarningIcon />, color: auraColors.amber.main },
  { key: 'medication', label: 'Medications', icon: <MedicationIcon />, color: auraColors.cyan.main },
  { key: 'surgery', label: 'Surgeries', icon: <HospitalIcon />, color: auraColors.red[600] },
  { key: 'immunization', label: 'Immunizations', icon: <VaccineIcon />, color: auraColors.green[600] },
];

const getSeverityColor = (severity?: MedicalHistory['severity']) => {
  switch (severity) {
    case 'critical':
      return auraColors.red[600];
    case 'severe':
      return auraColors.red.main;
    case 'moderate':
      return auraColors.orange.main;
    case 'mild':
      return auraColors.green.main;
    default:
      return auraColors.grey[500];
  }
};

const getStatusColor = (status: MedicalHistory['status']) => {
  switch (status) {
    case 'active':
      return auraColors.green.main;
    case 'ongoing':
      return auraColors.blue.main;
    case 'resolved':
      return auraColors.grey[500];
    default:
      return auraColors.grey[500];
  }
};

const CategoryCard: React.FC<{
  config: CategoryConfig;
  items: MedicalHistory[];
}> = ({ config, items }) => {
  const activeCount = items.filter((i) => i.status === 'active').length;

  return (
    <Box
      sx={{
        p: 2.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: glassTokens.shadow.subtle,
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: alpha(config.color, 0.1),
            color: config.color,
            display: 'flex',
            '& svg': { fontSize: 20 },
          }}
        >
          {config.icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {config.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {items.length} total{activeCount > 0 && ` • ${activeCount} active`}
          </Typography>
        </Box>
      </Box>

      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No entries
        </Typography>
      ) : (
        <List dense disablePadding>
          {items.slice(0, 4).map((item) => (
            <ListItem key={item.id} disableGutters sx={{ py: 0.75 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CircleIcon
                  sx={{
                    fontSize: 8,
                    color: getStatusColor(item.status),
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                      {item.title}
                    </Typography>
                    {item.severity && (
                      <Chip
                        label={item.severity}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          bgcolor: alpha(getSeverityColor(item.severity), 0.1),
                          color: getSeverityColor(item.severity),
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  item.date && (
                    <Typography variant="caption" color="text.secondary">
                      {format(parseISO(item.date), 'MMM yyyy')}
                    </Typography>
                  )
                }
              />
            </ListItem>
          ))}
          {items.length > 4 && (
            <Typography
              variant="caption"
              color="primary"
              sx={{ display: 'block', mt: 1, cursor: 'pointer' }}
            >
              +{items.length - 4} more
            </Typography>
          )}
        </List>
      )}
    </Box>
  );
};

export const MedicalHistoryTab: React.FC<MedicalHistoryTabProps> = ({
  medicalHistory,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | MedicalHistoryCategory>('all');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<MedicalHistory | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: MedicalHistory) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuItem(item);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuItem(null);
  };

  const handleEdit = () => {
    if (menuItem && onEditEntry) {
      onEditEntry(menuItem);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (menuItem && onDeleteEntry) {
      onDeleteEntry(menuItem);
    }
    handleMenuClose();
  };

  const filteredHistory =
    selectedCategory === 'all'
      ? medicalHistory
      : medicalHistory.filter((h) => h.category === selectedCategory);

  const categoryCounts = CATEGORIES.map((cat) => ({
    ...cat,
    count: medicalHistory.filter((h) => h.category === cat.key).length,
  }));

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Medical History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete health record and medical information
          </Typography>
        </Box>
        <AuraButton variant="contained" startIcon={<AddIcon />} onClick={onAddEntry}>
          Add Entry
        </AuraButton>
      </Box>

      {medicalHistory.length === 0 ? (
        <AuraEmptyState
          title="No medical history entries"
          description="Add medical history entries to track patient health information"
        />
      ) : (
        <>
          {/* Category Grid */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {CATEGORIES.slice(0, 6).map((cat) => (
              <Grid key={cat.key} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <CategoryCard
                  config={cat}
                  items={medicalHistory.filter((h) => h.category === cat.key)}
                />
              </Grid>
            ))}
          </Grid>

          {/* Filter Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={selectedCategory}
              onChange={(_, v) => setSelectedCategory(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label={`All (${medicalHistory.length})`} value="all" />
              {categoryCounts
                .filter((c) => c.count > 0)
                .map((cat) => (
                  <Tab key={cat.key} label={`${cat.label} (${cat.count})`} value={cat.key} />
                ))}
            </Tabs>
          </Box>

          {/* History List */}
          <Box
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            {filteredHistory.map((item, index) => {
              const categoryConfig = CATEGORIES.find((c) => c.key === item.category);

              return (
                <Box
                  key={item.id}
                  sx={{
                    p: 2.5,
                    borderBottom: index < filteredHistory.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: alpha(categoryConfig?.color || auraColors.grey[500], 0.1),
                        color: categoryConfig?.color || auraColors.grey[500],
                        display: 'flex',
                        alignSelf: 'flex-start',
                        '& svg': { fontSize: 20 },
                      }}
                    >
                      {categoryConfig?.icon}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {item.title}
                        </Typography>
                        <Chip
                          label={item.status}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: alpha(getStatusColor(item.status), 0.1),
                            color: getStatusColor(item.status),
                          }}
                        />
                        {item.severity && (
                          <Chip
                            label={item.severity}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: alpha(getSeverityColor(item.severity), 0.1),
                              color: getSeverityColor(item.severity),
                            }}
                          />
                        )}
                      </Box>

                      {item.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {item.description}
                        </Typography>
                      )}

                      {item.notes && (
                        <Typography variant="caption" color="text.secondary">
                          {item.notes}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Box>
                        {item.date && (
                          <Typography variant="body2" color="text.secondary">
                            {format(parseISO(item.date), 'MMM d, yyyy')}
                          </Typography>
                        )}
                        <Chip
                          label={categoryConfig?.label || item.category}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5, fontSize: '0.7rem' }}
                        />
                      </Box>
                      {(onEditEntry || onDeleteEntry) && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, item)}
                          sx={{ mt: -0.5 }}
                        >
                          <MoreIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Action Menu */}
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {onEditEntry && (
              <MenuItem onClick={handleEdit}>
                <MenuListItemIcon>
                  <EditIcon fontSize="small" />
                </MenuListItemIcon>
                Edit
              </MenuItem>
            )}
            {onDeleteEntry && (
              <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                <MenuListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </MenuListItemIcon>
                Delete
              </MenuItem>
            )}
          </Menu>
        </>
      )}
    </Box>
  );
};

export default MedicalHistoryTab;
