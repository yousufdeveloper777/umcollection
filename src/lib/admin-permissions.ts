export function canAccessAdmin(roles: readonly string[], active: boolean): boolean {
  return active && roles.includes("super_admin");
}

export function isLowStock(stock: number, threshold: number): boolean {
  return stock <= threshold;
}

export function csvCell(value: unknown): string {
  const text = String(value ?? "");
  const safe = /^[\s]*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}