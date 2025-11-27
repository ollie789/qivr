import { Box, IconButton, Typography } from '@mui/material';
import { ContentCopy, Check } from '@mui/icons-material';
import { useState } from 'react';
import { auraTokens } from '../../theme/auraTokens';

export interface CodeBlockProps {
  code: string;
  language?: string;
  showCopy?: boolean;
  maxHeight?: number | string;
}

export const CodeBlock = ({ code, language = 'typescript', showCopy = true, maxHeight = 400 }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        bgcolor: 'grey.900',
        borderRadius: auraTokens.borderRadius.md,
        overflow: 'hidden',
      }}
    >
      {language && (
        <Box sx={{ px: 2, py: 0.5, bgcolor: 'grey.800', borderBottom: '1px solid', borderColor: 'grey.700' }}>
          <Typography variant="caption" color="grey.400">{language}</Typography>
        </Box>
      )}
      {showCopy && (
        <IconButton
          size="small"
          onClick={handleCopy}
          sx={{ position: 'absolute', top: language ? 32 : 8, right: 8, color: 'grey.400' }}
        >
          {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
        </IconButton>
      )}
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          overflow: 'auto',
          maxHeight,
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.6,
          color: 'grey.100',
          '& code': { fontFamily: 'inherit' },
        }}
      >
        <code>{code}</code>
      </Box>
    </Box>
  );
};
