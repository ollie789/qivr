import Box from '@mui/material/Box';
import { PipelineItem } from 'types/hiring';
import PipelineCard from './PipelineCard';

interface PipelineCardOverlayProps {
  pipeline: PipelineItem;
}

const PipelineCardOverlay = ({ pipeline }: PipelineCardOverlayProps) => {
  return (
    <Box sx={{ cursor: 'grabbing', borderRadius: 4, boxShadow: (theme) => theme.vars.shadows[5] }}>
      <PipelineCard pipeline={pipeline} />
    </Box>
  );
};

export default PipelineCardOverlay;
