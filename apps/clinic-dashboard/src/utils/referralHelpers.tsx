import React from "react";
import {
  Send as SendIcon,
  LocalHospital as HospitalIcon,
  Science as ScienceIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

/**
 * Returns the appropriate icon for a referral type
 */
export const getTypeIcon = (type: string): React.ReactElement => {
  switch (type) {
    case "Imaging":
    case "Laboratory":
      return <ScienceIcon />;
    case "Specialist":
    case "Hospital":
      return <HospitalIcon />;
    default:
      return <SendIcon />;
  }
};

/**
 * Returns the appropriate icon for a referral status
 */
export const getStatusIcon = (status: string): React.ReactElement | null => {
  switch (status) {
    case "Scheduled":
      return <ScheduleIcon fontSize="small" />;
    case "Completed":
    case "ResultsReceived":
    case "Closed":
      return <CheckIcon fontSize="small" />;
    case "Cancelled":
    case "Expired":
      return <WarningIcon fontSize="small" />;
    default:
      return null;
  }
};

export type ChipColor =
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning";

/**
 * Returns the MUI Chip color for a referral priority
 */
export const getPriorityColor = (priority: string): ChipColor => {
  switch (priority) {
    case "Emergency":
      return "error";
    case "Urgent":
      return "warning";
    case "SemiUrgent":
      return "info";
    case "Routine":
    default:
      return "default";
  }
};

/**
 * Returns the MUI Chip color for a referral status
 */
export const getStatusColor = (status: string): ChipColor => {
  switch (status) {
    case "Completed":
    case "ResultsReceived":
      return "success";
    case "Scheduled":
      return "primary";
    case "Sent":
    case "Acknowledged":
      return "info";
    case "Cancelled":
    case "Expired":
      return "error";
    case "PendingApproval":
      return "warning";
    case "Draft":
    case "Closed":
    default:
      return "default";
  }
};
