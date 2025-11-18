import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { api } from '../../lib/api-client';
import { Cloud, Security, AccountTree } from '@mui/icons-material';

interface TenantInfoType {
  id: string;
  name: string;
  slug: string;
  cognitoUserPoolId?: string;
  cognitoUserPoolClientId?: string;
  plan: string;
  status: string;
}

const TenantInfo: React.FC = () => {
  const [tenantInfo, setTenantInfo] = useState<TenantInfoType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenantInfo = async () => {
      try {
        const tenants = await api.get('/tenants');
        if (tenants && tenants.length > 0) {
          // Get detailed info for the first tenant
          const tenant = await api.get(`/tenants/${tenants[0].id}`);
          setTenantInfo(tenant);
        }
      } catch (err) {
        setError('Failed to load tenant information');
      } finally {
        setLoading(false);
      }
    };

    fetchTenantInfo();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" p={2}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading tenant info...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!tenantInfo) {
    return (
      <Alert severity="info">
        No tenant information available
      </Alert>
    );
  }

  const isSaasTenant = tenantInfo.cognitoUserPoolId && tenantInfo.cognitoUserPoolClientId;

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <AccountTree color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Tenant Information
          </Typography>
          {isSaasTenant && (
            <Chip
              icon={<Security />}
              label="SaaS Multi-Tenant"
              color="success"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            Clinic Name
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {tenantInfo.name}
          </Typography>
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            Tenant ID
          </Typography>
          <Typography variant="body1" fontFamily="monospace" fontSize="0.875rem">
            {tenantInfo.id}
          </Typography>
        </Box>

        <Box display="flex" gap={1} mb={2}>
          <Chip label={`Plan: ${tenantInfo.plan}`} size="small" />
          <Chip 
            label={`Status: ${tenantInfo.status}`} 
            color={tenantInfo.status === 'Active' ? 'success' : 'default'}
            size="small" 
          />
        </Box>

        {isSaasTenant && (
          <Box>
            <Box display="flex" alignItems="center" mb={1}>
              <Cloud color="primary" sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="subtitle2">
                AWS Cognito Integration
              </Typography>
            </Box>
            
            <Box mb={1}>
              <Typography variant="body2" color="text.secondary">
                User Pool ID
              </Typography>
              <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                {tenantInfo.cognitoUserPoolId}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Client ID
              </Typography>
              <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                {tenantInfo.cognitoUserPoolClientId}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TenantInfo;
