export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const randBetween = (min: number, max: number) => Math.random() * (max - min) + min;

export const meters = (value: number) => `${value.toFixed(1)}m`;
