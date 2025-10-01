import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import { Apartment as ApartmentIcon, ArrowDropDown as ArrowDropDownIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { fetchTenantOptions, type TenantOption } from '../services/tenantService';
import { useAuth } from '../contexts/AuthContext';

const TenantSelector = () => {
  const { activeTenantId, setActiveTenantId } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: fetchTenantOptions,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (tenants.length === 0) {
      return;
    }

    const hasActive = activeTenantId && tenants.some((tenant) => tenant.id === activeTenantId);
    if (!hasActive) {
      const preferred = tenants.find((tenant) => tenant.isDefault) ?? tenants[0];
      if (preferred) {
        setActiveTenantId(preferred.id);
      }
    }
  }, [tenants, activeTenantId, setActiveTenantId]);

  const selectedTenant = useMemo(() => {
    if (!activeTenantId) {
      return tenants.find((tenant) => tenant.isDefault) ?? tenants[0];
    }
    return tenants.find((tenant) => tenant.id === activeTenantId) ?? tenants[0];
  }, [activeTenantId, tenants]);

  if (isLoading && tenants.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 120 }}>
        <CircularProgress size={18} color="inherit" />
      </Box>
    );
  }

  if (tenants.length <= 1 && selectedTenant) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, borderRadius: 999, bgcolor: 'action.hover' }}>
        <ApartmentIcon fontSize="small" color="action" />
        <Box component="span" sx={{ fontSize: 13, fontWeight: 500 }}>
          {selectedTenant.name || selectedTenant.id}
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        color="inherit"
        sx={{ textTransform: 'none', borderRadius: 999, px: 1.25, borderColor: 'divider' }}
        endIcon={<ArrowDropDownIcon />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <ApartmentIcon fontSize="small" sx={{ mr: 1 }} />
        <Box component="span" sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedTenant?.name || selectedTenant?.id || 'Tenants'}
        </Box>
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {tenants.map((tenant) => (
          <MenuItem
            key={tenant.id}
            selected={tenant.id === selectedTenant?.id}
            onClick={() => {
              setActiveTenantId(tenant.id);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <ApartmentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={tenant.name || tenant.id} secondary={tenant.isDefault ? 'Default' : undefined} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default TenantSelector;
