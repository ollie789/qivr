import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles';

export const ImageListItem: Components<Omit<Theme, 'components'>>['MuiImageListItem'] = {
  defaultProps: {},
  styleOverrides: {
    root: {
      '& img': {
        objectFit: 'cover',
        width: '100%',
        display: 'block',
      },
    },
  },
};

const ImageList: Components<Omit<Theme, 'components'>>['MuiImageList'] = {
  defaultProps: {},
  styleOverrides: {
    root: {
      marginTop: 0,
      marginBottom: 0,
    },
  },
};

export default ImageList;
