import { MouseEvent, useMemo } from 'react';
import CustomTablePaginationAction, {
  CustomTablePaginationActionProps,
} from './CustomTablePaginationAction';

export interface StandardTablePaginationActionProps extends CustomTablePaginationActionProps {
  showAllHref?: string;
}

/**
 * Standard pagination action component for regular MUI Tables (not DataGrid).
 * Uses onPageChange callback instead of DataGrid API.
 */
const StandardTablePaginationAction = ({
  showAllHref,
  page,
  rowsPerPage,
  count,
  onPageChange,
  onRowsPerPageChange,
  ...rest
}: StandardTablePaginationActionProps) => {
  const defaultPageSize = rowsPerPage;
  const isShowingAll = useMemo(() => rowsPerPage === count, [rowsPerPage, count]);

  const handleNextClick = () => {
    onPageChange(null as unknown as MouseEvent<HTMLButtonElement>, page + 1);
  };

  const handlePrevClick = () => {
    onPageChange(null as unknown as MouseEvent<HTMLButtonElement>, page - 1);
  };

  const handleShowAllClick = () => {
    if (showAllHref) return;
    if (onRowsPerPageChange) {
      const newPageSize = isShowingAll ? defaultPageSize : count;
      const event = { target: { value: String(newPageSize) } } as React.ChangeEvent<HTMLInputElement>;
      onRowsPerPageChange(event);
    }
  };

  return (
    <CustomTablePaginationAction
      page={page}
      rowsPerPage={rowsPerPage}
      count={count}
      onPageChange={onPageChange}
      onNextClick={handleNextClick}
      onPrevClick={handlePrevClick}
      onShowAllClick={handleShowAllClick}
      showAllHref={showAllHref}
      {...rest}
    />
  );
};

export default StandardTablePaginationAction;
