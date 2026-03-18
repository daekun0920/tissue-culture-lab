/**
 * Format a SCREAMING_SNAKE_CASE enum value to Title Case.
 * e.g. "HAS_CULTURE" → "Has Culture", "ADD_CULTURE" → "Add Culture"
 */
export function formatEnum(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Try to parse a JSON hormones string into a readable format.
 * e.g. '{"BAP":"5.00mg","NAA":"0.50mg"}' → "BAP: 5.00mg, NAA: 0.50mg"
 * Returns the original string if it's not valid JSON or not an object.
 */
export function formatHormones(raw: string | null | undefined): string {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return Object.entries(parsed)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');
    }
    return raw;
  } catch {
    return raw;
  }
}

/**
 * Try to parse a readable hormones string back to JSON for storage.
 * e.g. "BAP: 5.00mg, NAA: 0.50mg" → '{"BAP":"5.00mg","NAA":"0.50mg"}'
 * If the input is already valid JSON, return as-is.
 */
export function hormonesToJson(readable: string): string {
  if (!readable.trim()) return '';
  // Already valid JSON?
  try {
    JSON.parse(readable);
    return readable;
  } catch {
    // noop
  }
  // Try to parse "KEY: value, KEY: value" format
  const entries = readable.split(',').map((s) => s.trim()).filter(Boolean);
  const obj: Record<string, string> = {};
  for (const entry of entries) {
    const colonIdx = entry.indexOf(':');
    if (colonIdx === -1) return readable; // can't parse, return as-is
    const key = entry.slice(0, colonIdx).trim();
    const val = entry.slice(colonIdx + 1).trim();
    if (key) obj[key] = val;
  }
  return Object.keys(obj).length > 0 ? JSON.stringify(obj) : readable;
}
