import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material";

// Mock appointment card component for testing patterns
interface Appointment {
  id: string;
  patientName: string;
  time: string;
  type: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  provider?: string;
}

const AppointmentCard = ({
  appointment,
  onStatusChange,
  onEdit,
  onCancel,
}: {
  appointment: Appointment;
  onStatusChange?: (id: string, status: string) => void;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
}) => {
  const statusColors: Record<string, string> = {
    scheduled: "#2196f3",
    confirmed: "#4caf50",
    completed: "#9e9e9e",
    cancelled: "#f44336",
    "no-show": "#ff9800",
  };

  return (
    <div data-testid="appointment-card" style={{ border: `2px solid ${statusColors[appointment.status]}` }}>
      <h3 data-testid="patient-name">{appointment.patientName}</h3>
      <p data-testid="appointment-time">{appointment.time}</p>
      <p data-testid="appointment-type">{appointment.type}</p>
      <span data-testid="appointment-status">{appointment.status}</span>
      {appointment.provider && <p data-testid="provider">{appointment.provider}</p>}

      <div>
        {appointment.status === "scheduled" && (
          <button onClick={() => onStatusChange?.(appointment.id, "confirmed")} data-testid="confirm-btn">
            Confirm
          </button>
        )}
        {appointment.status === "confirmed" && (
          <button onClick={() => onStatusChange?.(appointment.id, "completed")} data-testid="complete-btn">
            Complete
          </button>
        )}
        {["scheduled", "confirmed"].includes(appointment.status) && (
          <>
            <button onClick={() => onEdit?.(appointment.id)} data-testid="edit-btn">
              Edit
            </button>
            <button onClick={() => onCancel?.(appointment.id)} data-testid="cancel-btn">
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("AppointmentCard", () => {
  const mockAppointment: Appointment = {
    id: "apt-1",
    patientName: "John Doe",
    time: "10:00 AM",
    type: "Initial Evaluation",
    status: "scheduled",
    provider: "Dr. Smith",
  };

  it("renders appointment details", () => {
    renderWithTheme(<AppointmentCard appointment={mockAppointment} />);

    expect(screen.getByTestId("patient-name")).toHaveTextContent("John Doe");
    expect(screen.getByTestId("appointment-time")).toHaveTextContent("10:00 AM");
    expect(screen.getByTestId("appointment-type")).toHaveTextContent("Initial Evaluation");
    expect(screen.getByTestId("appointment-status")).toHaveTextContent("scheduled");
    expect(screen.getByTestId("provider")).toHaveTextContent("Dr. Smith");
  });

  it("shows confirm button for scheduled appointments", () => {
    renderWithTheme(<AppointmentCard appointment={mockAppointment} />);

    expect(screen.getByTestId("confirm-btn")).toBeInTheDocument();
  });

  it("calls onStatusChange when confirming", async () => {
    const onStatusChange = vi.fn();
    const user = userEvent.setup();

    renderWithTheme(<AppointmentCard appointment={mockAppointment} onStatusChange={onStatusChange} />);

    await user.click(screen.getByTestId("confirm-btn"));

    expect(onStatusChange).toHaveBeenCalledWith("apt-1", "confirmed");
  });

  it("shows complete button for confirmed appointments", () => {
    const confirmedAppointment = { ...mockAppointment, status: "confirmed" as const };

    renderWithTheme(<AppointmentCard appointment={confirmedAppointment} />);

    expect(screen.getByTestId("complete-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("confirm-btn")).not.toBeInTheDocument();
  });

  it("hides action buttons for completed appointments", () => {
    const completedAppointment = { ...mockAppointment, status: "completed" as const };

    renderWithTheme(<AppointmentCard appointment={completedAppointment} />);

    expect(screen.queryByTestId("confirm-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("complete-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("cancel-btn")).not.toBeInTheDocument();
  });

  it("calls onEdit when edit button clicked", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    renderWithTheme(<AppointmentCard appointment={mockAppointment} onEdit={onEdit} />);

    await user.click(screen.getByTestId("edit-btn"));

    expect(onEdit).toHaveBeenCalledWith("apt-1");
  });

  it("calls onCancel when cancel button clicked", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    renderWithTheme(<AppointmentCard appointment={mockAppointment} onCancel={onCancel} />);

    await user.click(screen.getByTestId("cancel-btn"));

    expect(onCancel).toHaveBeenCalledWith("apt-1");
  });

  it("renders without provider", () => {
    const appointmentWithoutProvider = { ...mockAppointment, provider: undefined };

    renderWithTheme(<AppointmentCard appointment={appointmentWithoutProvider} />);

    expect(screen.queryByTestId("provider")).not.toBeInTheDocument();
  });

  it("handles no-show status", () => {
    const noShowAppointment = { ...mockAppointment, status: "no-show" as const };

    renderWithTheme(<AppointmentCard appointment={noShowAppointment} />);

    expect(screen.getByTestId("appointment-status")).toHaveTextContent("no-show");
    expect(screen.queryByTestId("edit-btn")).not.toBeInTheDocument();
  });
});

describe("AppointmentCard edge cases", () => {
  it("handles empty patient name", () => {
    const appointment: Appointment = {
      id: "apt-1",
      patientName: "",
      time: "10:00 AM",
      type: "Follow-up",
      status: "scheduled",
    };

    renderWithTheme(<AppointmentCard appointment={appointment} />);

    expect(screen.getByTestId("patient-name")).toHaveTextContent("");
  });

  it("handles special characters in patient name", () => {
    const appointment: Appointment = {
      id: "apt-1",
      patientName: "José García-López",
      time: "10:00 AM",
      type: "Follow-up",
      status: "scheduled",
    };

    renderWithTheme(<AppointmentCard appointment={appointment} />);

    expect(screen.getByTestId("patient-name")).toHaveTextContent("José García-López");
  });

  it("handles long appointment type", () => {
    const appointment: Appointment = {
      id: "apt-1",
      patientName: "John Doe",
      time: "10:00 AM",
      type: "Comprehensive Initial Evaluation with Full Assessment and Treatment Planning Session",
      status: "scheduled",
    };

    renderWithTheme(<AppointmentCard appointment={appointment} />);

    expect(screen.getByTestId("appointment-type")).toHaveTextContent(
      "Comprehensive Initial Evaluation with Full Assessment and Treatment Planning Session"
    );
  });
});
