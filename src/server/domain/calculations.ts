export interface PacingMetrics {
  totalTarget: number;
  actualClosed: number;
  attainmentPercent: number;
  gap: number;
  totalBusinessDays: number;
  elapsedBusinessDays: number;
  remainingBusinessDays: number;
  runPacePerDay: number;
  requiredPacePerDay: number;
  projectedPeriodEnd: number;
  projectedAttainmentPercent: number;
  pacingBufferPercent: number;
  pacingStatus: 'Ahead' | 'On Track' | 'Needs Nudge' | 'Lagging';
}

/**
 * Calculates domain attainment, pacing, and projection metrics safely.
 */
export function calculatePacingMetrics(params: {
  totalTarget: number;
  actualClosed: number;
  totalBusinessDays: number;
  elapsedBusinessDays: number;
}): PacingMetrics {
  const { totalTarget, actualClosed, totalBusinessDays, elapsedBusinessDays } = params;

  const attainmentPercent = totalTarget > 0 ? (actualClosed / totalTarget) * 100 : 0;
  const gap = Math.max(0, totalTarget - actualClosed);
  const remainingBusinessDays = Math.max(0, totalBusinessDays - elapsedBusinessDays);

  const safeElapsedDays = Math.max(1, elapsedBusinessDays);
  const runPacePerDay = actualClosed / safeElapsedDays;

  const requiredPacePerDay = remainingBusinessDays > 0 ? gap / remainingBusinessDays : 0;

  const projectedPeriodEnd = runPacePerDay * totalBusinessDays;
  const projectedAttainmentPercent = totalTarget > 0 ? (projectedPeriodEnd / totalTarget) * 100 : 0;

  let pacingBufferPercent = 0;
  if (requiredPacePerDay > 0) {
    pacingBufferPercent = ((runPacePerDay - requiredPacePerDay) / requiredPacePerDay) * 100;
  } else if (gap === 0) {
    pacingBufferPercent = 100;
  }

  let pacingStatus: 'Ahead' | 'On Track' | 'Needs Nudge' | 'Lagging' = 'On Track';
  if (attainmentPercent >= 100 || pacingBufferPercent >= 20) {
    pacingStatus = 'Ahead';
  } else if (pacingBufferPercent >= -5) {
    pacingStatus = 'On Track';
  } else if (pacingBufferPercent >= -25) {
    pacingStatus = 'Needs Nudge';
  } else {
    pacingStatus = 'Lagging';
  }

  return {
    totalTarget: roundCurrency(totalTarget),
    actualClosed: roundCurrency(actualClosed),
    attainmentPercent: roundToDecimals(attainmentPercent, 2),
    gap: roundCurrency(gap),
    totalBusinessDays,
    elapsedBusinessDays,
    remainingBusinessDays,
    runPacePerDay: roundCurrency(runPacePerDay),
    requiredPacePerDay: roundCurrency(requiredPacePerDay),
    projectedPeriodEnd: roundCurrency(projectedPeriodEnd),
    projectedAttainmentPercent: roundToDecimals(projectedAttainmentPercent, 1),
    pacingBufferPercent: roundToDecimals(pacingBufferPercent, 1),
    pacingStatus,
  };
}

/**
 * Calculates submission compliance health for a given business day.
 */
export function calculateSubmissionHealth(totalActiveReps: number, submittedRepsCount: number): {
  healthPercent: number;
  submittedCount: number;
  totalCount: number;
  pendingCount: number;
  alertLevel: 'Normal' | 'Warning' | 'Critical';
} {
  const totalCount = Math.max(1, totalActiveReps);
  const healthPercent = roundToDecimals((submittedRepsCount / totalCount) * 100, 1);
  const pendingCount = Math.max(0, totalActiveReps - submittedRepsCount);

  let alertLevel: 'Normal' | 'Warning' | 'Critical' = 'Normal';
  if (pendingCount > 0) {
    alertLevel = pendingCount > 3 ? 'Critical' : 'Warning';
  }

  return {
    healthPercent,
    submittedCount: submittedRepsCount,
    totalCount: totalActiveReps,
    pendingCount,
    alertLevel,
  };
}

/**
 * Derives daily benchmark quota for a target over a given number of working business days.
 */
export function deriveDailyBenchmark(targetValue: number, businessDaysInPeriod: number): number {
  if (businessDaysInPeriod <= 0) return 0;
  return roundCurrency(targetValue / businessDaysInPeriod);
}

export function roundCurrency(val: number): number {
  return Math.round(val * 100) / 100;
}

export function roundToDecimals(val: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
