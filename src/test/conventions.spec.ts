import { describe, expect, it } from 'vitest';

/**
 * Theme rule no linter covers: components use design tokens only. Fallow checks the rest
 * (atomic levels, layers, dead code, complexity, duplication).
 */
const sources = Object.entries(
  import.meta.glob<string>(['/src/**/*.tsx', '!/src/**/*.spec.tsx'], {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
);

// Tailwind silently ignores classes with no token, so these become test failures.
const RAW_STYLES = [
  // Default palette (bg-blue-500, text-white): use semantic tokens (bg-primary, text-on-primary).
  /\b[a-z]+-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/,
  /\b(?:bg|text|border|outline|ring|fill|stroke)-(?:white|black)\b/,
  // Default type scale (text-sm): use text-title, text-heading, text-body, text-caption.
  /\btext-(?:xs|sm|base|lg|[2-9]?xl)\b/,
  // Default radii (rounded, rounded-md): use rounded-control, rounded-card.
  /\brounded(?:-(?:xs|sm|md|lg|[2-4]?xl))?(?=[\s"'`])/,
  // Hard-coded values (bg-[#123456], style={{ color: '#fff' }}).
  /\[#[\da-f]{3,8}\]|['"]#[\da-f]{3,8}['"]/i,
];

describe('theme: only design tokens', () => {
  it.each(sources)('%s', (_file, source) => {
    for (const pattern of RAW_STYLES) expect(source).not.toMatch(pattern);
  });
});
