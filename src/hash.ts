export interface HashState {
  expression: string;
  warningId: string | null;
}

export function parseHash(hash: string): HashState | null {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!value) return null;
  const separator = value.lastIndexOf("#");
  const encodedExpression = separator === -1 ? value : value.slice(0, separator);
  try {
    return {
      expression: decodeURIComponent(encodedExpression),
      warningId: separator === -1 ? null : value.slice(separator + 1) || null,
    };
  } catch {
    return null;
  }
}

export function expressionHash(expression: string): string {
  return `#${encodeURIComponent(expression)}`;
}
