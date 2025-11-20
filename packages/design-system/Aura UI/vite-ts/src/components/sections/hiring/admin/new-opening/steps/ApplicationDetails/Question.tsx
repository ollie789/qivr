import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Question } from 'types/hiring';
import IconifyIcon from 'components/base/IconifyIcon';

interface QuestionProps {
  question: Question;
  onMenuOpen: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const QuestionItem = ({ question, onMenuOpen }: QuestionProps) => {
  return (
    <Paper background={1} sx={{ outline: 0, px: 2, py: 1, borderRadius: 2 }}>
      <Stack alignItems="center" gap={2}>
        <Typography variant="subtitle2" fontWeight={400} sx={{ flexGrow: 1 }}>
          {question.question}
          {question.isMandatory && (
            <Typography component="span" color="error.main" ml={1}>
              *
            </Typography>
          )}
        </Typography>
        <Button onClick={onMenuOpen} shape="square" color="neutral" size="small">
          <IconifyIcon icon="material-symbols:more-horiz" sx={{ fontSize: 18 }} />
        </Button>
      </Stack>
    </Paper>
  );
};

export default QuestionItem;
