import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Box,
} from '@mui/material';
import { QivrButton } from '../QivrButton';
import { DialogSection } from '../layout/DialogSection';
import { auraTokens } from '../../theme/auraTokens';
import { glassCard } from '../../styles/glassmorphism';

export interface StepperDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  steps: string[];
  activeStep: number;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
  children: React.ReactNode;
  isStepValid?: boolean;
  loading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  completeLabel?: string;
  nextLabel?: string;
  backLabel?: string;
  cancelLabel?: string;
}

/**
 * A dialog with built-in stepper for multi-step workflows
 * Styled with Aura design tokens
 */
export const StepperDialog: React.FC<StepperDialogProps> = ({
  open,
  onClose,
  title,
  steps,
  activeStep,
  onNext,
  onBack,
  onComplete,
  children,
  isStepValid = true,
  loading = false,
  maxWidth = 'md',
  completeLabel = 'Complete',
  nextLabel = 'Next',
  backLabel = 'Back',
  cancelLabel = 'Cancel',
}) => {
  const isLastStep = activeStep === steps.length - 1;
  const isFirstStep = activeStep === 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={maxWidth} 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: auraTokens.borderRadius.lg,
          ...glassCard,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogSection>
          <Stepper 
            activeStep={activeStep} 
            sx={{ 
              mb: 3,
              '& .MuiStepLabel-root .Mui-completed': {
                color: 'success.main',
              },
              '& .MuiStepLabel-root .Mui-active': {
                color: 'primary.main',
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box>{children}</Box>
        </DialogSection>
      </DialogContent>
      <DialogActions sx={{ p: auraTokens.spacing.lg, pt: auraTokens.spacing.md }}>
        <QivrButton
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          emphasize="subtle"
        >
          {cancelLabel}
        </QivrButton>
        {!isFirstStep && (
          <QivrButton
            onClick={onBack}
            disabled={loading}
            variant="outlined"
          >
            {backLabel}
          </QivrButton>
        )}
        <QivrButton
          onClick={isLastStep ? onComplete : onNext}
          disabled={!isStepValid || loading}
          loading={loading}
          variant="contained"
        >
          {isLastStep ? completeLabel : nextLabel}
        </QivrButton>
      </DialogActions>
    </Dialog>
  );
};
