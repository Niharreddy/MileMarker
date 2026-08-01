/** Corner-radius scale shared by every surface (cards, buttons, sheets, images). */
export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type Radii = typeof radii;
export type RadiusKey = keyof Radii;
