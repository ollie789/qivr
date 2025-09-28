import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import PromsPage from '../PromsPage';
import type { PromAnswerValue } from '../../../../types';
import { vi } from 'vitest';

vi.mock('../../hooks/usePromDashboardData', () => ({
  usePromDashboardData: () => ({
    pendingProms: [
      {
        id: 'prom-1',
        templateId: 'tpl-1',
        templateName: 'Post-Op Check-in',
        status: 'pending',
        assignedDate: '2025-01-10T00:00:00Z',
        dueDate: '2025-01-15T00:00:00Z',
        responses: { pain: 2 as PromAnswerValue },
      },
    ],
    promHistory: [
      {
        id: 'history-1',
        templateName: 'Baseline Intake',
        completedDate: '2024-12-30T00:00:00Z',
        score: 12,
        maxScore: 20,
        percentageScore: 60,
      },
    ],
    promStats: {
      totalAssigned: 3,
      completed: 1,
      pending: 2,
      averageScore: 72.5,
      completionRate: 50,
      streak: 2,
      lastCompleted: '2024-12-30T00:00:00Z',
      nextDue: '2025-01-15T00:00:00Z',
    },
    pendingLoading: false,
    historyLoading: false,
    statsLoading: false,
    submit: vi.fn(),
    submitting: false,
    saveDraft: vi.fn(),
  }),
}));

const renderPromsPage = () => {
  render(
    <MemoryRouter>
      <SnackbarProvider>
        <PromsPage />
      </SnackbarProvider>
    </MemoryRouter>,
  );
};

describe('PromsPage smoke test', () => {
  it('renders pending list, history, and stats from /api/v1/proms data', () => {
    renderPromsPage();

    expect(screen.getByText('Patient Reported Outcomes')).toBeInTheDocument();

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/Next due/i)).toBeInTheDocument();

    const startButton = screen.getByRole('button', { name: /Start/i });
    expect(startButton).toBeInTheDocument();
    expect(screen.getByText('Post-Op Check-in')).toBeInTheDocument();

    expect(screen.getByText(/Recent Completions/)).toBeInTheDocument();
    expect(screen.getByText(/Baseline Intake/)).toBeInTheDocument();
  });
});
