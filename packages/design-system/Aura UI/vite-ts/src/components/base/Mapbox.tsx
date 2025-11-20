import { HTMLAttributes, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, Box, Button, ButtonGroup, SxProps, buttonGroupClasses } from '@mui/material';
import { useThemeMode } from 'hooks/useThemeMode';
import mapboxgl, { Map, MapOptions } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ThemeMode } from 'providers/ThemeProvider';
import IconifyIcon from './IconifyIcon';

// import MapboxWorker from './mapboxWorker.js?worker';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

// mapboxgl.workerClass = MapboxWorker;

interface MapboxProps extends HTMLAttributes<HTMLDivElement> {
  sx?: SxProps;
  options: Omit<MapOptions, 'container'>;
}

const Mapbox = ({ sx, options, ...rest }: MapboxProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const { mode } = useThemeMode();
  const hasAccessToken = Boolean(mapboxgl.accessToken);

  const mapStyles = {
    system: window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'mapbox://styles/themewagon/cljzg9juf007x01pk1bepfgew'
      : 'mapbox://styles/themewagon/clj57pads001701qo25756jtw',
    light: 'mapbox://styles/themewagon/clj57pads001701qo25756jtw',
    dark: 'mapbox://styles/themewagon/cljzg9juf007x01pk1bepfgew',
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!mapboxgl.accessToken) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyles[mode as ThemeMode],
      scrollZoom: false,
      ...options,
    });

    if (options.center) {
      const markerNode = document.createElement('div');
      createRoot(markerNode).render(
        <IconifyIcon
          icon="material-symbols:location-on-rounded"
          fontSize={40}
          color="primary.main"
        />,
      );
      new mapboxgl.Marker({ element: markerNode }).setLngLat(options.center).addTo(mapRef.current);
    }
  }, [mode, options]);

  useEffect(() => {
    mapRef.current?.setStyle(mapStyles[mode as ThemeMode]);
  }, [mode]);

  return (
    <Box
      {...rest}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        WebkitMaskImage: 'radial-gradient(white, black)',
        height: 400,
        ...sx,
      }}
    >
      {hasAccessToken ? (
        <Box
          ref={mapContainerRef}
          sx={{
            height: 1,
          }}
        />
      ) : (
        <Box sx={{ p: 3 }}>
          <Alert
            severity="error"
            sx={{
              width: 1,
            }}
          >
            Mapbox access token is missing. Please add VITE_MAPBOX_ACCESS_TOKEN to your environment
            variables.
          </Alert>
        </Box>
      )}
      <ButtonGroup
        orientation="vertical"
        aria-label="Mapbox control button"
        variant="contained"
        sx={{
          position: 'absolute',
          left: 24,
          bottom: 24,
          boxShadow: 'none',

          [`& .${buttonGroupClasses.grouped}`]: {
            minWidth: 0,
            p: 1,
          },

          [`& .${buttonGroupClasses.firstButton}`]: {
            border: 'none',
          },
        }}
      >
        <Button color="neutral" variant="soft" onClick={() => mapRef.current?.zoomIn()}>
          <IconifyIcon icon="material-symbols:zoom-in-rounded" fontSize={20} />
        </Button>
        <Button color="neutral" variant="soft" onClick={() => mapRef.current?.zoomOut()}>
          <IconifyIcon icon="material-symbols:zoom-out-rounded" fontSize={20} />
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export default Mapbox;
