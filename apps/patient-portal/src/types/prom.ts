export type PromQuestionType =
  | 'radio'
  | 'checkbox'
  | 'scale'
  | 'rating'
  | 'text'
  | 'date'
  | 'time'
  | 'number'
  | 'slider'
  | 'single-choice'
  | 'multiple-choice'
  | 'boolean';

export type PromAnswerValue = string | number | boolean | string[] | null;

export interface PromQuestion {
  id: string;
  text: string;
  type: PromQuestionType;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  weight?: number;
  helpText?: string;
}

export type PromScoringMethod = 'sum' | 'average' | 'weighted' | 'custom';

export interface PromTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  estimatedTime?: number;
  tags?: string[];
  scoringMethod?: PromScoringMethod;
  questions: PromQuestion[];
}

export type PromInstanceStatus = 'pending' | 'in-progress' | 'completed' | 'expired';

export interface PromInstance {
  id: string;
  templateId: string;
  templateName: string;
  status: PromInstanceStatus;
  assignedDate?: string;
  scheduledFor?: string;
  dueDate?: string;
  startedDate?: string;
  completedDate?: string;
  score?: number;
  totalScore?: number;
  questionCount?: number;
  answeredCount?: number;
  priority?: 'high' | 'medium' | 'low';
  responses?: Record<string, PromAnswerValue>;
  template?: PromTemplate;
}

export interface PromHistoryEntry {
  id: string;
  templateName: string;
  completedDate: string;
  score: number;
  maxScore: number;
  percentageScore: number;
  trend?: 'improving' | 'stable' | 'declining';
}

export interface PromStats {
  totalAssigned: number;
  completed: number;
  pending: number;
  averageScore: number;
  completionRate: number;
  streak: number;
  lastCompleted?: string;
  nextDue?: string;
}

export interface PromSubmitPayload {
  answers: Array<{
    questionId: string;
    value: PromAnswerValue;
  }>;
  completionSeconds: number;
}

export interface PromDraftPayload {
  responses: Record<string, PromAnswerValue>;
  lastQuestionIndex: number;
}
