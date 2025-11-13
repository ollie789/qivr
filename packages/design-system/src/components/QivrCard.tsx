import Card, { type CardProps } from '@mui/material/Card';

export interface QivrCardProps extends CardProps {
  elevated?: boolean;
}

export const QivrCard = ({
  elevated = false,
  elevation,
  variant = elevated ? 'elevation' : 'outlined',
  ...props
}: QivrCardProps) => (
  <Card
    variant={variant}
    elevation={elevation ?? (elevated ? 4 : 0)}
    {...props}
    sx={{
      transition: 'box-shadow 150ms ease, transform 150ms ease',
      ...props.sx,
    }}
  />
);
