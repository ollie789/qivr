import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import * as tokens from '../tokens';

const meta: Meta = {
  title: 'Design System/Theme/Design Tokens',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Colors: Story = {
  render: () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>Color Palette</Typography>
      </Grid>
      {[
        { name: 'Primary', main: tokens.ColorPrimaryMain, light: tokens.ColorPrimaryLight, dark: tokens.ColorPrimaryDark },
        { name: 'Secondary', main: tokens.ColorSecondaryMain, light: tokens.ColorSecondaryLight, dark: tokens.ColorSecondaryDark },
        { name: 'Success', main: tokens.ColorSuccessMain },
        { name: 'Error', main: tokens.ColorErrorMain },
        { name: 'Warning', main: tokens.ColorWarningMain },
        { name: 'Info', main: tokens.ColorInfoMain },
      ].map((color) => (
        <Grid item xs={12} sm={6} md={4} key={color.name}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>{color.name}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {color.light && (
                <Box sx={{ flex: 1, height: 60, bgcolor: color.light, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'white', textShadow: '0 0 2px black' }}>Light</Typography>
                </Box>
              )}
              <Box sx={{ flex: 1, height: 60, bgcolor: color.main, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" sx={{ color: 'white', textShadow: '0 0 2px black' }}>Main</Typography>
              </Box>
              {color.dark && (
                <Box sx={{ flex: 1, height: 60, bgcolor: color.dark, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'white', textShadow: '0 0 2px black' }}>Dark</Typography>
                </Box>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {color.main}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  ),
};

export const Spacing: Story = {
  render: () => (
    <Box>
      <Typography variant="h5" gutterBottom>Spacing Scale</Typography>
      {[
        { name: 'XS', value: tokens.SpacingXs },
        { name: 'SM', value: tokens.SpacingSm },
        { name: 'MD', value: tokens.SpacingMd },
        { name: 'LG', value: tokens.SpacingLg },
        { name: 'XL', value: tokens.SpacingXl },
        { name: 'XXL', value: tokens.SpacingXxl },
      ].map((spacing) => (
        <Box key={spacing.name} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip label={spacing.name} size="small" sx={{ width: 60 }} />
            <Box sx={{ width: spacing.value, height: 32, bgcolor: 'primary.main', borderRadius: 1 }} />
            <Typography variant="body2" color="text.secondary">{spacing.value}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

export const Typography: Story = {
  render: () => (
    <Box>
      <Typography variant="h5" gutterBottom>Typography Scale</Typography>
      {[
        { name: 'XXL', size: tokens.TypographyFontSizeXxl },
        { name: 'XL', size: tokens.TypographyFontSizeXl },
        { name: 'LG', size: tokens.TypographyFontSizeLg },
        { name: 'MD', size: tokens.TypographyFontSizeMd },
        { name: 'SM', size: tokens.TypographyFontSizeSm },
        { name: 'XS', size: tokens.TypographyFontSizeXs },
      ].map((typo) => (
        <Box key={typo.name} sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: typo.size }}>
            {typo.name} - {typo.size} - The quick brown fox jumps over the lazy dog
          </Typography>
        </Box>
      ))}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>Font Weights</Typography>
        <Typography sx={{ fontWeight: tokens.TypographyFontWeightRegular }}>
          Regular ({tokens.TypographyFontWeightRegular})
        </Typography>
        <Typography sx={{ fontWeight: tokens.TypographyFontWeightMedium }}>
          Medium ({tokens.TypographyFontWeightMedium})
        </Typography>
        <Typography sx={{ fontWeight: tokens.TypographyFontWeightBold }}>
          Bold ({tokens.TypographyFontWeightBold})
        </Typography>
      </Box>
    </Box>
  ),
};

export const AllTokens: Story = {
  render: () => (
    <Box>
      <Typography variant="h5" gutterBottom>All Design Tokens</Typography>
      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(tokens, null, 2)}
        </pre>
      </Paper>
    </Box>
  ),
};
