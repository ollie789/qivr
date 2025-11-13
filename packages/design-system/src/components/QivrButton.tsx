import Button, { type ButtonProps } from '@mui/material/Button';

export type QivrButtonProps = ButtonProps & {
  emphasize?: 'primary' | 'secondary' | 'subtle';
};

export const QivrButton = ({
  emphasize = 'primary',
  variant,
  color,
  disableElevation = true,
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
    />
  );
};
