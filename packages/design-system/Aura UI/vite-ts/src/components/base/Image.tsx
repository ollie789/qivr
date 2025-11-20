import { ImgHTMLAttributes, Ref } from 'react';
import { Box, BoxProps } from '@mui/material';
import { useThemeMode } from 'hooks/useThemeMode';

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
  const { isDark } = useThemeMode();

  const imageSrc = !src ? undefined : typeof src === 'string' ? src : isDark ? src.dark : src.light;

  return <Box component="img" ref={ref} src={imageSrc} {...props} />;
};

export default Image;
