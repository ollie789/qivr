/**
 * AppointmentsRouter - Single unified appointments view
 * All roles use the same Appointments page with:
 * - Practitioners auto-filtered to their own appointments
 * - Admins/managers see all with provider filter dropdown
 */

import Appointments from "./Appointments";

export default function AppointmentsRouter() {
  return <Appointments />;
}
