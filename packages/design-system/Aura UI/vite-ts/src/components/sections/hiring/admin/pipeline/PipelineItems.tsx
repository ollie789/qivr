import Stack from '@mui/material/Stack';
import { PipelineItem } from 'types/hiring';
import SortablePipelineItem from './SortablePipelineItem';

interface PipelineItemsProps {
  pipelines: PipelineItem[];
}

const PipelineItems = ({ pipelines }: PipelineItemsProps) => {
  return (
    <Stack direction="column" sx={{ gap: 2, pb: 3 }}>
      {pipelines.map((item) => (
        <SortablePipelineItem key={item.id} pipeline={item} />
      ))}
    </Stack>
  );
};

export default PipelineItems;
