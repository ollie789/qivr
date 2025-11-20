import { PropsWithChildren, useEffect, useRef } from 'react';
import { Box, SxProps, useTheme } from '@mui/material';
import { Resizable as ReResizable, ResizableProps as ReResizableProps } from 're-resizable';

interface ResizableProps extends ReResizableProps {
  sx?: SxProps;
  handleResize: (width: number) => void;
}

const Resizable = ({ children, handleResize, sx, ...rest }: PropsWithChildren<ResizableProps>) => {
  const { direction } = useTheme();
  const resizableRef = useRef<ReResizable | null>(null);

  const onResize = (e: MouseEvent | TouchEvent, direction: string, ref: HTMLElement) => {
    handleResize(ref.offsetWidth);
  };

  useEffect(() => {
    const updateWidthOnResize = () => handleResize(resizableRef.current?.size?.width || 0);
    window.addEventListener('resize', updateWidthOnResize);
    updateWidthOnResize();

    return () => window.removeEventListener('resize', updateWidthOnResize);
  }, []);

  return (
    <Box
      component={ReResizable}
      ref={resizableRef}
      onResize={onResize}
      sx={{ ...sx }}
      enable={{
        top: false,
        right: direction === 'rtl' ? false : true,
        bottom: false,
        left: direction === 'rtl' ? true : false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      handleClasses={{ [direction === 'rtl' ? 'left' : 'right']: 'resizable-handler' }}
      minWidth={375}
      {...rest}
    >
      {children}
    </Box>
  );
};

export default Resizable;
