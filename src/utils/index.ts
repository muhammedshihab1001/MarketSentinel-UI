/**
 * Exporting general purpose application utilities
 */

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateUUID(): string {
  return crypto.randomUUID();
}
