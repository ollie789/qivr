import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import {
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  LocalAtm as CashIcon,
  Receipt as InsuranceIcon,
  CheckCircle as PaidIcon,
} from "@mui/icons-material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { FormDialog, AuraButton } from "@qivr/design-system";
import {
  appointmentsApi,
  type RecordPaymentRequest,
} from "../../services/appointmentsApi";
import type { Appointment } from "../../features/appointments/types";

interface PaymentRecordDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { id: "card", label: "Card", icon: <CardIcon /> },
  { id: "cash", label: "Cash", icon: <CashIcon /> },
  { id: "bank_transfer", label: "Bank Transfer", icon: <BankIcon /> },
  { id: "insurance", label: "Insurance", icon: <InsuranceIcon /> },
];

export function PaymentRecordDialog({
  open,
  onClose,
  appointment,
  onSuccess,
}: PaymentRecordDialogProps) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open && appointment) {
      setPaymentMethod("card");
      // Pre-fill with service type price if available
      setPaymentAmount(
        appointment.serviceTypePrice?.toString() ||
          appointment.copayAmount?.toString() ||
          "",
      );
      setPaymentReference("");
      setPaymentNotes("");
    }
  }, [open, appointment]);

  const recordPaymentMutation = useMutation({
    mutationFn: (data: RecordPaymentRequest) =>
      appointmentsApi.recordPayment(appointment!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      enqueueSnackbar("Payment recorded successfully", { variant: "success" });
      onClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to record payment";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const handleSubmit = () => {
    if (!appointment || !paymentAmount) return;

    recordPaymentMutation.mutate({
      paymentMethod,
      paymentAmount: parseFloat(paymentAmount),
      paymentReference: paymentReference || undefined,
      paymentNotes: paymentNotes || undefined,
    });
  };

  if (!appointment) return null;

  const isAlreadyPaid = appointment.isPaid;

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isAlreadyPaid ? "Payment Details" : "Record Payment"}
      maxWidth="sm"
      actions={
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <AuraButton onClick={onClose}>
            {isAlreadyPaid ? "Close" : "Cancel"}
          </AuraButton>
          {!isAlreadyPaid && (
            <AuraButton
              variant="contained"
              onClick={handleSubmit}
              disabled={!paymentAmount || recordPaymentMutation.isPending}
              startIcon={<PaidIcon />}
            >
              {recordPaymentMutation.isPending
                ? "Recording..."
                : "Record Payment"}
            </AuraButton>
          )}
        </Box>
      }
    >
      {/* Appointment Summary */}
      <Box
        sx={{
          p: 2,
          mb: 3,
          bgcolor: "grey.50",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "grey.200",
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          {appointment.patientName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {appointment.appointmentType}
          {appointment.serviceTypeName && ` - ${appointment.serviceTypeName}`}
        </Typography>
        {appointment.serviceTypePrice && appointment.serviceTypePrice > 0 && (
          <Typography variant="body2" color="primary.main" sx={{ mt: 0.5 }}>
            Standard Price: ${appointment.serviceTypePrice.toFixed(2)}
          </Typography>
        )}
      </Box>

      {isAlreadyPaid ? (
        /* Show payment details if already paid */
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2,
              p: 2,
              bgcolor: "success.50",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "success.200",
            }}
          >
            <PaidIcon color="success" />
            <Typography variant="body1" color="success.dark" fontWeight={600}>
              Payment Recorded
            </Typography>
          </Box>

          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Amount Paid
              </Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">
                ${appointment.paymentAmount?.toFixed(2)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Payment Method
              </Typography>
              <Typography variant="body1">
                {PAYMENT_METHODS.find((m) => m.id === appointment.paymentMethod)
                  ?.label || appointment.paymentMethod}
              </Typography>
            </Box>

            {appointment.paymentReference && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Reference
                </Typography>
                <Typography variant="body1">
                  {appointment.paymentReference}
                </Typography>
              </Box>
            )}

            {appointment.paidAt && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Paid On
                </Typography>
                <Typography variant="body1">
                  {new Date(appointment.paidAt).toLocaleString()}
                </Typography>
              </Box>
            )}

            {appointment.paymentNotes && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body2">
                  {appointment.paymentNotes}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      ) : (
        /* Payment form */
        <Stack spacing={3}>
          {/* Payment Method */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Payment Method
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {PAYMENT_METHODS.map((method) => (
                <Chip
                  key={method.id}
                  label={method.label}
                  icon={method.icon}
                  color={paymentMethod === method.id ? "primary" : "default"}
                  variant={paymentMethod === method.id ? "filled" : "outlined"}
                  onClick={() => setPaymentMethod(method.id)}
                  sx={{ cursor: "pointer" }}
                />
              ))}
            </Box>
          </Box>

          <Divider />

          {/* Payment Amount */}
          <TextField
            label="Amount"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            fullWidth
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
            helperText={
              appointment.serviceTypePrice
                ? `Standard price: $${appointment.serviceTypePrice.toFixed(2)}`
                : undefined
            }
          />

          {/* Reference Number */}
          <TextField
            label="Reference / Receipt Number"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            fullWidth
            placeholder="e.g., INV-001234"
          />

          {/* Notes */}
          <TextField
            label="Notes"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="Any additional payment notes..."
          />
        </Stack>
      )}
    </FormDialog>
  );
}
