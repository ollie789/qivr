import { Stepper, Step, StepLabel, StepperProps } from '@mui/material';

export interface StepItem {
  label: string;
  description?: string;
  optional?: boolean;
}

export interface StepsProps extends Omit<StepperProps, 'children'> {
  steps: StepItem[];
  activeStep: number;
  onStepClick?: (step: number) => void;
}

export const Steps = ({ steps, activeStep, onStepClick, ...props }: StepsProps) => (
  <Stepper activeStep={activeStep} {...props}>
    {steps.map((step, index) => (
      <Step
        key={step.label}
        completed={index < activeStep}
        sx={{ cursor: onStepClick ? 'pointer' : 'default' }}
        onClick={() => onStepClick?.(index)}
      >
        <StepLabel optional={step.optional ? 'Optional' : undefined}>
          {step.label}
        </StepLabel>
      </Step>
    ))}
  </Stepper>
);
