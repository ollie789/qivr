import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { RichTextEditorRef } from 'mui-tiptap';
import Editor, { editorDefaultToolbar } from 'components/base/Editor';

interface EditDescriptionProps {
  handleCloseEditMode: () => void;
}

const EditDescription = ({ handleCloseEditMode }: EditDescriptionProps) => {
  const { watch } = useFormContext();
  const rteRef = useRef<RichTextEditorRef>(null);

  const description = watch('description');

  const handleSave = () => {
    const value = rteRef.current?.editor?.isEmpty ? '' : rteRef.current?.editor?.getHTML();
    if (value) {
      rteRef.current?.editor?.commands.clearContent();
    }
    handleCloseEditMode();
  };

  return (
    <Editor
      ref={rteRef}
      content={description}
      renderControls={() => (
        <Stack
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            overflow: 'hidden',
            columnGap: 2,
          }}
        >
          <Box
            sx={{
              overflowX: 'auto',
              '& > div:first-of-type': {
                flexWrap: 'nowrap',
              },
            }}
          >
            {editorDefaultToolbar()}
          </Box>
          <Button
            color="neutral"
            variant="text"
            size="small"
            sx={{ flexShrink: 0 }}
            onClick={handleSave}
            disabled={rteRef.current?.editor?.isEmpty}
          >
            Save
          </Button>
        </Stack>
      )}
      sx={{
        display: 'flex',
        flexDirection: 'column-reverse',
        px: 1.5,
        py: 0.5,
      }}
    />
  );
};

export default EditDescription;
