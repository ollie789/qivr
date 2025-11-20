import { useCallback, useRef } from 'react';
import { Button } from '@mui/material';
import { useThemeMode } from 'hooks/useThemeMode';
import IconifyIcon from 'components/base/IconifyIcon';

interface ThemeTogglerProps {
  type?: 'default' | 'slim';
}

const ThemeToggler = ({ type = 'default' }: ThemeTogglerProps) => {
  const { isDark, setThemeMode } = useThemeMode();
  const lastClickTimeRef = useRef(0);

  const icon = isDark
    ? `material-symbols${type === 'slim' ? '' : '-light'}:light-off-outline-rounded`
    : `material-symbols${type === 'slim' ? '' : '-light'}:lightbulb-outline-rounded`;

  const handleClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 300) return;

    lastClickTimeRef.current = now;
    setThemeMode();
  }, [setThemeMode]);

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
