'use client';

import { PropsWithChildren } from 'react';
import useSettingsPanelMountEffect from 'hooks/useSettingsPanelMountEffect';

const AuthLayout = ({ children }: PropsWithChildren) => {
  useSettingsPanelMountEffect({
    disableNavigationMenuSection: true,
    disableSidenavShapeSection: true,
    disableTopShapeSection: true,
    disableNavColorSection: true,
  });
  return children;
};

export default AuthLayout;
