/**
 * 4px base spacing scale. Components should always reach for these tokens
 * instead of hardcoding margin/padding numbers, so density changes stay a
 * one-file edit.
 */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;
