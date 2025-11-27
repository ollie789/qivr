import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
  Stack,
  CircularProgress,
  Box,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

interface RebookingDialogProps {
  open: boolean;
  onClose: () => void;
  score: number;
  painLevel?: number;
}

interface AvailableSlot {
  id: string;
  start: string;
  end: string;
  providerId: string;
  providerName: string;
}

const analyzePROMResponse = (score: number, painLevel?: number) => {
  if (score < 50 || (painLevel && painLevel > 7)) {
    return {
      severity: "error" as const,
      recommendation: "Your scores indicate significant concerns. We strongly recommend scheduling an appointment within the next week.",
      suggestedTimeframe: 7,
    };
  }
  if (score < 70 || (painLevel && painLevel > 5)) {
    return {
      severity: "warning" as const,
      recommendation: "Your progress shows some areas of concern. Consider scheduling a follow-up within 2 weeks.",
      suggestedTimeframe: 14,
    };
  }
  return {
    severity: "info" as const,
    recommendation: "Your progress is good. A routine follow-up in the next month would be beneficial.",
    suggestedTimeframe: 30,
  };
};

export const RebookingDialog: React.FC<RebookingDialogProps> = ({
  open,
  onClose,
  score,
  painLevel,
}) => {
  const navigate = useNavigate();
  const analysis = analyzePROMResponse(score, painLevel);

  const { data: slots, isLoading } = useQuery<AvailableSlot[]>({
    queryKey: ["available-slots", analysis.suggestedTimeframe],
    queryFn: async () => {
      const response = await fetch(
        `/api/appointments/available-slots?days=${analysis.suggestedTimeframe}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch slots");
      return response.json();
    },
    enabled: open,
  });

  const handleBook = async (slot: AvailableSlot) => {
    navigate("/appointments/book", {
      state: { preselectedSlot: slot },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Book Your Next Appointment</DialogTitle>
      <DialogContent>
        <Alert severity={analysis.severity} sx={{ mb: 3 }}>
          {analysis.recommendation}
        </Alert>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Available Times
        </Typography>

        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : slots && slots.length > 0 ? (
          <Stack spacing={1}>
            {slots.slice(0, 5).map((slot) => (
              <Button
                key={slot.id}
                variant="outlined"
                onClick={() => handleBook(slot)}
                sx={{ justifyContent: "flex-start", textAlign: "left" }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {format(parseISO(slot.start), "EEEE, MMMM d 'at' h:mm a")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    with {slot.providerName}
                  </Typography>
                </Box>
              </Button>
            ))}
          </Stack>
        ) : (
          <Alert severity="info">
            No available slots found. Please contact the clinic directly.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Maybe Later</Button>
        <Button
          variant="contained"
          onClick={() => navigate("/appointments/book")}
        >
          View All Times
        </Button>
      </DialogActions>
    </Dialog>
  );
};
