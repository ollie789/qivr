import Stack from '@mui/material/Stack';
import FileInfoHeader from './sections/FileInfoHeader';
import FileInfoMain from './sections/FileInfoMain';

const FileInfo = ({ toggleDrawer }: { toggleDrawer: () => void }) => {
  return (
    <Stack direction="column" height={1}>
      <FileInfoHeader toggleDrawer={toggleDrawer} />
      <FileInfoMain />
    </Stack>
  );
};

export default FileInfo;
