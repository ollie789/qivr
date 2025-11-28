import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles';
import React from 'react';

// LinkBehavior placeholder - apps should provide their own router integration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LinkBehavior = React.forwardRef<HTMLAnchorElement, any>(
  (props, ref) => {
    const { href, ...other } = props;
    return <a ref={ref} href={href} {...other} />;
  }
);
LinkBehavior.displayName = 'LinkBehavior';

const Link: Components<Omit<Theme, 'components'>>['MuiLink'] = {
  defaultProps: {
    underline: 'hover',
  },
  styleOverrides: {
    underlineHover: () => ({
      position: 'relative',
      backgroundImage: `linear-gradient(currentcolor, currentcolor)`,
      backgroundSize: '0% 1px',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'left bottom',
      transition: 'background-size 0.25s ease-in',
      '&:hover': {
        textDecoration: 'none',
        backgroundSize: '100% 1px',
      },
    }),
  },
};

export default Link;
