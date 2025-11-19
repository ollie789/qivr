import { Box, IconButton, ToggleButton, ToggleButtonGroup, Tooltip, Popover, TextField, Button, Stack } from '@mui/material';
import { 
  Brush, 
  Clear, 
  ArrowForward, 
  TextFields, 
  Place,
  FlashOn,
  Star,
  Close,
} from '@mui/icons-material';
import { useState } from 'react';
import type { DrawingTool, SymbolType } from '../../types/pain-drawing';

interface AnnotationToolsProps {
  selectedTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  selectedSymbol: SymbolType;
  onSymbolChange: (symbol: SymbolType) => void;
}

export function AnnotationTools({
  selectedTool,
  onToolChange,
  selectedSymbol,
  onSymbolChange,
}: AnnotationToolsProps) {
  const [symbolAnchor, setSymbolAnchor] = useState<HTMLElement | null>(null);

  const handleSymbolClick = (event: React.MouseEvent<HTMLElement>) => {
    if (selectedTool === 'symbol') {
      setSymbolAnchor(event.currentTarget);
    } else {
      onToolChange('symbol');
    }
  };

  return (
    <Box>
      <ToggleButtonGroup
        value={selectedTool}
        exclusive
        onChange={(_, tool) => tool && onToolChange(tool)}
        size="small"
      >
        <ToggleButton value="draw">
          <Tooltip title="Draw">
            <Brush fontSize="small" />
          </Tooltip>
        </ToggleButton>
        
        <ToggleButton value="erase">
          <Tooltip title="Erase">
            <Clear fontSize="small" />
          </Tooltip>
        </ToggleButton>
        
        <ToggleButton value="arrow">
          <Tooltip title="Arrow (radiating pain)">
            <ArrowForward fontSize="small" />
          </Tooltip>
        </ToggleButton>
        
        <ToggleButton value="text">
          <Tooltip title="Text note">
            <TextFields fontSize="small" />
          </Tooltip>
        </ToggleButton>
        
        <ToggleButton value="symbol" onClick={handleSymbolClick}>
          <Tooltip title="Symbol">
            <Box>
              {selectedSymbol === 'pin' && <Place fontSize="small" />}
              {selectedSymbol === 'lightning' && <FlashOn fontSize="small" />}
              {selectedSymbol === 'star' && <Star fontSize="small" />}
              {selectedSymbol === 'cross' && <Close fontSize="small" />}
            </Box>
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <Popover
        open={Boolean(symbolAnchor)}
        anchorEl={symbolAnchor}
        onClose={() => setSymbolAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 1 }}>
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              color={selectedSymbol === 'pin' ? 'primary' : 'default'}
              onClick={() => {
                onSymbolChange('pin');
                setSymbolAnchor(null);
              }}
            >
              <Place />
            </IconButton>
            <IconButton
              size="small"
              color={selectedSymbol === 'lightning' ? 'primary' : 'default'}
              onClick={() => {
                onSymbolChange('lightning');
                setSymbolAnchor(null);
              }}
            >
              <FlashOn />
            </IconButton>
            <IconButton
              size="small"
              color={selectedSymbol === 'star' ? 'primary' : 'default'}
              onClick={() => {
                onSymbolChange('star');
                setSymbolAnchor(null);
              }}
            >
              <Star />
            </IconButton>
            <IconButton
              size="small"
              color={selectedSymbol === 'cross' ? 'primary' : 'default'}
              onClick={() => {
                onSymbolChange('cross');
                setSymbolAnchor(null);
              }}
            >
              <Close />
            </IconButton>
          </Stack>
        </Box>
      </Popover>
    </Box>
  );
}
