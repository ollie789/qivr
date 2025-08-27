import React, { useEffect, useState } from 'react';
import { PromBuilder } from '../features/proms/components/PromBuilder';
import { promsApi, PromTemplateSummary } from '../services/proms';
import { Box, Paper, Typography, List, ListItemButton, ListItemText, Divider, Grid, Button, IconButton, Chip } from '@mui/material';
import { Send as SendIcon, Edit as EditIcon, ContentCopy as CopyIcon, Preview as PreviewIcon } from '@mui/icons-material';
import { SendPromDialog } from '../components/SendPromDialog';
import { PromPreview } from '../components/PromPreview';

export default function PromsBuilder() {
  const [templates, setTemplates] = useState<PromTemplateSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBuilder, setShowBuilder] = useState(true);
  const [sendPromOpen, setSendPromOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState<PromTemplateSummary | null>(null);

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
              <ListItemButton key={t.id}>
                <ListItemText 
                  primary={t.name} 
                  secondary={
                    <Box>
                      <Chip label={`v${t.version}`} size="small" sx={{ mr: 1 }} />
                      <Typography variant="caption">{t.key}</Typography>
                    </Box>
                  }
                />
                <Box>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTemplateId(t.id);
                      setSelectedTemplate(t);
                      setPreviewOpen(true);
                    }}
                    title="Preview Template"
                  >
                    <PreviewIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTemplateId(t.id);
                      setSendPromOpen(true);
                    }}
                    title="Send to Patients"
                  >
                    <SendIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => setShowBuilder(true)}
                    title="Edit Template"
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
              </ListItemButton>
            ))}
            {!loading && templates.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No templates yet. Click "New" to create one.
              </Typography>
            )}
          </List>
        </Paper>
      </Grid>
      <Grid item xs={12} md={8}>
        {showBuilder && (
          <PromBuilder />
        )}
      </Grid>
      
      {/* Send PROM Dialog */}
      <SendPromDialog
        open={sendPromOpen}
        onClose={() => {
          setSendPromOpen(false);
          setSelectedTemplateId(undefined);
        }}
        templateId={selectedTemplateId}
      />
      
      {/* PROM Preview Dialog */}
      <PromPreview
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedTemplate(null);
          setSelectedTemplateId(undefined);
        }}
        templateId={selectedTemplateId}
        templateData={selectedTemplate}
      />
    </Grid>
  );
}
