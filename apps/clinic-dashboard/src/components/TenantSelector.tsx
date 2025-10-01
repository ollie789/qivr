import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { Apartment as ApartmentIcon, ArrowDropDown as ArrowDropDownIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { fetchTenantOptions, type TenantOption } from '../services/tenantService';
import { useAuth, useAuthActions } from '../stores/authStore';

const TenantSelector = () => {
  const { activeTenantId, user } = useAuth();
  const { setActiveTenantId } = useAuthActions();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants', user?.id],
    queryFn: fetchTenantOptions,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (tenants.length === 0) {
      return;
    }

    const isActiveAvailable = activeTenantId && tenants.some((tenant) => tenant.id === activeTenantId);
    if (!isActiveAvailable) {
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

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (!isLoading && tenants.length > 0) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (tenant: TenantOption) => {
    setActiveTenantId(tenant.id);
    handleClose();
  };

  if (isLoading && tenants.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 120 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (tenants.length <= 1 && selectedTenant) {
    return (
      <Tooltip title="Active clinic tenant">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, borderRadius: 1, bgcolor: 'action.hover' }}>
          <ApartmentIcon fontSize="small" color="action" />
          <Box component="span" sx={{ fontSize: 14, fontWeight: 500 }}>
            {selectedTenant.name || selectedTenant.id}
          </Box>
        </Box>
      </Tooltip>
    );
  }

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        color="inherit"
        sx={{ textTransform: 'none', borderRadius: 999, px: 1.5, borderColor: 'divider' }}
        onClick={handleOpen}
        endIcon={<ArrowDropDownIcon />}
      >
        <ApartmentIcon fontSize="small" sx={{ mr: 1 }} />
        <Box component="span" sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedTenant?.name || selectedTenant?.id || 'Select Tenant'}
        </Box>
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {tenants.map((tenant) => (
          <MenuItem
            key={tenant.id}
            selected={tenant.id === selectedTenant?.id}
            onClick={() => handleSelect(tenant)}
          >
            <ListItemIcon>
              <ApartmentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={tenant.name || tenant.id}
              secondary={tenant.isDefault ? 'Default' : undefined}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default TenantSelector;
