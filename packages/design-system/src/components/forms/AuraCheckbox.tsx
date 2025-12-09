import {
  Checkbox,
  CheckboxProps,
  FormControlLabel,
  FormControlLabelProps,
  FormGroup,
  FormGroupProps,
  styled,
} from '@mui/material';
import { auraColors } from '../../theme/auraColors';

/**
 * AuraCheckbox - Styled checkbox matching Aura design system
 *
 * Features:
 * - Custom colors from Aura palette
 * - Smooth transitions and hover effects
 * - Size variants (small, medium, large)
 * - Focus ring for accessibility
 * - Indeterminate state support
 */

const StyledCheckbox = styled(Checkbox)<
  CheckboxProps & { auraSize?: 'small' | 'medium' | 'large' }
>(({ theme, auraSize = 'medium' }) => {
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
    borderRadius: 6,

    '&:hover': {
      backgroundColor: auraColors.blue[50],
      color: auraColors.blue[400],
    },

    '&.Mui-checked': {
      color: auraColors.blue[500],

      '&:hover': {
        backgroundColor: auraColors.blue[50],
        color: auraColors.blue[600],
      },
    },

    '&.MuiCheckbox-indeterminate': {
      color: auraColors.blue[400],
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
});

export interface AuraCheckboxProps extends Omit<CheckboxProps, 'size'> {
  /** Size variant */
  auraSize?: 'small' | 'medium' | 'large';
}

export const AuraCheckbox = ({ auraSize = 'medium', ...props }: AuraCheckboxProps) => (
  <StyledCheckbox auraSize={auraSize} {...props} />
);

/**
 * AuraCheckboxGroup - Styled checkbox group with consistent spacing
 */
const StyledFormGroup = styled(FormGroup)<FormGroupProps>(({ theme }) => ({
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

  // Highlight label when checkbox is checked
  '& .MuiFormControlLabel-root:has(.Mui-checked) .MuiFormControlLabel-label': {
    color: auraColors.grey[900],
    fontWeight: 500,
  },
}));

export interface AuraCheckboxGroupProps extends FormGroupProps {
  children: React.ReactNode;
}

export const AuraCheckboxGroup = ({ children, ...props }: AuraCheckboxGroupProps) => (
  <StyledFormGroup {...props}>{children}</StyledFormGroup>
);

/**
 * AuraCheckboxOption - Convenience component combining FormControlLabel with AuraCheckbox
 *
 * @example
 * <AuraCheckboxGroup>
 *   <AuraCheckboxOption
 *     checked={selected.includes('option1')}
 *     onChange={(e) => handleToggle('option1', e.target.checked)}
 *     label="Option 1"
 *   />
 *   <AuraCheckboxOption
 *     checked={selected.includes('option2')}
 *     onChange={(e) => handleToggle('option2', e.target.checked)}
 *     label="Option 2"
 *   />
 * </AuraCheckboxGroup>
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

export interface AuraCheckboxOptionProps extends Omit<FormControlLabelProps, 'control'> {
  /** Label text */
  label: React.ReactNode;
  /** Whether the checkbox is checked */
  checked?: boolean;
  /** Change handler */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  /** Checkbox size variant */
  checkboxSize?: 'small' | 'medium' | 'large';
  /** Whether the option is disabled */
  disabled?: boolean;
  /** Indeterminate state */
  indeterminate?: boolean;
}

export const AuraCheckboxOption = ({
  label,
  checked,
  onChange,
  checkboxSize = 'medium',
  disabled,
  indeterminate,
  ...props
}: AuraCheckboxOptionProps) => (
  <StyledFormControlLabel
    control={
      <AuraCheckbox
        auraSize={checkboxSize}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        indeterminate={indeterminate}
      />
    }
    label={label}
    disabled={disabled}
    {...props}
  />
);

export default AuraCheckbox;
