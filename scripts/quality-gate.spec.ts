import { describe, expect, it } from 'vitest';

import { type GateConfig, planSteps, summarize } from './quality-gate.ts';

const config = (overrides: Partial<GateConfig> = {}): GateConfig => ({
  staticAnalysis: { base: 'origin/main', scope: 'project' },
  steps: { build: true, e2e: true, lint: true, staticAnalysis: true, test: true, typecheck: true },
  ...overrides,
});

const commandOf = (gate: GateConfig, name: string) =>
  planSteps(gate)
    .find((step) => step.name === name)
    ?.command.join(' ');

describe('planSteps', () => {
  it('runs the steps in order and honors the switches', () => {
    const steps = planSteps(config({ steps: { ...config().steps, build: false } }));
    expect(steps.map((step) => step.name)).toEqual([
      'typecheck',
      'lint',
      'test',
      'staticAnalysis',
      'build',
      'e2e',
    ]);
    expect(steps.find((step) => step.name === 'build')?.enabled).toBe(false);
  });

  it('analyzes the whole project, with coverage for CRAP', () => {
    expect(commandOf(config(), 'staticAnalysis')).toBe(
      'fallow --coverage coverage/coverage-final.json',
    );
  });

  it('can analyze only the changes against a base branch', () => {
    const gate = config({ staticAnalysis: { base: 'origin/develop', scope: 'changes' } });
    expect(commandOf(gate, 'staticAnalysis')).toBe(
      'fallow audit --base origin/develop --coverage coverage/coverage-final.json',
    );
  });

  it('skips coverage when tests are off', () => {
    const gate = config({ steps: { ...config().steps, test: false } });
    expect(commandOf(gate, 'staticAnalysis')).toBe('fallow');
  });
});

describe('summarize', () => {
  it('passes when nothing failed', () => {
    const { ok, text } = summarize([
      { label: 'Tipos', status: 'passed' },
      { label: 'Build', status: 'skipped' },
    ]);
    expect(ok).toBe(true);
    expect(text).toContain('✓ Tipos');
    expect(text).toContain('– Build');
    expect(text).toContain('Quality gate PASSED');
  });

  it('fails and counts the failed steps', () => {
    const { ok, text } = summarize([{ label: 'Tests', status: 'failed' }]);
    expect(ok).toBe(false);
    expect(text).toContain('Quality gate FAILED (1 step(s))');
  });
});
