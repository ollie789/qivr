import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Activity,
  DollarSign,
  AlertCircle,
  Clock,
  BarChart,
  PieChart
} from 'lucide-react';

interface ClinicDashboardData {
  clinic: {
    name: string;
    id: string;
    totalPatients: number;
    totalProviders: number;
  };
  todayStats: {
    scheduledAppointments: number;
    completedAppointments: number;
    pendingPROMs: number;
    newPatients: number;
  };
  appointments: AppointmentData[];
  proms: PromData[];
  alerts: AlertData[];
  analytics: {
    appointmentTrend: TrendData[];
    promCompletionRate: number;
    patientSatisfaction: number;
    revenueThisMonth: number;
  };
}

interface AppointmentData {
  id: string;
  time: string;
  patientName: string;
  providerName: string;
  type: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'no-show';
}

interface PromData {
  id: string;
  patientName: string;
  promName: string;
  dueDate: Date;
  status: 'pending' | 'completed' | 'overdue';
  score?: number;
}

interface AlertData {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

interface TrendData {
  date: string;
  value: number;
}

const ClinicDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<ClinicDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'appointments' | 'proms' | 'analytics'>('overview');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setDashboardData({
        clinic: {
          name: 'Springfield Medical Center',
          id: 'clinic-001',
          totalPatients: 1250,
          totalProviders: 15
        },
        todayStats: {
          scheduledAppointments: 42,
          completedAppointments: 28,
          pendingPROMs: 18,
          newPatients: 3
        },
        appointments: [
          {
            id: '1',
            time: '09:00 AM',
            patientName: 'John Doe',
            providerName: 'Dr. Smith',
            type: 'Follow-up',
            status: 'completed'
          },
          {
            id: '2',
            time: '10:00 AM',
            patientName: 'Jane Smith',
            providerName: 'Dr. Johnson',
            type: 'New Patient',
            status: 'in-progress'
          },
          {
            id: '3',
            time: '11:00 AM',
            patientName: 'Bob Wilson',
            providerName: 'Dr. Smith',
            type: 'Routine Check',
            status: 'scheduled'
          }
        ],
        proms: [
          {
            id: '1',
            patientName: 'Alice Brown',
            promName: 'PHQ-9',
            dueDate: new Date(2024, 1, 18),
            status: 'overdue'
          },
          {
            id: '2',
            patientName: 'Charlie Davis',
            promName: 'GAD-7',
            dueDate: new Date(2024, 1, 20),
            status: 'pending'
          }
        ],
        alerts: [
          {
            id: '1',
            type: 'warning',
            message: '3 patients have overdue PROMs',
            timestamp: new Date()
          },
          {
            id: '2',
            type: 'info',
            message: 'Monthly reports are ready for review',
            timestamp: new Date()
          }
        ],
        analytics: {
          appointmentTrend: [
            { date: 'Mon', value: 45 },
            { date: 'Tue', value: 52 },
            { date: 'Wed', value: 48 },
            { date: 'Thu', value: 58 },
            { date: 'Fri', value: 42 },
          ],
          promCompletionRate: 78,
          patientSatisfaction: 4.6,
          revenueThisMonth: 125000
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
          <p className="mt-4 text-gray-600">Loading clinic dashboard...</p>
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
          {dashboardData.clinic.name} Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          {format(new Date(), 'EEEE, MMMM dd, yyyy')}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        {(['overview', 'appointments', 'proms', 'analytics'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setSelectedView(view)}
            className={`px-4 py-2 pb-3 text-sm font-medium capitalize ${
              selectedView === view
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Overview View */}
      {selectedView === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<Calendar className="h-6 w-6" />}
              title="Today's Appointments"
              value={dashboardData.todayStats.scheduledAppointments.toString()}
              subtitle={`${dashboardData.todayStats.completedAppointments} completed`}
              color="blue"
            />
            <StatCard
              icon={<FileText className="h-6 w-6" />}
              title="Pending PROMs"
              value={dashboardData.todayStats.pendingPROMs.toString()}
              subtitle="Awaiting completion"
              color="yellow"
            />
            <StatCard
              icon={<Users className="h-6 w-6" />}
              title="New Patients"
              value={dashboardData.todayStats.newPatients.toString()}
              subtitle="Today"
              color="green"
            />
            <StatCard
              icon={<DollarSign className="h-6 w-6" />}
              title="Revenue MTD"
              value={`$${(dashboardData.analytics.revenueThisMonth / 1000).toFixed(0)}k`}
              subtitle="+12% from last month"
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Schedule */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View Full Schedule
                  </button>
                </div>
                <div className="space-y-3">
                  {dashboardData.appointments.slice(0, 5).map(apt => (
                    <AppointmentItem key={apt.id} appointment={apt} />
                  ))}
                </div>
              </div>

              {/* Weekly Appointment Trend */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Appointments</h2>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {dashboardData.analytics.appointmentTrend.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${(data.value / 60) * 100}%` }}
                      ></div>
                      <span className="text-xs text-gray-600 mt-2">{data.date}</span>
                      <span className="text-xs font-medium">{data.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Alerts */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Alerts</h2>
                <div className="space-y-3">
                  {dashboardData.alerts.map(alert => (
                    <AlertItem key={alert.id} alert={alert} />
                  ))}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Metrics</h2>
                <div className="space-y-4">
                  <MetricDisplay
                    label="PROM Completion Rate"
                    value={`${dashboardData.analytics.promCompletionRate}%`}
                    type="percentage"
                  />
                  <MetricDisplay
                    label="Patient Satisfaction"
                    value={`${dashboardData.analytics.patientSatisfaction}/5.0`}
                    type="rating"
                  />
                  <MetricDisplay
                    label="Active Patients"
                    value={dashboardData.clinic.totalPatients.toString()}
                    type="number"
                  />
                  <MetricDisplay
                    label="Provider Utilization"
                    value="85%"
                    type="percentage"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Appointments View */}
      {selectedView === 'appointments' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Appointment Management</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.appointments.map(apt => (
                  <tr key={apt.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {apt.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {apt.patientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {apt.providerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {apt.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={apt.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                      <button className="text-gray-600 hover:text-gray-900">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROMs View */}
      {selectedView === 'proms' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">PROM Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.proms.map(prom => (
              <PromCard key={prom.id} prom={prom} />
            ))}
          </div>
        </div>
      )}

      {/* Analytics View */}
      {selectedView === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
            <div className="space-y-4">
              <AnalyticsMetric label="Total Appointments This Month" value="850" change="+12%" />
              <AnalyticsMetric label="Average Wait Time" value="14 min" change="-3 min" />
              <AnalyticsMetric label="No-Show Rate" value="3.5%" change="-0.5%" />
              <AnalyticsMetric label="Patient Retention" value="92%" change="+2%" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
            <div className="space-y-4">
              <AnalyticsMetric label="Revenue This Month" value="$125,000" change="+15%" />
              <AnalyticsMetric label="Collections Rate" value="78%" change="+5%" />
              <AnalyticsMetric label="Outstanding Balance" value="$27,500" change="-$2,000" />
              <AnalyticsMetric label="Average Revenue per Patient" value="$275" change="+$25" />
            </div>
          </div>
        </div>
      )}
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

const AppointmentItem: React.FC<{ appointment: AppointmentData }> = ({ appointment }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
    <div className="flex items-center space-x-4">
      <span className="text-sm font-medium text-gray-900">{appointment.time}</span>
      <div>
        <p className="text-sm font-medium text-gray-900">{appointment.patientName}</p>
        <p className="text-xs text-gray-600">{appointment.type} with {appointment.providerName}</p>
      </div>
    </div>
    <StatusBadge status={appointment.status} />
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusColors = {
    'scheduled': 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800',
    'no-show': 'bg-red-100 text-red-800',
    'pending': 'bg-gray-100 text-gray-800',
    'overdue': 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace('-', ' ')}
    </span>
  );
};

const AlertItem: React.FC<{ alert: AlertData }> = ({ alert }) => {
  const alertIcons = {
    critical: <AlertCircle className="h-4 w-4 text-red-600" />,
    warning: <AlertCircle className="h-4 w-4 text-yellow-600" />,
    info: <AlertCircle className="h-4 w-4 text-blue-600" />
  };

  return (
    <div className="flex items-start space-x-3">
      {alertIcons[alert.type]}
      <div className="flex-1">
        <p className="text-sm text-gray-900">{alert.message}</p>
        <p className="text-xs text-gray-500 mt-1">
          {format(alert.timestamp, 'h:mm a')}
        </p>
      </div>
    </div>
  );
};

const MetricDisplay: React.FC<{ label: string; value: string; type: string }> = ({ label, value, type }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
);

const PromCard: React.FC<{ prom: PromData }> = ({ prom }) => (
  <div className="border border-gray-200 rounded-lg p-4">
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-medium text-gray-900">{prom.patientName}</h4>
      <StatusBadge status={prom.status} />
    </div>
    <p className="text-sm text-gray-600">{prom.promName}</p>
    <p className="text-xs text-gray-500 mt-2">
      Due: {format(prom.dueDate, 'MMM dd, yyyy')}
    </p>
    <button className="mt-3 w-full px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
      Send Reminder
    </button>
  </div>
);

const AnalyticsMetric: React.FC<{ label: string; value: string; change: string }> = ({ label, value, change }) => {
  const isPositive = change.startsWith('+') || change.startsWith('-$');
  
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
      <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {change}
      </span>
    </div>
  );
};

export default ClinicDashboard;
