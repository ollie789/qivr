import { Rating, RatingProps, Stack, Typography } from '@mui/material';

export interface RatingInputProps extends RatingProps {
  label?: string;
  showValue?: boolean;
}

export const RatingInput = ({ label, showValue = false, value, ...props }: RatingInputProps) => (
  <Stack direction="row" spacing={1} alignItems="center">
    {label && <Typography variant="body2" color="text.secondary">{label}</Typography>}
    <Rating value={value} {...props} />
    {showValue && value !== null && (
      <Typography variant="body2" fontWeight={600}>{value}</Typography>
    )}
  </Stack>
);
