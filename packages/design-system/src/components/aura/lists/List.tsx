import { List as MuiList, ListProps as MuiListProps } from '@mui/material';
import { forwardRef } from 'react';

export interface AuraListProps extends MuiListProps {
  dense?: boolean;
}

export const AuraList = forwardRef<HTMLUListElement, AuraListProps>(
  ({ dense = false, sx, ...props }, ref) => {
    return (
      <MuiList
        ref={ref}
        dense={dense}
        sx={{
          py: 0,
          ...sx,
        }}
        {...props}
      />
    );
  }
);

AuraList.displayName = 'AuraList';
