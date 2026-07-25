export interface HashState {
  expression: string;
  warningId: string | null;
}

const RESERVED_FRAGMENTS = new Set(["results"]);
const EXPRESSION_PREFIX = "e=";

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

export function parseHash(hash: string): HashState | null {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  if (value.startsWith(EXPRESSION_PREFIX)) {
    const rest = value.slice(EXPRESSION_PREFIX.length);
    const separator = rest.lastIndexOf("#");
    if (separator === -1) return decode(rest, null);
    return decode(rest.slice(0, separator), rest.slice(separator + 1) || null);
  }
  if (!value || RESERVED_FRAGMENTS.has(value)) return null;
  const separator = value.lastIndexOf("#");
  if (separator === -1) return decode(value, null);
  return decode(value.slice(0, separator), value.slice(separator + 1) || null);
}

export function expressionHash(expression: string): string {
  return `#${EXPRESSION_PREFIX}${encodeURIComponent(expression)}`;
}
