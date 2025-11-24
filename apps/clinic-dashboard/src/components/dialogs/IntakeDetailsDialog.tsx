import React from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useQuery } from "@tanstack/react-query";
import { EvaluationViewer } from "../../features/intake/components/EvaluationViewer";
import { intakeApi } from "../../services/intakeApi";

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
  onSchedule,
}) => {
  const { data: fullEvaluation, isLoading } = useQuery({
    queryKey: ["intakeDetails", intake?.id],
    queryFn: () => intakeApi.getIntakeDetails(intake!.id),
    enabled: open && !!intake?.id,
  });

  if (!intake) return null;

  const evaluationData = fullEvaluation
    ? {
        id: fullEvaluation.id,
        patientId: fullEvaluation.id,
        patientName: fullEvaluation.patient.name,
        patientEmail: fullEvaluation.patient.email,
        patientPhone: fullEvaluation.patient.phone,
        dateOfBirth: fullEvaluation.patient.dateOfBirth,
        submittedAt: fullEvaluation.evaluation.submittedAt,
        status: fullEvaluation.status as any,
        urgency: fullEvaluation.evaluation.severity as any,
        chiefComplaint: fullEvaluation.evaluation.conditionType,
        symptoms: fullEvaluation.evaluation.symptoms,
        painPoints:
          fullEvaluation.painMap?.bodyParts.map((bp) => ({
            id: bp.region,
            bodyPart: bp.region,
            intensity: bp.intensity,
            type: bp.type,
            duration: fullEvaluation.evaluation.duration,
          })) || [],
        medicalHistory: fullEvaluation.evaluation.previousTreatments || [],
        medications: [],
        allergies: [],
        aiSummary: fullEvaluation.aiSummary
          ? {
              content: fullEvaluation.aiSummary.content,
              riskFlags: fullEvaluation.aiSummary.riskFactors,
              recommendedActions: fullEvaluation.aiSummary.recommendations,
              status: fullEvaluation.aiSummary.approved
                ? ("approved" as const)
                : ("pending" as const),
            }
          : undefined,
        triageNotes: fullEvaluation.notes,
        internalNotes: fullEvaluation.notes,
      }
    : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: "90vh" },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Intake Evaluation
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : evaluationData ? (
          <EvaluationViewer
            evaluation={evaluationData}
            onUpdate={(updatedEvaluation) => {
              console.log("Evaluation updated:", updatedEvaluation);
              onClose();
            }}
            onSchedule={() => {
              onClose();
              onSchedule?.();
            }}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default IntakeDetailsDialog;
