/**
 * Evidence-based recovery trajectory benchmarks for common MSK conditions
 */

export interface RecoveryCurvePoint {
  week: number;
  painReduction: number; // 0-100 percentage
}

export interface RecoveryBenchmark {
  name: string;
  description: string;
  curve: RecoveryCurvePoint[];
  minWeeks: number;
  maxWeeks: number;
  references: string;
}

export const RECOVERY_BENCHMARKS: Record<string, RecoveryBenchmark> = {
  acute_low_back_pain: {
    name: 'Acute Non-Specific Low Back Pain',
    description:
      'Typical improvement is front-loaded; ~80% recover within 6-12 weeks under guideline-concordant conservative care',
    curve: [
      { week: 0, painReduction: 0 },
      { week: 2, painReduction: 30 },
      { week: 4, painReduction: 50 },
      { week: 6, painReduction: 65 },
      { week: 8, painReduction: 75 },
      { week: 12, painReduction: 80 },
      { week: 16, painReduction: 85 },
    ],
    minWeeks: 6,
    maxWeeks: 12,
    references: 'Primary care guidelines',
  },

  lumbar_radicular_pain: {
    name: 'Lumbar Radicular Pain (Disc Herniation)',
    description:
      'Majority improve within 4-6 weeks; natural history is favourable without intervention for many patients',
    curve: [
      { week: 0, painReduction: 0 },
      { week: 2, painReduction: 25 },
      { week: 4, painReduction: 50 },
      { week: 6, painReduction: 70 },
      { week: 8, painReduction: 80 },
      { week: 12, painReduction: 85 },
    ],
    minWeeks: 4,
    maxWeeks: 6,
    references: 'Conservative care evidence',
  },

  knee_oa_exercise: {
    name: 'Knee Osteoarthritis - Exercise/Physical Therapy',
    description:
      'Clinically meaningful pain reductions typically occur over 6-18 weeks of structured exercise therapy',
    curve: [
      { week: 0, painReduction: 0 },
      { week: 3, painReduction: 10 },
      { week: 6, painReduction: 25 },
      { week: 9, painReduction: 40 },
      { week: 12, painReduction: 55 },
      { week: 18, painReduction: 70 },
      { week: 24, painReduction: 65 },
      { week: 52, painReduction: 50 },
    ],
    minWeeks: 6,
    maxWeeks: 18,
    references: 'Structured exercise therapy studies',
  },

  knee_oa_injection: {
    name: 'Knee Osteoarthritis - Corticosteroid Injection',
    description:
      'Predominantly short-term relief; high-quality reviews characterise benefit as up to ~4-6 weeks (short-term only)',
    curve: [
      { week: 0, painReduction: 0 },
      { week: 1, painReduction: 50 },
      { week: 2, painReduction: 60 },
      { week: 4, painReduction: 50 },
      { week: 6, painReduction: 30 },
      { week: 8, painReduction: 15 },
      { week: 12, painReduction: 5 },
    ],
    minWeeks: 4,
    maxWeeks: 6,
    references: 'Short-term relief only',
  },

  rotator_cuff_exercise: {
    name: 'Rotator Cuff-Related Shoulder Pain',
    description:
      'Guideline windows for measurable improvement commonly use ~12 weeks as primary checkpoint, with further gains over 3-12 months',
    curve: [
      { week: 0, painReduction: 0 },
      { week: 4, painReduction: 15 },
      { week: 8, painReduction: 30 },
      { week: 12, painReduction: 50 },
      { week: 16, painReduction: 60 },
      { week: 24, painReduction: 70 },
      { week: 36, painReduction: 75 },
      { week: 52, painReduction: 80 },
    ],
    minWeeks: 12,
    maxWeeks: 52,
    references: '2025 AAOS CPG',
  },
};

// Helper function to normalize inputs
function normalizeToArray(input: string | string[] | null | undefined): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  return [input];
}

/**
 * Maps patient pain areas and treatments to appropriate benchmark
 */
