export function formatNumberArray(values: number[]): string {
  return values.join(', ');
}

export function parseNumberArray(value: string): number[] {
  return value
    .split(/[\s,，]+/u)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => Number(item));
}

export function formatMatrix(values: number[][]): string {
  return values.map(row => row.join(', ')).join('\n');
}

export function parseMatrix(value: string): number[][] {
  return value
    .split(/\n|;/u)
    .map(row => row.trim())
    .filter(Boolean)
    .map(row => parseNumberArray(row));
}

export function formatStringArray(values: string[]): string {
  return values.join(', ');
}

export function parseStringArray(value: string): string[] {
  return value
    .split(/[,，\n]+/u)
    .map(item => item.trim())
    .filter(Boolean);
}
