export function formatINR(value: number, digits = 2) {
  return `₹${value.toFixed(digits)}`;
}
