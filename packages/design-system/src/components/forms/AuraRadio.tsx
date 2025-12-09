import {
  Radio,
  RadioProps,
  RadioGroup,
  RadioGroupProps,
  FormControlLabel,
  FormControlLabelProps,
  styled,
} from '@mui/material';
import { auraColors } from '../../theme/auraColors';

/**
 * AuraRadio - Styled radio button matching Aura design system
 *
 * Features:
 * - Custom colors from Aura palette
 * - Smooth transitions and hover effects
 * - Size variants (small, medium, large)
 * - Focus ring for accessibility
 */

const StyledRadio = styled(Radio)<RadioProps & { auraSize?: 'small' | 'medium' | 'large' }>(
  ({ theme, auraSize = 'medium' }) => {
    const sizes = {
      small: { icon: 18, padding: 6 },
      medium: { icon: 22, padding: 8 },
      large: { icon: 26, padding: 10 },
    };
    const size = sizes[auraSize];

    return {
      padding: size.padding,
      color: auraColors.grey[400],
      transition: 'all 0.2s ease-in-out',

      '&:hover': {
        backgroundColor: `${auraColors.blue[50]}`,
        color: auraColors.blue[400],
      },

      '&.Mui-checked': {
        color: auraColors.blue[500],

        '&:hover': {
          backgroundColor: `${auraColors.blue[50]}`,
        },
      },

      '&.Mui-focusVisible': {
        outline: `2px solid ${auraColors.blue[300]}`,
        outlineOffset: 2,
      },

      '&.Mui-disabled': {
        color: auraColors.grey[300],
      },

      '& .MuiSvgIcon-root': {
        fontSize: size.icon,
      },
    };
  }
);

export interface AuraRadioProps extends Omit<RadioProps, 'size'> {
  /** Size variant */
  auraSize?: 'small' | 'medium' | 'large';
}

export const AuraRadio = ({ auraSize = 'medium', ...props }: AuraRadioProps) => (
  <StyledRadio auraSize={auraSize} {...props} />
);

/**
 * AuraRadioGroup - Styled radio group with consistent spacing
 */
const StyledRadioGroup = styled(RadioGroup)<RadioGroupProps>(({ theme }) => ({
  gap: theme.spacing(0.5),

  '& .MuiFormControlLabel-root': {
    marginLeft: 0,
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(0.5),

    '&:last-child': {
      marginBottom: 0,
    },
  },

  '& .MuiFormControlLabel-label': {
    fontSize: '0.9375rem',
    color: auraColors.grey[700],
    fontWeight: 400,
    transition: 'color 0.2s ease-in-out',
  },

  // Highlight label when radio is checked
  '& .MuiFormControlLabel-root:has(.Mui-checked) .MuiFormControlLabel-label': {
    color: auraColors.grey[900],
    fontWeight: 500,
  },
}));

export interface AuraRadioGroupProps extends RadioGroupProps {
  children: React.ReactNode;
}

export const AuraRadioGroup = ({ children, ...props }: AuraRadioGroupProps) => (
  <StyledRadioGroup {...props}>{children}</StyledRadioGroup>
);

/**
 * AuraRadioOption - Convenience component combining FormControlLabel with AuraRadio
 *
 * @example
 * <AuraRadioGroup value={value} onChange={handleChange}>
 *   <AuraRadioOption value="option1" label="Option 1" />
 *   <AuraRadioOption value="option2" label="Option 2" />
 * </AuraRadioGroup>
 */
const StyledFormControlLabel = styled(FormControlLabel)<FormControlLabelProps>(({ theme }) => ({
  marginLeft: 0,
  marginRight: theme.spacing(2),
  borderRadius: theme.spacing(1),
  padding: `${theme.spacing(0.75)} ${theme.spacing(1.5)}`,
  paddingLeft: theme.spacing(0.5),
  transition: 'all 0.2s ease-in-out',

  '&:hover': {
    backgroundColor: auraColors.grey[50],
  },

  '&:has(.Mui-checked)': {
    backgroundColor: auraColors.blue[50],
  },

  '& .MuiFormControlLabel-label': {
    fontSize: '0.9375rem',
    color: auraColors.grey[700],
    fontWeight: 400,
    transition: 'color 0.2s ease-in-out',
  },

  '&:has(.Mui-checked) .MuiFormControlLabel-label': {
    color: auraColors.blue[700],
    fontWeight: 500,
  },
}));

export interface AuraRadioOptionProps extends Omit<FormControlLabelProps, 'control'> {
  /** The value for this radio option */
  value: string | number;
  /** Label text */
  label: React.ReactNode;
  /** Radio size variant */
  radioSize?: 'small' | 'medium' | 'large';
  /** Whether the option is disabled */
  disabled?: boolean;
}

export const AuraRadioOption = ({
  value,
  label,
  radioSize = 'medium',
  disabled,
  ...props
}: AuraRadioOptionProps) => (
  <StyledFormControlLabel
    value={value}
    control={<AuraRadio auraSize={radioSize} disabled={disabled} />}
    label={label}
    disabled={disabled}
    {...props}
  />
);

export default AuraRadio;
