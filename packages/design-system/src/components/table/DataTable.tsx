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
import { EmptyState } from '../feedback/EmptyState';
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
}

/**
 * A feature-rich data table with sorting, filtering, and pagination
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
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialPageSize);
  const [orderBy, setOrderBy] = useState<string | null>(null);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (columnId: string) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    onSearch?.(query);
    setPage(0); // Reset to first page on search
  };

  // Sort data if orderBy is set
  const sortedData = React.useMemo(() => {
    if (!orderBy) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[orderBy];
      const bValue = (b as any)[orderBy];

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, orderBy, order]);

  // Paginate data
  const paginatedData = paginated
    ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : sortedData;

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
                  {column.sortable ? (
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
            {paginatedData.map((row, index) => (
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

      {paginated && data.length > 0 && (
        <TablePagination
          component="div"
          count={sortedData.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      )}
    </Box>
  );
}
