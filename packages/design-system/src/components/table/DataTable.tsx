import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Box,
  TextField,
  InputAdornment,
  type TableCellProps,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { AuraEmptyState as EmptyState } from '../feedback/EmptyState';
import { SkeletonLoader } from '../feedback/SkeletonLoader';

export interface DataTableColumn<T = any> {
  /**
   * Column identifier
   */
  id: string;
  /**
   * Column header label
   */
  label: string;
  /**
   * Cell renderer function
   */
  render: (row: T) => React.ReactNode;
  /**
   * Whether this column is sortable
   */
  sortable?: boolean;
  /**
   * Alignment of the column
   */
  align?: TableCellProps['align'];
  /**
   * Width of the column
   */
  width?: string | number;
}

export interface DataTableProps<T = any> {
  /**
   * Column definitions
   */
  columns: DataTableColumn<T>[];
  /**
   * Data rows
   */
  data: T[];
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Empty state configuration
   */
  emptyState?: {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    actionText?: string;
    onAction?: () => void;
  };
  /**
   * Enable search
   */
  searchable?: boolean;
  /**
   * Search placeholder
   */
  searchPlaceholder?: string;
  /**
   * Search filter function
   */
  onSearch?: (query: string) => void;
  /**
   * Enable pagination
   */
  paginated?: boolean;
  /**
   * Initial page size
   */
  pageSize?: number;
  /**
   * Row click handler
   */
  onRowClick?: (row: T) => void;
  /**
   * Get unique key for each row
   */
  getRowId?: (row: T, index: number) => string | number;
  /**
   * Server-side pagination: total count of all records
   */
  totalCount?: number;
  /**
   * Server-side pagination: current page (0-indexed)
   */
  page?: number;
  /**
   * Server-side pagination: page change handler
   */
  onPageChange?: (page: number) => void;
  /**
   * Server-side pagination: rows per page change handler
   */
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  /**
   * Available page size options
   */
  rowsPerPageOptions?: number[];
}

/**
 * A feature-rich data table with sorting, filtering, and pagination.
 * Supports both client-side and server-side pagination.
 */
export function DataTable<T = any>({
  columns,
  data,
  loading = false,
  emptyState,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  paginated = true,
  pageSize: initialPageSize = 10,
  onRowClick,
  getRowId = (_row, index) => index,
  // Server-side pagination props
  totalCount,
  page: controlledPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25],
}: DataTableProps<T>) {
  // Determine if using server-side pagination
  const isServerPaginated = totalCount !== undefined && onPageChange !== undefined;

  // Internal state for client-side pagination
  const [internalPage, setInternalPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialPageSize);
  const [orderBy, setOrderBy] = useState<string | null>(null);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Use controlled or internal page
  const page = isServerPaginated ? (controlledPage ?? 0) : internalPage;

  const handleSort = (columnId: string) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    onSearch?.(query);
    if (isServerPaginated) {
      onPageChange?.(0);
    } else {
      setInternalPage(0);
    }
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    if (isServerPaginated) {
      onPageChange?.(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    if (isServerPaginated) {
      onRowsPerPageChange?.(newRowsPerPage);
      onPageChange?.(0);
    } else {
      setInternalPage(0);
    }
  };

  // Sort data if orderBy is set (client-side only)
  const sortedData = React.useMemo(() => {
    if (!orderBy || isServerPaginated) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[orderBy];
      const bValue = (b as any)[orderBy];

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, orderBy, order, isServerPaginated]);

  // Paginate data (client-side only - server-side data is already paginated)
  const displayData = isServerPaginated
    ? data
    : paginated
      ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : sortedData;

  // Total count for pagination
  const paginationCount = isServerPaginated ? totalCount : sortedData.length;

  if (loading) {
    return <SkeletonLoader type="table" count={rowsPerPage} />;
  }

  if (data.length === 0 && emptyState) {
    return <EmptyState {...emptyState} />;
  }

  return (
    <Box>
      {searchable && (
        <TextField
          fullWidth
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ width: column.width }}
                >
                  {column.sortable && !isServerPaginated ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayData.map((row, index) => (
              <TableRow
                key={getRowId(row, index)}
                hover={!!onRowClick}
                onClick={() => onRowClick?.(row)}
                sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align}>
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {paginated && (data.length > 0 || isServerPaginated) && (
        <TablePagination
          component="div"
          count={paginationCount}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={rowsPerPageOptions}
        />
      )}
    </Box>
  );
}
