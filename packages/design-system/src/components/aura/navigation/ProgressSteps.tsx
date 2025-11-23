import { Box, Step, StepLabel, Stepper, Typography } from '@mui/material';

export interface ProgressStep {
  label: string;
  description?: string;
}

export interface ProgressStepsProps {
  steps: ProgressStep[];
  activeStep: number;
  completedSteps?: number[];
}

export const ProgressSteps = ({
  steps,
  activeStep,
  completedSteps = [],
}: ProgressStepsProps) => {
  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          return (
            <Step key={step.label} completed={isCompleted}>
              <StepLabel
                optional={
                  step.description ? (
                    <Typography variant="caption">{step.description}</Typography>
                  ) : null
                }
              >
                {step.label}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};
