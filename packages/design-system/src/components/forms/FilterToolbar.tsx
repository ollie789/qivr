import type { ReactNode } from 'react';
import { Box, Paper, Grid } from '@mui/material';
import { SearchBar } from './SearchBar';
import { SelectField, type SelectOption } from './SelectField';
import { FilterChips, type Filter } from '../feedback/FilterChips';

export interface FilterConfig {
  key: string;
  label: string;
  value: string;
  options: SelectOption[];
  defaultValue?: string;
}

export interface FilterToolbarProps {
  /** Search input configuration */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** Filter select configurations */
  filters?: FilterConfig[];
  /** Handler when any filter changes */
  onFilterChange?: (key: string, value: string) => void;
  /** Action buttons to render on the right */
  actions?: ReactNode;
  /** Whether to show active filter chips */
  showFilterChips?: boolean;
  /** Handler to clear a specific filter */
  onClearFilter?: (key: string) => void;
  /** Handler to clear all filters */
  onClearAll?: () => void;
  /** Custom content to render after filters */
  children?: ReactNode;
  /** Paper elevation (0 for no elevation) */
  elevation?: number;
  /** Whether to wrap in Paper component */
  wrapped?: boolean;
}

/**
 * FilterToolbar - Reusable toolbar with search, filters, and actions
 *
 * Features:
 * - Search input with clear button
 * - Multiple filter selects
 * - Action buttons area
 * - Active filter chips with clear functionality
 * - Responsive grid layout
 */
export const FilterToolbar = ({
  search,
  filters = [],
  onFilterChange,
  actions,
  showFilterChips = true,
  onClearFilter,
  onClearAll,
  children,
  elevation = 0,
  wrapped = true,
}: FilterToolbarProps) => {
  // Build active filters for chips
  const activeFilters: Filter[] = [
    ...(search?.value ? [{ key: 'search', label: `Search: "${search.value}"` }] : []),
    ...filters
      .filter((f) => f.value && f.value !== (f.defaultValue || 'all') && f.value !== '')
      .map((f) => ({
        key: f.key,
        label: `${f.label}: ${f.options.find((o) => o.value === f.value)?.label || f.value}`,
      })),
  ];

  const handleClearFilter = (key: string) => {
    if (key === 'search' && search) {
      search.onChange('');
    } else if (onClearFilter) {
      onClearFilter(key);
    } else if (onFilterChange) {
      const filter = filters.find((f) => f.key === key);
      if (filter) {
        onFilterChange(key, filter.defaultValue || 'all');
      }
    }
  };

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      if (search) search.onChange('');
      filters.forEach((f) => {
        if (onFilterChange) {
          onFilterChange(f.key, f.defaultValue || 'all');
        }
      });
    }
  };

  // Calculate grid sizes based on content
  const hasSearch = !!search;
  const filterCount = filters.length;
  const hasActions = !!actions;

  // Responsive column sizes
  const searchSize = { xs: 12, md: filterCount > 2 ? 3 : 4 };
  const filterSize = { xs: 12, sm: 6, md: filterCount > 2 ? 2 : 3 };
  const actionsSize = { xs: 12, md: 'auto' as const };

  const content = (
    <>
      <Grid container spacing={2} alignItems="center">
        {hasSearch && (
          <Grid size={searchSize}>
            <SearchBar
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
              onClear={() => search.onChange('')}
            />
          </Grid>
        )}

        {filters.map((filter) => (
          <Grid key={filter.key} size={filterSize}>
            <SelectField
              label={filter.label}
              value={filter.value}
              options={filter.options}
              onChange={(value) => onFilterChange?.(filter.key, value)}
              size="small"
            />
          </Grid>
        ))}

        {hasActions && (
          <Grid size={actionsSize} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, ml: 'auto' }}>
            {actions}
          </Grid>
        )}
      </Grid>

      {showFilterChips && activeFilters.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <FilterChips
            filters={activeFilters}
            onRemove={handleClearFilter}
            onClearAll={activeFilters.length > 1 ? handleClearAll : undefined}
          />
        </Box>
      )}

      {children}
    </>
  );

  if (!wrapped) {
    return content;
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }} elevation={elevation}>
      {content}
    </Paper>
  );
};

export default FilterToolbar;
