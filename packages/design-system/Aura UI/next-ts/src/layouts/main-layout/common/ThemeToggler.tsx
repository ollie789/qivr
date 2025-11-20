'use client';

import { useCallback, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@mui/material';
import { useThemeMode } from 'hooks/useThemeMode';
import IconifyIcon from 'components/base/IconifyIcon';

interface ThemeTogglerProps {
  type?: 'default' | 'slim';
}

const ThemeToggler = ({ type = 'default' }: ThemeTogglerProps) => {
  const { isDark, setThemeMode } = useThemeMode();
  const lastClickTimeRef = useRef(0);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const icon = isDark
    ? `material-symbols${type === 'slim' ? '' : '-light'}:light-off-outline-rounded`
    : `material-symbols${type === 'slim' ? '' : '-light'}:lightbulb-outline-rounded`;

  const handleClick = useCallback(() => {
    if (searchParams.toString()) {
      router.replace(pathname, { scroll: false });
    }

    const now = Date.now();
    if (now - lastClickTimeRef.current < 300) return;

    lastClickTimeRef.current = now;
    setThemeMode();
  }, [setThemeMode, searchParams]);

  return (
    <Button
      color="neutral"
      variant={type === 'default' ? 'soft' : 'text'}
      shape="circle"
      onClick={handleClick}
      size={type === 'slim' ? 'small' : 'medium'}
    >
      <IconifyIcon icon={icon} sx={{ fontSize: type === 'slim' ? 18 : 22 }} />
    </Button>
  );
};

export default ThemeToggler;
