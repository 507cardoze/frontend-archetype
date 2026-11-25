import { describe, expect, it } from 'vitest';

import { buildTokensCss, type Tokens } from './build-tokens.ts';

const tokens: Tokens = {
  primitive: {
    brand: { $type: 'color', '600': { $value: '#4338ca' } },
    space: { $type: 'dimension', '1': { $value: { unit: 'rem', value: 0.25 } } },
  },
  semantic: {
    color: {
      $type: 'color',
      primary: { $description: 'actions', $value: '{primitive.brand.600}' },
      surface: { $value: { colorSpace: 'srgb', hex: '#ffffff' } },
    },
    font: { $type: 'fontFamily', sans: { $value: ['Inter', 'sans-serif'] } },
    shadow: {
      $type: 'shadow',
      card: { $value: { blur: '4px', color: '#0000001a', offsetX: '0', offsetY: '1px' } },
    },
    spacing: { $type: 'dimension', $value: '0.25rem' },
    text: {
      $type: 'typography',
      title: { $value: { fontSize: '1.5rem', fontWeight: 700, lineHeight: '2rem' } },
    },
  },
};

describe('buildTokensCss', () => {
  const css = buildTokensCss(tokens);

  it('keeps primitives as plain variables, with DTCG object values', () => {
    expect(css).toContain(':root {\n  --brand-600: #4338ca;\n  --space-1: 0.25rem;\n}');
  });

  it('turns semantic aliases into var() references with their description', () => {
    expect(css).toContain('--color-primary: var(--brand-600); /* actions */');
    expect(css).toContain('--color-surface: #ffffff;');
  });

  it('removes Tailwind defaults only for semantic groups', () => {
    expect(css).toContain('--color-*: initial;');
    expect(css).toContain('--text-*: initial;');
    expect(css).not.toContain('--spacing-*: initial;');
  });

  it('expands typography, shadows and font stacks', () => {
    expect(css).toContain('--text-title: 1.5rem;');
    expect(css).toContain('--text-title--line-height: 2rem;');
    expect(css).toContain('--text-title--font-weight: 700;');
    expect(css).toContain('--shadow-card: 0 1px 4px 0 #0000001a;');
    expect(css).toContain('--font-sans: Inter, sans-serif;');
  });

  it('rejects values it cannot translate', () => {
    expect(() =>
      buildTokensCss({ primitive: { bad: { $value: { unknown: true } } }, semantic: {} }),
    ).toThrow('Unsupported token value');
  });
});
