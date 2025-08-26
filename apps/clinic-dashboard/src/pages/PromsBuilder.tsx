import React, { useEffect, useState } from 'react';
import { PromBuilder } from '../features/proms/components/PromBuilder';
import { promsApi, PromTemplateSummary } from '../services/proms';
import { Box, Paper, Typography, List, ListItemButton, ListItemText, Divider, Grid, Button } from '@mui/material';

export default function PromsBuilder() {
  const [templates, setTemplates] = useState<PromTemplateSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBuilder, setShowBuilder] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await promsApi.listTemplates(1, 50);
        setTemplates(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Templates</Typography>
            <Button size="small" onClick={() => setShowBuilder(true)}>New</Button>
          </Box>
          <Divider sx={{ my: 1 }} />
          <List dense>
            {templates.map(t => (
              <ListItemButton key={t.id} onClick={() => setShowBuilder(true)}>
                <ListItemText primary={t.name} secondary={`${t.key} v${t.version}`} />
              </ListItemButton>
            ))}
            {!loading && templates.length === 0 && (
              <Typography variant="body2" color="text.secondary">No templates yet</Typography>
            )}
          </List>
        </Paper>
      </Grid>
      <Grid item xs={12} md={8}>
        {showBuilder && (
          <PromBuilder />
        )}
      </Grid>
    </Grid>
  );
}
