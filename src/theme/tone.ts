/** Status tones (Alert, Badge). Each maps to a pair of semantic status tokens. */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export const TONE_CLASS: Record<Tone, string> = {
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  neutral: 'bg-surface-muted text-fg',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
};
