import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { auraTokens } from '../../theme/auraTokens';

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton = ({ loading, loadingText, children, disabled, ...props }: LoadingButtonProps) => (
  <Button
    disabled={disabled || loading}
    {...props}
    sx={{
      textTransform: 'none',
      fontWeight: auraTokens.fontWeights.semibold,
      ...props.sx,
    }}
  >
    {loading && <CircularProgress size={16} sx={{ mr: 1 }} color="inherit" />}
    {loading && loadingText ? loadingText : children}
  </Button>
);
