export function normalizeText(value: string | null | undefined): string {
  if (!value) return '';

  return value
    .toString()
    .trim()
    .replace(/\s+/g, ' ') // remove extra spaces
    .toUpperCase(); // normalize casing
}
