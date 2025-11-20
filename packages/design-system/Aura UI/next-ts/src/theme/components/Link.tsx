import { MouseEvent } from 'react';
import Link from 'next/link';
import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles';

interface LinkBehaviorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  ref?: React.Ref<HTMLAnchorElement>;
}

export const LinkBehavior = ({ ref, href, onClick, ...props }: LinkBehaviorProps) => {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (href === '#!') event.preventDefault();
    onClick?.(event);
  };

  return <Link ref={ref} {...props} href={href || '/'} onClick={handleClick} passHref></Link>;
};

export const HashLinkBehavior = ({ ref, href, ...props }: LinkBehaviorProps) => {
  return <Link ref={ref} {...props} href={href} passHref></Link>;
};

const MuiLink: Components<Omit<Theme, 'components'>>['MuiLink'] = {
  defaultProps: {
    component: LinkBehavior,
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

export default MuiLink;
