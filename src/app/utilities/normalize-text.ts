export function normalizeText(value: string | null | undefined): string {
  if (!value) return '';

  return normalizeUnicode(value)
    .toString()
    .trim()
    .replace(/\s+/g, ' ') // remove extra spaces
    .toLocaleUpperCase('en-PH'); // normalize casing while preserving accented letters
}

export function normalizeUnicode(value: string | null | undefined): string {
  return (value ?? '').toString().normalize('NFC');
}

export function repairSpecialCharacters<T>(value: T): T {
  if (typeof value === 'string') {
    return repairMojibake(value).normalize('NFC') as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairSpecialCharacters(item)) as T;
  }

  if (value && typeof value === 'object') {
    if (
      value instanceof Date ||
      value instanceof Blob ||
      value instanceof FormData ||
      value instanceof ArrayBuffer
    ) {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        normalizeUnicode(key),
        repairSpecialCharacters(item),
      ]),
    ) as T;
  }

  return value;
}

function repairMojibake(value: string): string {
  if (!looksLikeMojibake(value)) {
    return value;
  }

  try {
    const bytes = new Uint8Array(
      Array.from(value, (character) => windows1252Byte(character)),
    );
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

    return !decoded.includes('\ufffd') && mojibakeScore(decoded) < mojibakeScore(value)
      ? decoded
      : value;
  } catch {
    return value;
  }
}

function looksLikeMojibake(value: string): boolean {
  return /(?:\u00c3[\u0080-\u00bf]|\u00c2[\u0080-\u00bf]|\u00e2[\u0080-\uffff]{1,2})/.test(value);
}

function mojibakeScore(value: string): number {
  return (value.match(/[\u00c2\u00c3\u00e2\u0080-\u009f]/g) ?? []).length;
}

function windows1252Byte(character: string): number {
  const code = character.charCodeAt(0);
  const windows1252: Record<number, number> = {
    0x20ac: 0x80,
    0x201a: 0x82,
    0x0192: 0x83,
    0x201e: 0x84,
    0x2026: 0x85,
    0x2020: 0x86,
    0x2021: 0x87,
    0x02c6: 0x88,
    0x2030: 0x89,
    0x0160: 0x8a,
    0x2039: 0x8b,
    0x0152: 0x8c,
    0x017d: 0x8e,
    0x2018: 0x91,
    0x2019: 0x92,
    0x201c: 0x93,
    0x201d: 0x94,
    0x2022: 0x95,
    0x2013: 0x96,
    0x2014: 0x97,
    0x02dc: 0x98,
    0x2122: 0x99,
    0x0161: 0x9a,
    0x203a: 0x9b,
    0x0153: 0x9c,
    0x017e: 0x9e,
    0x0178: 0x9f,
  };

  return windows1252[code] ?? code;
}
