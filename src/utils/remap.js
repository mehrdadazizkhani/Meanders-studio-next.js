// Pure function to remap scroll value from one domain to another
export function remap(value, A, B, C, D) {
  const remappedValue = Math.max(Math.min(value, B), A);
  return ((remappedValue - A) / (B - A)) * (D - C) + C;
}
