import { PropsWithChildren } from 'react';
import { useThemeMode } from 'hooks/useThemeMode';
import { cssVarRgba } from 'lib/utils';
import { useSettingsContext } from 'providers/SettingsProvider';
import SimpleBar, { SimpleBarProps } from 'components/base/SimpleBar';

const SidenavSimpleBar = ({ children, sx, ...props }: PropsWithChildren<SimpleBarProps>) => {
  const {
    config: { navColor },
  } = useSettingsContext();
  const { isDark } = useThemeMode();

  return (
    <SimpleBar
      {...props}
      autoHide
      sx={{
        height: 1,
        '& .simplebar-track': {
          '&.simplebar-vertical': {
            '& .simplebar-scrollbar': {
              '&:before': {
                backgroundColor: (theme) =>
                  navColor === 'vibrant'
                    ? isDark
                      ? cssVarRgba(theme.vars.palette.common.whiteChannel, 0.3)
                      : cssVarRgba(theme.vars.palette.common.whiteChannel, 0.7)
                    : 'chGrey.300',
              },
            },
          },
        },
        ...sx,
      }}
    >
      {children}
    </SimpleBar>
  );
};

export default SidenavSimpleBar;
