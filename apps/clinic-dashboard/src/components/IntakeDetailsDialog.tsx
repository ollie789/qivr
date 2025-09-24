import React from 'react';
import { 
  Dialog, 
  DialogContent,
  IconButton,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { EvaluationViewer } from '../features/intake/components/EvaluationViewer';

// Type for intake data
interface IntakeData {
  id: string;
  patientName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  submittedAt: string;
  status?: string;
  urgency?: string;
  chiefComplaint: string;
  symptoms?: string[];
  painLocation?: string;
  painLevel?: number;
  duration?: string;
  medicalHistory?: string;
  medications?: string[];
  allergies?: string[];
  aiSummary?: string;
  aiFlags?: string[];
  triageNotes?: string;
  internalNotes?: string;
}

interface IntakeDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  intake: IntakeData | null;
  onSchedule?: () => void;
}

export const IntakeDetailsDialog: React.FC<IntakeDetailsDialogProps> = ({
  open,
  onClose,
  intake,
  onSchedule
}) => {
  if (!intake) return null;

  const evaluation = {
    id: intake.id,
    patientId: intake.id,
    patientName: intake.patientName,
    patientEmail: intake.email || 'patient@example.com',
    patientPhone: intake.phone || '000-000-0000',
    dateOfBirth: intake.dateOfBirth || new Date().toISOString(),
    submittedAt: intake.submittedAt,
    status: (intake.status || 'pending') as 'pending' | 'triaged' | 'scheduled' | 'completed',
    urgency: (intake.urgency || 'medium') as 'low' | 'medium' | 'high' | 'critical',
    chiefComplaint: intake.chiefComplaint,
    symptoms: intake.symptoms || [],
    painPoints: [
      {
        id: '1',
        bodyPart: intake.painLocation || 'Not specified',
        intensity: intake.painLevel || 5,
        type: 'aching',
        duration: intake.duration || 'Not specified',
      }
    ],
    medicalHistory: intake.medicalHistory ? [intake.medicalHistory] : [],
    medications: intake.medications || [],
    allergies: intake.allergies || [],
    aiSummary: intake.aiSummary ? {
      content: intake.aiSummary,
      riskFlags: intake.aiFlags || [],
      recommendedActions: [
        'Schedule appointment with specialist',
        'Request additional imaging if needed',
        'Follow up within 48 hours'
      ],
      status: 'pending' as const,
    } : undefined,
    triageNotes: intake.triageNotes || '',
    internalNotes: intake.internalNotes || '',
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <Box sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 0 }}>
        <EvaluationViewer
          evaluation={evaluation}
          onUpdate={(updatedEvaluation) => {
            console.log('Evaluation updated:', updatedEvaluation);
            // TODO: Call API to update evaluation
            onClose();
          }}
          onSchedule={() => {
            onClose();
            onSchedule?.();
          }}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default IntakeDetailsDialog;
