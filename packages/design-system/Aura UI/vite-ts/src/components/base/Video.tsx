import { SourceHTMLAttributes, VideoHTMLAttributes } from 'react';
import Box, { BoxProps } from '@mui/material/Box';

interface VideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src' | 'type'> {
  sx?: BoxProps['sx'];
  src?: string;
  type?: SourceHTMLAttributes<HTMLSourceElement>['type'];
  srcProps?: SourceHTMLAttributes<HTMLSourceElement>;
}

const Video = ({ src, type = 'video/webm', srcProps, ...props }: VideoProps) => {
  return (
    <Box component="video" {...props}>
      <source src={src} type={type} {...srcProps} />
    </Box>
  );
};

export default Video;
