import { Theme, avatarClasses } from '@mui/material';
import { Components } from '@mui/material/styles';

export const Avatar: Components<Omit<Theme, 'components'>>['MuiAvatar'] = {
  defaultProps: {},
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: theme.vars.palette.background.elevation4,
      fontWeight: 500,
      lineHeight: 1.2,
    }),
    colorDefault: ({ theme }) => ({
      backgroundColor: theme.vars.palette.primary.main,
    }),
    fallback: {
      // Default fallback styling without external image
      width: '62%',
      height: '100%',
    },
  },
};

export const AvatarGroup: Components<Omit<Theme, 'components'>>['MuiAvatarGroup'] = {
  defaultProps: {},
  styleOverrides: {
    avatar: {
      marginLeft: 0,
      marginRight: -8,
    },
    root: ({ ownerState: { max } }) => ({
      ...[...Array(max)].reduce(
        (result, curr, index) => ({
          ...result,
          [`& > .${avatarClasses.root}:nth-of-type(${index + 1})`]: {
            zIndex: Number(max) - index,
          },
        }),
        {},
      ),
    }),
  },
};
