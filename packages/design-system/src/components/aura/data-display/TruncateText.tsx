import { Typography, Tooltip, TypographyProps } from '@mui/material';

export interface TruncateTextProps extends TypographyProps {
  text: string;
  maxLines?: number;
  showTooltip?: boolean;
}

export const TruncateText = ({ text, maxLines = 1, showTooltip = true, ...props }: TruncateTextProps) => {
  const content = (
    <Typography
      {...props}
      sx={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: 'vertical',
        ...props.sx,
      }}
    >
      {text}
    </Typography>
  );
  return showTooltip ? <Tooltip title={text}>{content}</Tooltip> : content;
};
