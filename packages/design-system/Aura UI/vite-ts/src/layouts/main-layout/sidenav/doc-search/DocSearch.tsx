import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Autocomplete,
  InputAdornment,
  Typography,
  autocompleteClasses,
  inputBaseClasses,
  listSubheaderClasses,
} from '@mui/material';
import sitemap, { SubMenuItem } from 'routes/sitemap';
import IconifyIcon from 'components/base/IconifyIcon';
import StyledTextField from 'components/styled/StyledTextField';

interface FlatMenuItem {
  group: 'Guide' | 'Components';
  label: string;
  path: string;
}

interface DocSearchProps {
  filterGroup?: 'Guide' | 'Components';
}

const DocSearch = ({ filterGroup }: DocSearchProps) => {
  const navigate = useNavigate();

  const searchOptions = useMemo(() => {
    const docSection = sitemap.find((item) => item.id === 'documentation');
    if (!docSection?.items) return [];

    return docSection.items
      .filter(
        (category) =>
          (!filterGroup || category.name === filterGroup) &&
          (category.name === 'Guide' || category.name === 'Components'),
      )
      .flatMap((category) => {
        const group = category.name as FlatMenuItem['group'];

        const flattenItems = (items: SubMenuItem[]): FlatMenuItem[] => {
          return items.flatMap((item) => {
            const result: FlatMenuItem[] = [];

            if (item.path && item.name) {
              result.push({ group, label: item.name, path: item.path });
            }

            if (item.items?.length) {
              result.push(...flattenItems(item.items));
            }

            return result;
          });
        };

        return category.items?.length ? flattenItems(category.items as SubMenuItem[]) : [];
      });
  }, [sitemap, filterGroup]);

  return (
    <Autocomplete
      options={searchOptions}
      noOptionsText={
        <Typography variant="subtitle2" sx={{ textAlign: 'center', color: 'text.disabled' }}>
          No result found
        </Typography>
      }
      groupBy={(option) => (filterGroup ? '' : option.group)}
      onChange={(_, value) => value && navigate(value.path)}
      renderInput={(params) => (
        <StyledTextField
          {...params}
          placeholder={`Search ${filterGroup || 'Docs'}`}
          variant="outlined"
          onFocus={(e) => e.stopPropagation()}
          sx={{
            [`& .${inputBaseClasses.input}`]: {
              fontSize: '12px !important',
            },
            [`& .${inputBaseClasses.root}`]: {
              borderRadius: filterGroup ? 1 : 6,
            },
            flexGrow: 1,
          }}
          size="small"
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="end" sx={{ ml: 0 }}>
                    <IconifyIcon icon="material-symbols:search-rounded" />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            },
          }}
        />
      )}
      slotProps={{
        paper: {
          sx: (theme) => ({
            [`& .${listSubheaderClasses.root}`]: {
              lineHeight: 3,
              color: 'text.disabled',
              fontSize: 'caption.fontSize',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              bgcolor: theme.vars.palette.background.paper,
              ...theme.applyStyles('dark', {
                bgcolor: theme.vars.palette.background.elevation1,
              }),
            },
            [`& .${autocompleteClasses.groupLabel}`]: {
              pl: '8px !important',
            },
            [`& .${autocompleteClasses.groupUl}`]: {
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',

              [`& .${autocompleteClasses.option}`]: {
                fontSize: 'caption.fontSize',
                fontWeight: 500,
                borderRadius: 2,
                pl: filterGroup ? 2 : 3,
              },
            },
            [`& .${autocompleteClasses.listbox}`]: {
              maxHeight: 320,
              px: 1,
            },
          }),
        },
        clearIndicator: {
          sx: {
            '& svg': { fontSize: 12 },
          },
        },
        popupIndicator: {
          sx: {
            '& svg': { fontSize: 14 },
          },
        },
      }}
      sx={{ width: 1, mb: 2 }}
    />
  );
};

export default DocSearch;
