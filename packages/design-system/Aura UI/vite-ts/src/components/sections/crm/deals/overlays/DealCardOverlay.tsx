import Box from '@mui/material/Box';
import { Deal } from 'data/crm/deals';
import DealCard from 'components/sections/crm/deals/deal-card/DealCard';

interface DealCardOverlayProps {
  deal: Deal;
}

const DealCardOverlay = ({ deal }: DealCardOverlayProps) => {
  return (
    <Box sx={{ cursor: 'grabbing', borderRadius: 4, boxShadow: (theme) => theme.vars.shadows[5] }}>
      <DealCard deal={deal} />
    </Box>
  );
};

export default DealCardOverlay;