export function getBenchmarkForPatient(
  selectedAreas: string | string[] | null | undefined,
  currentTreatments: string | string[] | null | undefined,
  symptoms: string | string[] | null | undefined
): RecoveryBenchmark {
  // Normalize inputs to arrays
  const areas = normalizeToArray(selectedAreas).map((a) => a.toLowerCase());
  const treatments = normalizeToArray(currentTreatments).map((t) => t.toLowerCase());
  const symptomsList = normalizeToArray(symptoms).map((s) => s.toLowerCase());

  // Check for lumbar radicular pain (leg pain/numbness with back pain)
  const hasBackPain = areas.some(
    (a) => a.includes('back') || a.includes('spine') || a.includes('lumbar')
  );
  const hasLegSymptoms = symptomsList.some(
    (s) =>
      s.includes('numbness') ||
      s.includes('tingling') ||
      s.includes('radiating') ||
      s.includes('shooting down leg')
  );

  if (hasBackPain && hasLegSymptoms) {
    return RECOVERY_BENCHMARKS.lumbar_radicular_pain;
  }

  // Check for knee OA with injection
  const hasKneePain = areas.some((a) => a.includes('knee'));
  const hasInjection = treatments.some(
    (t) => t.includes('injection') || t.includes('cortisone') || t.includes('steroid')
  );

  if (hasKneePain && hasInjection) {
    return RECOVERY_BENCHMARKS.knee_oa_injection;
  }

  // Check for knee OA with exercise/PT
  const hasExercise = treatments.some(
    (t) => t.includes('physical therapy') || t.includes('exercise') || t.includes('pt')
  );

  if (hasKneePain && (hasExercise || treatments.length === 0)) {
    return RECOVERY_BENCHMARKS.knee_oa_exercise;
  }

  // Check for shoulder pain
  const hasShoulderPain = areas.some((a) => a.includes('shoulder'));

  if (hasShoulderPain) {
    return RECOVERY_BENCHMARKS.rotator_cuff_exercise;
  }

  // Default to acute low back pain for back-related issues
  if (hasBackPain) {
    return RECOVERY_BENCHMARKS.acute_low_back_pain;
  }

  // Default fallback
  return RECOVERY_BENCHMARKS.acute_low_back_pain;
}

/**
 * Converts timeline selection to weeks
 */
export function timelineToWeeks(timeline: string | undefined | null): number {
  const mapping: Record<string, number> = {
    '1-2 weeks': 1.5,
    '3-4 weeks': 3.5,
    '1-2 months': 6,
    '3-4 months': 14,
    '3-6 months': 14,
    '4-6 months': 20,
    '6-12 months': 36,
    'More than 1 year': 52,
  };
  return mapping[timeline ?? ''] ?? 8; // Default to 8 weeks if unknown
}

/**
 * Calculates target pain level based on recovery goals
 * Recovery typically means functional improvement, not pain-free
 */
export function calculateRecoveryTarget(
  currentPain: number,
  _goals?: string[]
): number {
  // If current pain is high (7-10), recovery target is typically 2-3
  // If current pain is moderate (4-6), recovery target is typically 1-2
  // If current pain is low (1-3), recovery target is typically 0-1
  if (currentPain >= 7) return 2;
  if (currentPain >= 4) return 1.5;
  return 0.5;
}

export type ExpectationStatus = 'optimistic' | 'conservative' | 'aligned';

export interface ComparisonResult {
  text: string;
  status: ExpectationStatus;
}

/**
 * Generates comparison text for patient expectation vs evidence
 */
export function generateComparisonText(
  timeline: string | undefined,
  currentPain: number,
  benchmark: RecoveryBenchmark,
  patientWeeks: number
): ComparisonResult {
  const benchmarkRange = `${benchmark.minWeeks}-${benchmark.maxWeeks} weeks`;

  if (!timeline) {
    return {
      text: `Based on evidence, typical recovery occurs over ${benchmarkRange}.`,
      status: 'aligned',
    };
  }

  if (patientWeeks < benchmark.minWeeks) {
    return {
      text: `Your expectation (${timeline}) may be optimistic. ${benchmark.description.split(';')[0]}.`,
      status: 'optimistic',
    };
  }

  if (patientWeeks > benchmark.maxWeeks) {
    return {
      text: `Your expectation (${timeline}) is conservative. Many patients see improvement within ${benchmarkRange}, though individual results vary.`,
      status: 'conservative',
    };
  }

  return {
    text: `Your expectation (${timeline}) aligns well with typical recovery timelines of ${benchmarkRange}.`,
    status: 'aligned',
  };
}

/**
 * Get expected pain reduction at a specific week based on benchmark curve
 */
export function getExpectedPainReduction(benchmark: RecoveryBenchmark, week: number): number {
  const curve = benchmark.curve;

  // Find the two points to interpolate between
  for (let i = 0; i < curve.length - 1; i++) {
    if (week >= curve[i].week && week <= curve[i + 1].week) {
      const t = (week - curve[i].week) / (curve[i + 1].week - curve[i].week);
      return curve[i].painReduction + t * (curve[i + 1].painReduction - curve[i].painReduction);
    }
  }

  // If week is beyond the curve, return the last value
  if (week > curve[curve.length - 1].week) {
    return curve[curve.length - 1].painReduction;
  }

  return 0;
}
