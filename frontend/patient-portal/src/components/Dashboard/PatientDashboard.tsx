import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  Activity,
  FileText,
  Heart,
  Bell,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';

interface DashboardData {
  patient: {
    name: string;
    age: number;
    mrn: string;
    lastVisit?: Date;
    nextAppointment?: Date;
  };
  appointments: {
    upcoming: AppointmentInfo[];
    recent: AppointmentInfo[];
  };
  proms: {
    pending: PromInfo[];
    completed: PromInfo[];
  };
  vitals: VitalSigns;
  notifications: NotificationInfo[];
  metrics: HealthMetrics;
}

interface AppointmentInfo {
  id: string;
  date: Date;
  time: string;
  provider: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

interface PromInfo {
  id: string;
  name: string;
  dueDate?: Date;
  completedDate?: Date;
  score?: number;
  status: 'pending' | 'completed' | 'overdue';
}

interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  weight?: number;
  temperature?: number;
  lastUpdated?: Date;
}

interface NotificationInfo {
  id: string;
  type: 'appointment' | 'prom' | 'message' | 'alert';
  title: string;
  message: string;
  date: Date;
  isRead: boolean;
}

interface HealthMetrics {
  complianceRate: number;
  promCompletionRate: number;
  appointmentAttendanceRate: number;
  healthScore: number;
}

const PatientDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setDashboardData({
        patient: {
          name: 'John Doe',
          age: 45,
          mrn: 'MRN-2024-0001',
          lastVisit: new Date(2024, 0, 15),
          nextAppointment: new Date(2024, 1, 20)
        },
        appointments: {
          upcoming: [
            {
              id: '1',
              date: new Date(2024, 1, 20),
              time: '10:00 AM',
              provider: 'Dr. Smith',
              type: 'Follow-up',
              status: 'confirmed'
            }
          ],
          recent: [
            {
              id: '2',
              date: new Date(2024, 0, 15),
              time: '2:00 PM',
              provider: 'Dr. Johnson',
              type: 'Routine Check',
              status: 'completed'
            }
          ]
        },
        proms: {
          pending: [
            {
              id: '1',
              name: 'PHQ-9 Depression Screen',
              dueDate: new Date(2024, 1, 18),
              status: 'pending'
            }
          ],
          completed: [
            {
              id: '2',
              name: 'GAD-7 Anxiety',
              completedDate: new Date(2024, 0, 10),
              score: 5,
              status: 'completed'
            }
          ]
        },
        vitals: {
          bloodPressure: '120/80',
          heartRate: 72,
          weight: 180,
          temperature: 98.6,
          lastUpdated: new Date(2024, 0, 15)
        },
        notifications: [
          {
            id: '1',
            type: 'appointment',
            title: 'Appointment Reminder',
            message: 'Your appointment with Dr. Smith is tomorrow at 10:00 AM',
            date: new Date(),
            isRead: false
          }
        ],
        metrics: {
          complianceRate: 92,
          promCompletionRate: 85,
          appointmentAttendanceRate: 95,
          healthScore: 88
        }
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div>Error loading dashboard</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {dashboardData.patient.name}
        </h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of your health journey
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Calendar className="h-6 w-6" />}
          title="Next Appointment"
          value={dashboardData.patient.nextAppointment 
            ? format(dashboardData.patient.nextAppointment, 'MMM dd, yyyy')
            : 'None scheduled'}
          subtitle="with Dr. Smith"
          color="blue"
        />
        <StatCard
          icon={<FileText className="h-6 w-6" />}
          title="Pending PROMs"
          value={dashboardData.proms.pending.length.toString()}
          subtitle="Due this week"
          color="yellow"
        />
        <StatCard
          icon={<Heart className="h-6 w-6" />}
          title="Health Score"
          value={`${dashboardData.metrics.healthScore}%`}
          subtitle="Good"
          color="green"
        />
        <StatCard
          icon={<Bell className="h-6 w-6" />}
          title="Notifications"
          value={dashboardData.notifications.filter(n => !n.isRead).length.toString()}
          subtitle="Unread"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointments Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Appointments</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {dashboardData.appointments.upcoming.map(apt => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
              {dashboardData.appointments.upcoming.length === 0 && (
                <p className="text-gray-500">No upcoming appointments</p>
              )}
            </div>
          </div>

          {/* PROMs Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Health Assessments (PROMs)</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {dashboardData.proms.pending.map(prom => (
                <PromCard key={prom.id} prom={prom} />
              ))}
              {dashboardData.proms.pending.length === 0 && (
                <p className="text-gray-500">No pending assessments</p>
              )}
            </div>
          </div>

          {/* Health Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Health Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <MetricItem
                label="Compliance Rate"
                value={`${dashboardData.metrics.complianceRate}%`}
                trend="up"
              />
              <MetricItem
                label="PROM Completion"
                value={`${dashboardData.metrics.promCompletionRate}%`}
                trend="stable"
              />
              <MetricItem
                label="Appointment Attendance"
                value={`${dashboardData.metrics.appointmentAttendanceRate}%`}
                trend="up"
              />
              <MetricItem
                label="Overall Health Score"
                value={`${dashboardData.metrics.healthScore}%`}
                trend="up"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vital Signs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Vitals</h2>
            <div className="space-y-3">
              <VitalItem label="Blood Pressure" value={dashboardData.vitals.bloodPressure || 'N/A'} />
              <VitalItem label="Heart Rate" value={`${dashboardData.vitals.heartRate || 'N/A'} bpm`} />
              <VitalItem label="Weight" value={`${dashboardData.vitals.weight || 'N/A'} lbs`} />
              <VitalItem label="Temperature" value={`${dashboardData.vitals.temperature || 'N/A'}°F`} />
            </div>
            {dashboardData.vitals.lastUpdated && (
              <p className="text-xs text-gray-500 mt-4">
                Last updated: {format(dashboardData.vitals.lastUpdated, 'MMM dd, yyyy')}
              </p>
            )}
          </div>

          {/* Recent Notifications */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
            <div className="space-y-3">
              {dashboardData.notifications.slice(0, 3).map(notif => (
                <NotificationItem key={notif.id} notification={notif} />
              ))}
              {dashboardData.notifications.length === 0 && (
                <p className="text-gray-500 text-sm">No new notifications</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component helpers
const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}> = ({ icon, title, value, subtitle, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color]} mb-4`}>
        {icon}
      </div>
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
};

const AppointmentCard: React.FC<{ appointment: AppointmentInfo }> = ({ appointment }) => (
  <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
    <div className="flex items-start justify-between">
      <div>
        <p className="font-medium text-gray-900">{appointment.type}</p>
        <p className="text-sm text-gray-600 mt-1">with {appointment.provider}</p>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(appointment.date, 'MMM dd, yyyy')}
          </span>
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {appointment.time}
          </span>
        </div>
      </div>
      <span className={`px-2 py-1 text-xs font-medium rounded-full
        ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
        ${appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : ''}
        ${appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
        ${appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
      `}>
        {appointment.status}
      </span>
    </div>
  </div>
);

const PromCard: React.FC<{ prom: PromInfo }> = ({ prom }) => (
  <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
    <div className="flex items-start justify-between">
      <div>
        <p className="font-medium text-gray-900">{prom.name}</p>
        {prom.dueDate && (
          <p className="text-sm text-gray-600 mt-1">
            Due: {format(prom.dueDate, 'MMM dd, yyyy')}
          </p>
        )}
      </div>
      <button className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
        Complete
      </button>
    </div>
  </div>
);

const VitalItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

const MetricItem: React.FC<{ label: string; value: string; trend: 'up' | 'down' | 'stable' }> = 
  ({ label, value, trend }) => (
  <div className="p-3 bg-gray-50 rounded-lg">
    <p className="text-sm text-gray-600">{label}</p>
    <div className="flex items-center gap-2 mt-1">
      <span className="text-lg font-semibold text-gray-900">{value}</span>
      {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
      {trend === 'down' && <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />}
    </div>
  </div>
);

const NotificationItem: React.FC<{ notification: NotificationInfo }> = ({ notification }) => {
  const icons = {
    appointment: <Calendar className="h-4 w-4" />,
    prom: <FileText className="h-4 w-4" />,
    message: <Bell className="h-4 w-4" />,
    alert: <AlertCircle className="h-4 w-4" />
  };

  return (
    <div className={`p-3 rounded-lg ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50'}`}>
      <div className="flex items-start gap-3">
        <div className="text-gray-600 mt-0.5">
          {icons[notification.type]}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
