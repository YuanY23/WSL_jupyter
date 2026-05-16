import { ValidationResult } from '../templates/types';

export function validateEqualLengthSeries(
  labelsAndSeries: Array<[string, number[]]>
): ValidationResult {
  const messages: string[] = [];
  const lengths = labelsAndSeries.map(([, series]) => series.length);
  const expected = lengths[0] || 0;

  if (expected === 0) {
    messages.push('时序数组不能为空');
  }
  for (const [label, series] of labelsAndSeries) {
    if (series.length !== expected) {
      messages.push(`${label} 的长度必须与其他时序数组一致`);
    }
    if (series.some(value => !Number.isFinite(value))) {
      messages.push(`${label} 包含非法数值`);
    }
  }

  return { valid: messages.length === 0, messages };
}

export function validateSocBounds(socMin: number, socMax: number, initialSoc: number): ValidationResult {
  const messages: string[] = [];
  if (!(socMin >= 0 && socMax <= 1 && socMin < socMax)) {
    messages.push('SOC 下限和上限必须满足 0 <= 下限 < 上限 <= 1');
  }
  if (!(initialSoc >= socMin && initialSoc <= socMax)) {
    messages.push('初始 SOC 必须位于 SOC 上下限之间');
  }
  return { valid: messages.length === 0, messages };
}
