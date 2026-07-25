export interface HashState {
  expression: string;
  warningId: string | null;
}

const LEGACY_PREFIX = "e=";

export function isToolPage(pathname: string): boolean {
  return pathname === "/" || pathname === "/index.html";
}

function decode(encodedExpression: string, warningId: string | null): HashState | null {
  try {
    return { expression: decodeURIComponent(encodedExpression), warningId };
  } catch {
    return null;
  }
}

function split(value: string): HashState | null {
  const separator = value.lastIndexOf("#");
  if (separator === -1) return decode(value, null);
  return decode(value.slice(0, separator), value.slice(separator + 1) || null);
}

export function parseHash(hash: string): HashState | null {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  if (value === "") return null;
  if (value.startsWith(LEGACY_PREFIX)) return split(value.slice(LEGACY_PREFIX.length));
  return split(value);
}

export function expressionHash(expression: string): string {
  return `#${encodeURIComponent(expression)}`;
}
