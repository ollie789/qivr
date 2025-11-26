import { useState } from "react";
import { Box, Typography, Button, Stack, Chip } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { glassCard } from "@qivr/design-system";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";

// Placeholder - replace with actual API call
const mockAppointments = [
  { id: "1", date: new Date(), time: "09:00", patient: "John Doe", type: "Initial Consultation" },
  { id: "2", date: new Date(), time: "14:00", patient: "Jane Smith", type: "Follow-up" },
];

export default function Appointments() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const appointmentsForDate = (date: Date) => {
    return mockAppointments.filter(apt => isSameDay(new Date(apt.date), date));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Appointments
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Appointment
        </Button>
      </Stack>

      <Box sx={{ display: "flex", gap: 3 }}>
        {/* Calendar */}
        <Box sx={{ ...glassCard, p: 3, flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
              Previous
            </Button>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {format(currentDate, "MMMM yyyy")}
            </Typography>
            <Button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
              Next
            </Button>
          </Stack>

          {/* Calendar Grid */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <Box key={day} sx={{ textAlign: "center", fontWeight: 600, py: 1 }}>
                <Typography variant="caption">{day}</Typography>
              </Box>
            ))}
            
            {daysInMonth.map(day => {
              const hasAppointments = appointmentsForDate(day).length > 0;
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);

              return (
                <Box
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  sx={{
                    p: 2,
                    textAlign: "center",
                    cursor: "pointer",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: isSelected ? "primary.main" : "divider",
                    bgcolor: isCurrentDay ? "primary.light" : isSelected ? "primary.50" : "transparent",
                    opacity: isSameMonth(day, currentDate) ? 1 : 0.3,
                    "&:hover": {
                      bgcolor: "action.hover",
                      borderColor: "primary.main",
                    },
                    position: "relative",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: isCurrentDay ? 700 : 400 }}>
                    {format(day, "d")}
                  </Typography>
                  {hasAppointments && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 4,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Appointments List */}
        <Box sx={{ ...glassCard, p: 3, width: 350 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {format(selectedDate, "EEEE, MMMM d")}
          </Typography>

          {appointmentsForDate(selectedDate).length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No appointments scheduled
            </Typography>
          ) : (
            <Stack spacing={2}>
              {appointmentsForDate(selectedDate).map(apt => (
                <Box
                  key={apt.id}
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {apt.time}
                  </Typography>
                  <Typography variant="body2">{apt.patient}</Typography>
                  <Chip label={apt.type} size="small" sx={{ mt: 1 }} />
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
