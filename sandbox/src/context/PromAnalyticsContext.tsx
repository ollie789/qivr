import React, { createContext, useContext, useMemo, useState } from 'react';
import { addDays, formatISO } from 'date-fns';
import {
  patientPromHistory,
  patientPromInstances,
  patientPromTemplates,
  calculatePatientPromStats,
  type PatientPromAnswerValue,
  type PatientPromHistoryEntry,
  type PatientPromInstance,
  type PatientPromStats,
  type PatientPromTemplate,
} from '../data/patientPromMockData';
import { promPatients } from '../data/promMockData';

interface CompleteResult {
  templateName: string;
  score: number;
}

interface PromAnalyticsContextValue {
  instances: PatientPromInstance[];
  history: PatientPromHistoryEntry[];
  templates: PatientPromTemplate[];
  stats: PatientPromStats;
  bookings: PromBooking[];
  completeInstance: (instanceId: string, responses: Record<string, PatientPromAnswerValue>) => CompleteResult | null;
  setInstanceStatus: (
    instanceId: string,
    status: PatientPromInstance['status'],
    patch?: Partial<PatientPromInstance>,
  ) => void;
  findTemplateById: (templateId: string) => PatientPromTemplate | undefined;
  assignProm: (input: AssignPromInput) => AssignPromResult | null;
}

const PromAnalyticsContext = createContext<PromAnalyticsContextValue | undefined>(undefined);

const computeScoreFromResponses = (
  template: PatientPromTemplate,
  responses: Record<string, PatientPromAnswerValue>,
): number => {
  const numericQuestions = template.questions.filter((question) =>
    question.type === 'slider' || question.type === 'number',
  );

  if (numericQuestions.length === 0) {
    return 85;
  }

  let achieved = 0;
  let possible = 0;

  numericQuestions.forEach((question) => {
    const max = question.max ?? (question.type === 'number' ? 10 : 10);
    possible += max;

    const value = responses[question.id];
    if (typeof value === 'number') {
      achieved += value;
    } else if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      if (!Number.isNaN(parsed)) {
        achieved += parsed;
      }
    }
  });

  if (possible === 0) {
    return 85;
  }

  const percentage = Math.round((achieved / possible) * 100);
  return Math.min(100, Math.max(60, percentage));
};

export interface PromBooking {
  id: string;
  instanceId: string;
  templateId: string;
  templateName: string;
  patientId: string;
  patientName: string;
  scheduledFor: string;
  scheduleType: 'immediate' | 'scheduled' | 'recurring';
  status: 'scheduled' | 'sent' | 'completed';
  createdAt: string;
}

interface AssignPromInput {
  templateId: string;
  patientId: string;
  scheduleType: 'immediate' | 'scheduled' | 'recurring';
  scheduledFor?: Date | null;
  dueDate?: Date | null;
  notes?: string;
}

interface AssignPromResult {
  instance: PatientPromInstance;
  booking: PromBooking;
}

interface PromAnalyticsProviderProps {
  children: React.ReactNode;
}

