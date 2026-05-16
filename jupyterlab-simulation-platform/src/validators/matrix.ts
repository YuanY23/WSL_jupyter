import { ValidationResult } from '../templates/types';

export function validateLinearSystemDimensions(
  unknowns: string[],
  matrix: number[][],
  rhs: number[]
): ValidationResult {
  const messages: string[] = [];
  const n = unknowns.length;

  if (n === 0) {
    messages.push('至少需要一个未知量');
  }
  if (matrix.length !== n) {
    messages.push('系数矩阵 A 的行数必须等于未知量数量');
  }
  for (const [index, row] of matrix.entries()) {
    if (row.length !== n) {
      messages.push(`系数矩阵 A 第 ${index + 1} 行长度必须等于未知量数量`);
    }
    if (row.some(value => !Number.isFinite(value))) {
      messages.push(`系数矩阵 A 第 ${index + 1} 行包含非法数值`);
    }
  }
  if (rhs.length !== n) {
    messages.push('右端项 b 的长度必须等于未知量数量');
  }
  if (rhs.some(value => !Number.isFinite(value))) {
    messages.push('右端项 b 包含非法数值');
  }

  return { valid: messages.length === 0, messages };
}
