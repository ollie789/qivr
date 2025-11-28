import { ImgHTMLAttributes, Ref } from 'react';
import { Box, BoxProps, useColorScheme } from '@mui/material';

export interface ThemeAwareImageSource {
  light: string;
  dark: string;
}

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  sx?: BoxProps['sx'];
  src?: string | ThemeAwareImageSource;
  ref?: Ref<HTMLImageElement>;
}

const Image = ({ src, ref, ...props }: ImageProps) => {
  const { mode } = useColorScheme();
  const isDark = mode === 'dark';

  const imageSrc = !src ? undefined : typeof src === 'string' ? src : isDark ? src.dark : src.light;

  return <Box component="img" ref={ref} src={imageSrc} {...props} />;
};

export default Image;
