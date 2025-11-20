import { PropsWithChildren, RefObject, useRef } from 'react';
import { Box, Button, Stack, SxProps, Theme, useTheme } from '@mui/material';
import { Navigation } from 'swiper/modules';
import { Swiper as ReactSwiper, SwiperProps as ReactSwiperProps } from 'swiper/react';
import { NavigationOptions } from 'swiper/types';
import IconifyIcon from './IconifyIcon';

interface SwiperProps extends Omit<ReactSwiperProps, 'navigation'> {
  navigation?:
    | boolean
    | { prevEl: RefObject<HTMLButtonElement | null>; nextEl: RefObject<HTMLButtonElement | null> };
  navigationPosition?: SxProps;
  sx?: SxProps<Theme>;
  ref?: React.Ref<HTMLElement>;
}

const Swiper = ({
  children,
  sx,
  navigation = false,
  navigationPosition,
  ref,
  ...rest
}: PropsWithChildren<SwiperProps>) => {
  const theme = useTheme();

  const defaultPrevRef = useRef<HTMLButtonElement>(null);
  const defaultNextRef = useRef<HTMLButtonElement>(null);

  const isCustomNavigation = typeof navigation === 'object';
  const prevRef = isCustomNavigation ? navigation.prevEl : defaultPrevRef;
  const nextRef = isCustomNavigation ? navigation.nextEl : defaultNextRef;

  return (
    <Box key={theme.direction} sx={{ position: 'relative', ...sx }} dir={theme.direction} ref={ref}>
      {navigation && !isCustomNavigation && (
        <Stack
          sx={{
            justifyContent: 'space-between',
            width: 1,
            px: { xs: 1, sm: 2, md: 5 },
            position: 'absolute',
            zIndex: 2,
            top: '50%',
            transform: 'translateY(-50%)',
            ...navigationPosition,
          }}
        >
          <Button ref={prevRef} color="neutral" variant="soft" sx={{ p: 1, minWidth: 0 }}>
            <IconifyIcon flipOnRTL icon="material-symbols:chevron-left-rounded" fontSize={20} />
          </Button>
          <Button ref={nextRef} color="neutral" variant="soft" sx={{ p: 1, minWidth: 0 }}>
            <IconifyIcon flipOnRTL icon="material-symbols:chevron-right-rounded" fontSize={20} />
          </Button>
        </Stack>
      )}
      <ReactSwiper
        modules={[Navigation]}
        navigation={
          navigation
            ? {
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }
            : undefined
        }
        onBeforeInit={(swiper) => {
          if (swiper.params.navigation) {
            const navigationOptions = swiper.params.navigation as NavigationOptions;
            navigationOptions.prevEl = prevRef.current;
            navigationOptions.nextEl = nextRef.current;
          }
        }}
        {...rest}
      >
        {children}
      </ReactSwiper>
    </Box>
  );
};

export default Swiper;
