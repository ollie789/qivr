'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import PageHeader from 'components/sections/pages/landing/common/PageHeader';
import SectionHeader from 'components/sections/pages/landing/common/SectionHeader';
import ContactContainer from 'components/sections/pages/landing/contact/ContactContainer';

const Contact = () => {
  return (
    <Box sx={{ overflow: 'hidden' }}>
      <Toolbar sx={{ height: 56, width: 1 }} />

      <PageHeader>
        <SectionHeader title="Contact" subtitle="Where to find us?" />
      </PageHeader>

      <Container
        maxWidth={false}
        sx={{
          maxWidth: 1000,
          p: { xs: 3, md: 5 },
        }}
      >
        <ContactContainer />
      </Container>
    </Box>
  );
};

export default Contact;
