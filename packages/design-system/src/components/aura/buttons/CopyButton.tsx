import { IconButton, Tooltip, IconButtonProps } from '@mui/material';
import { ContentCopy, Check } from '@mui/icons-material';
import { useState } from 'react';

export interface CopyButtonProps extends Omit<IconButtonProps, 'onClick'> {
  text: string;
  tooltip?: string;
}

export const CopyButton = ({ text, tooltip = 'Copy', ...props }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip title={copied ? 'Copied!' : tooltip}>
      <IconButton onClick={handleCopy} {...props}>
        {copied ? <Check fontSize="small" color="success" /> : <ContentCopy fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};
