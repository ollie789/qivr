import type { Meta, StoryObj } from '@storybook/react';
import { Typography } from '@mui/material';
import { Section } from '@qivr/design-system';
import { Container } from './Container';

const meta: Meta<typeof Section> = {
  title: 'Layout/Section',
  component: Section,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Section>;

export const Default: Story = {
  render: () => (
    <Section>
      <Container>
        <Typography variant="h4">Section Title</Typography>
        <Typography>This is a section with default background.</Typography>
      </Container>
    </Section>
  ),
};

export const GreyBackground: Story = {
  render: () => (
    <Section background="grey">
      <Container>
        <Typography variant="h4">Grey Section</Typography>
        <Typography>This section has a grey background.</Typography>
      </Container>
    </Section>
  ),
};

export const PaperBackground: Story = {
  render: () => (
    <Section background="paper">
      <Container>
        <Typography variant="h4">Paper Section</Typography>
        <Typography>This section has a paper background.</Typography>
      </Container>
    </Section>
  ),
};

export const LargeSpacing: Story = {
  render: () => (
    <Section spacing={6} background="grey">
      <Container>
        <Typography variant="h4">Large Spacing</Typography>
        <Typography>This section has more vertical padding.</Typography>
      </Container>
    </Section>
  ),
};

export const MultipleSections: Story = {
  render: () => (
    <>
      <Section background="default">
        <Container>
          <Typography variant="h4">Section 1</Typography>
          <Typography>Default background</Typography>
        </Container>
      </Section>
      <Section background="grey">
        <Container>
          <Typography variant="h4">Section 2</Typography>
          <Typography>Grey background</Typography>
        </Container>
      </Section>
      <Section background="paper">
        <Container>
          <Typography variant="h4">Section 3</Typography>
          <Typography>Paper background</Typography>
        </Container>
      </Section>
    </>
  ),
};
