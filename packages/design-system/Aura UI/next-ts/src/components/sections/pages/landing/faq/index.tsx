'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import FAQContact from 'components/sections/pages/landing/faq/FAQContact';
import FAQHeader from 'components/sections/pages/landing/faq/FAQHeader';
import FAQMain from 'components/sections/pages/landing/faq/main/FAQMain';

const LandingFAQ = () => {
  return (
    <Box sx={{ overflow: 'hidden' }}>
      <Toolbar sx={{ height: 56, width: 1 }} />

      <Stack direction="column" gap={3}>
        <FAQHeader />
        <FAQMain />
        <FAQContact />
      </Stack>
    </Box>
  );
};

export default LandingFAQ;
