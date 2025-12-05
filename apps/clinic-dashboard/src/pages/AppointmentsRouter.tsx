/**
 * AppointmentsRouter - Routes to appropriate appointments view based on user role
 * Currently all users see the same calendar-focused view
 */

import Appointments from "./Appointments";

export default function AppointmentsRouter() {
  return <Appointments />;
}
