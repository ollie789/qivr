import { ChangeEvent, MouseEvent, useState } from 'react';
import TablePagination from '@mui/material/TablePagination';
import CustomTablePaginationAction from 'components/pagination/CustomTablePaginationAction';

const JobPagination = ({ jobs }: { jobs: number }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(3);

  const handleChangePage = (event: MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <TablePagination
      component="div"
      count={jobs}
      page={page}
      showFirstButton
      showLastButton
      onPageChange={handleChangePage}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      ActionsComponent={(props) => (
        <CustomTablePaginationAction
          showAllHref="#!"
          onShowAllClick={() => {}}
          showFullPagination
          {...props}
        />
      )}
      sx={{ bgcolor: 'background.paper' }}
    />
  );
};

export default JobPagination;
