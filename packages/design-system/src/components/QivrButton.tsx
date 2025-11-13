import Button, { type ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

export type QivrButtonProps = ButtonProps & {
  emphasize?: 'primary' | 'secondary' | 'subtle';
  loading?: boolean;
};

export const QivrButton = ({
  emphasize = 'primary',
  variant,
  color,
  disableElevation = true,
  loading = false,
  disabled,
  children,
  startIcon,
  ...props
}: QivrButtonProps) => {
  const resolvedVariant = variant ?? (emphasize === 'subtle' ? 'text' : 'contained');
  const resolvedColor = color ?? (emphasize === 'secondary' ? 'secondary' : 'primary');

  return (
    <Button
      {...props}
      disableElevation={disableElevation}
      color={resolvedColor}
      variant={resolvedVariant}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={20} /> : startIcon}
    >
      {children}
    </Button>
  );
};