export const PromAnalyticsProvider: React.FC<PromAnalyticsProviderProps> = ({ children }) => {
  const [templates] = useState(patientPromTemplates);
  const [instances, setInstances] = useState<PatientPromInstance[]>(patientPromInstances);
  const [history, setHistory] = useState<PatientPromHistoryEntry[]>(patientPromHistory);
  const [bookings, setBookings] = useState<PromBooking[]>(() =>
    patientPromInstances
      .filter((instance) => instance.status === 'pending' || instance.status === 'in-progress')
      .map((instance) => {
        const patient = promPatients.find((p) => p.id === instance.patientId);
        return {
          id: `booking-${instance.id}`,
          instanceId: instance.id,
          templateId: instance.templateId,
          templateName: instance.templateName,
          patientId: patient?.id ?? 'patient-unknown',
          patientName: patient?.name ?? 'Patient',
          scheduledFor: instance.dueDate ?? instance.assignedDate,
          scheduleType: 'scheduled' as const,
          status: instance.status === 'in-progress' ? 'sent' : 'scheduled',
          createdAt: instance.assignedDate,
        };
      })
  );

  const stats = useMemo(() => calculatePatientPromStats(instances), [instances]);

  const findTemplateById = (templateId: string) => templates.find((template) => template.id === templateId);

  const assignProm = ({
    templateId,
    patientId,
    scheduleType,
    scheduledFor,
    dueDate,
  }: AssignPromInput): AssignPromResult | null => {
    const template = findTemplateById(templateId);
    const patient = promPatients.find((item) => item.id === patientId);

    if (!template || !patient) {
      return null;
    }

    const now = new Date();
    const scheduled = scheduledFor ?? now;
    const due = dueDate ?? addDays(scheduled, 7);

    const newInstance: PatientPromInstance = {
      id: `instance-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      templateId: template.id,
      templateName: template.name,
      status: 'pending',
      assignedDate: formatISO(now),
      dueDate: formatISO(due),
      priority: 'medium',
      progress: 0,
      patientId: patient.id,
      patientName: patient.name,
    };

    const newBooking: PromBooking = {
      id: `booking-${Date.now()}-${patient.id}`,
      instanceId: newInstance.id,
      templateId: template.id,
      templateName: template.name,
      patientId: patient.id,
      patientName: patient.name,
      scheduledFor: formatISO(scheduled),
      scheduleType,
      status: scheduleType === 'immediate' ? 'sent' : 'scheduled',
      createdAt: formatISO(now),
    };

    setInstances((prev) => [newInstance, ...prev]);
    setBookings((prev) => [newBooking, ...prev]);

    return { instance: newInstance, booking: newBooking };
  };

  const completeInstance = (
    instanceId: string,
    responses: Record<string, PatientPromAnswerValue>,
  ): CompleteResult | null => {
    const instance = instances.find((item) => item.id === instanceId);
    if (!instance) {
      return null;
    }

    const template = findTemplateById(instance.templateId);
    if (!template) {
      return null;
    }

    const completedAt = new Date();
    const score = computeScoreFromResponses(template, responses);

    setInstances((prev) =>
      prev.map((item) =>
        item.id === instanceId
          ? {
              ...item,
              status: 'completed',
              completedDate: completedAt.toISOString(),
              progress: 100,
              score,
              responses,
            }
          : item,
      ),
    );

    setBookings((prev) =>
      prev.map((booking) =>
        booking.instanceId === instanceId
          ? {
              ...booking,
              status: 'completed',
            }
          : booking,
      ),
    );

    setHistory((prev) => [
      {
        id: `history-${Date.now()}`,
        templateName: template.name,
        completedDate: completedAt.toISOString(),
        score,
        percentageScore: score,
        trend: score >= 85 ? 'improving' : score >= 70 ? 'stable' : 'declining',
      },
      ...prev,
    ]);

    return { templateName: template.name, score };
  };

  const setInstanceStatus = (
    instanceId: string,
    status: PatientPromInstance['status'],
    patch?: Partial<PatientPromInstance>,
  ) => {
    setInstances((prev) =>
      prev.map((item) =>
        item.id === instanceId
          ? {
              ...item,
              status,
              ...(patch ?? {}),
            }
          : item,
      ),
    );

    if (status === 'in-progress') {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.instanceId === instanceId
            ? {
                ...booking,
                status: 'sent',
              }
            : booking,
        ),
      );
    }
  };

  const value: PromAnalyticsContextValue = {
    instances,
    history,
    templates,
    stats,
    bookings,
    completeInstance,
    setInstanceStatus,
    findTemplateById,
    assignProm,
  };

  return <PromAnalyticsContext.Provider value={value}>{children}</PromAnalyticsContext.Provider>;
};

export const usePromAnalytics = (): PromAnalyticsContextValue => {
  const context = useContext(PromAnalyticsContext);
  if (!context) {
    throw new Error('usePromAnalytics must be used within a PromAnalyticsProvider');
  }
  return context;
};
