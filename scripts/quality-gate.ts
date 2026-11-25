/**
 * Quality gate: one command (`pnpm quality`) that runs every check the project requires and
 * fails if any fails. The rules live in config files, not here:
 *   quality-gate.json  -> which steps run, coverage thresholds, static-analysis scope
 *   .fallowrc.json     -> static-analysis rules (dead code, complexity, duplication, architecture)
 *   biome.json         -> lint and format rules
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const STEP_NAMES = ['typecheck', 'lint', 'test', 'staticAnalysis', 'build', 'e2e'] as const;
type StepName = (typeof STEP_NAMES)[number];

export type GateConfig = {
  steps: Record<StepName, boolean>;
  staticAnalysis: { scope: 'project' | 'changes'; base: string };
};

type Step = { name: StepName; label: string; command: string[] };
type Result = { label: string; status: 'passed' | 'failed' | 'skipped' };

const COVERAGE_FILE = 'coverage/coverage-final.json';

/** Fallow: whole project, or only what this branch changes against `base` (for adoption). */
const staticAnalysisCommand = ({ staticAnalysis, steps }: GateConfig) => {
  // CRAP (complexity x missing tests) needs the coverage the test step writes.
  const coverage = steps.test ? ['--coverage', COVERAGE_FILE] : [];
  return staticAnalysis.scope === 'changes'
    ? ['fallow', 'audit', '--base', staticAnalysis.base, ...coverage]
    : ['fallow', ...coverage];
};

export const planSteps = (config: GateConfig): (Step & { enabled: boolean })[] => {
  const steps: Step[] = [
    { command: ['tsc', '-b'], label: 'Tipos (tsc)', name: 'typecheck' },
    {
      command: ['biome', 'ci', 'src', 'scripts', 'e2e'],
      label: 'Lint y formato (Biome)',
      name: 'lint',
    },
    { command: ['vitest', 'run', '--coverage'], label: 'Tests y cobertura (Vitest)', name: 'test' },
    {
      command: staticAnalysisCommand(config),
      label: 'Análisis estático (Fallow)',
      name: 'staticAnalysis',
    },
    { command: ['vite', 'build'], label: 'Build (Vite)', name: 'build' },
    {
      command: ['playwright', 'test'],
      label: 'E2E y accesibilidad (Playwright + axe)',
      name: 'e2e',
    },
  ];
  return steps.map((step) => ({ ...step, enabled: config.steps[step.name] }));
};

const ICON: Record<Result['status'], string> = { failed: '✗', passed: '✓', skipped: '–' };

export const summarize = (results: Result[]) => {
  const failed = results.filter((result) => result.status === 'failed').length;
  const lines = results.map((result) => `  ${ICON[result.status]} ${result.label}`);
  const verdict = failed ? `Quality gate FAILED (${failed} step(s))` : 'Quality gate PASSED';
  return { ok: failed === 0, text: ['', 'Quality gate', ...lines, '', verdict].join('\n') };
};

// Run only when executed (`pnpm quality`), not when imported by the test.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const config = JSON.parse(
    readFileSync(new URL('../quality-gate.json', import.meta.url), 'utf8'),
  ) as GateConfig;

  // Runs every enabled step, even after a failure, so one run shows everything to fix.
  const results: Result[] = planSteps(config).map(({ command, enabled, label }) => {
    if (!enabled) return { label, status: 'skipped' };
    console.log(`\n▶ ${label}: ${command.join(' ')}`);
    const [bin = '', ...args] = command;
    const { status } = spawnSync(bin, args, {
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });
    return { label, status: status === 0 ? 'passed' : 'failed' };
  });

  const { ok, text } = summarize(results);
  console.log(text);
  process.exitCode = ok ? 0 : 1;
}
