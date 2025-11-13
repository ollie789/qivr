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
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogSection>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box>{children}</Box>
        </DialogSection>
      </DialogContent>
      <DialogActions>
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
