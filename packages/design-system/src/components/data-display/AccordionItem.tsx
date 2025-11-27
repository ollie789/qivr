import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { ReactNode } from 'react';
import { auraTokens } from '../../theme/auraTokens';

export interface AccordionItemProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  disabled?: boolean;
}

export const AccordionItem = ({ title, children, defaultExpanded = false, disabled = false }: AccordionItemProps) => (
  <Accordion
    defaultExpanded={defaultExpanded}
    disabled={disabled}
    sx={{
      '&:before': { display: 'none' },
      boxShadow: 'none',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: `${auraTokens.borderRadius.md * 8}px !important`,
      '&:not(:last-child)': { mb: 1 },
    }}
  >
    <AccordionSummary expandIcon={<ExpandMore />}>
      <Typography fontWeight={500}>{title}</Typography>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);
