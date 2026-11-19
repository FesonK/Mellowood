export const clamp = (n: number, min: number, max: number) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;

export const clamp01 = (n: number) => clamp(n, 0, 1);
