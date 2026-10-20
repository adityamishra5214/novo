import { describe, it, expect } from 'vitest';
import { calculatePacingMetrics, calculateSubmissionHealth, deriveDailyBenchmark } from '../server/domain/calculations.js';

describe('Domain Calculations', () => {
  describe('calculatePacingMetrics', () => {
    it('calculates attainment and gap correctly', () => {
      const res = calculatePacingMetrics({
        totalTarget: 1600000,
        actualClosed: 1420000,
        totalBusinessDays: 22,
        elapsedBusinessDays: 16,
      });

      expect(res.attainmentPercent).toBe(88.75);
      expect(res.gap).toBe(180000);
      expect(res.remainingBusinessDays).toBe(6);
      expect(res.runPacePerDay).toBe(88750);
      expect(res.requiredPacePerDay).toBe(30000);
      expect(res.projectedPeriodEnd).toBe(1952500);
      expect(res.pacingStatus).toBe('Ahead');
    });

    it('handles zero target gracefully without division by zero', () => {
      const res = calculatePacingMetrics({
        totalTarget: 0,
        actualClosed: 500,
        totalBusinessDays: 20,
        elapsedBusinessDays: 5,
      });

      expect(res.attainmentPercent).toBe(0);
      expect(res.gap).toBe(0);
      expect(res.requiredPacePerDay).toBe(0);
    });

    it('handles zero elapsed days without throwing', () => {
      const res = calculatePacingMetrics({
        totalTarget: 100000,
        actualClosed: 0,
        totalBusinessDays: 20,
        elapsedBusinessDays: 0,
      });

      expect(res.attainmentPercent).toBe(0);
      expect(res.gap).toBe(100000);
      expect(res.runPacePerDay).toBe(0);
    });
  });

  describe('calculateSubmissionHealth', () => {
    it('calculates health percentage and alert level', () => {
      // 16 of 17 submitted -> 94.1%
      const health = calculateSubmissionHealth(17, 16);
      expect(health.healthPercent).toBe(94.1);
      expect(health.submittedCount).toBe(16);
      expect(health.pendingCount).toBe(1);
      expect(health.alertLevel).toBe('Warning');
    });

    it('returns Normal when 100% submitted', () => {
      const health = calculateSubmissionHealth(10, 10);
      expect(health.healthPercent).toBe(100);
      expect(health.alertLevel).toBe('Normal');
      expect(health.pendingCount).toBe(0);
    });
  });

  describe('deriveDailyBenchmark', () => {
    it('calculates linear daily benchmark', () => {
      // $85,000 across 20 business days -> $4,250
      const benchmark = deriveDailyBenchmark(85000, 20);
      expect(benchmark).toBe(4250);
    });
  });
});
