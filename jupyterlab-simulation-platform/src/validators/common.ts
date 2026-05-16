import { ParameterDefinition, ValidationResult } from '../templates/types';

const PARAMETER_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function isValidPythonIdentifier(name: string): boolean {
  return PARAMETER_NAME_RE.test(name.trim());
}

export function mergeValidationResults(results: ValidationResult[]): ValidationResult {
  const messages: string[] = [];
  for (const result of results) {
    messages.push(...result.messages);
  }
  return {
    valid: messages.length === 0 && results.every(result => result.valid),
    messages
  };
}

export function validateParameters(parameters: ParameterDefinition[]): ValidationResult {
  const messages: string[] = [];
  const seen = new Set<string>();

  for (const parameter of parameters) {
    const name = parameter.name.trim();
    if (!isValidPythonIdentifier(name)) {
      messages.push(`参数名 "${parameter.name}" 不是合法变量名`);
    }
    if (seen.has(name)) {
      messages.push(`参数名 "${name}" 重复`);
    }
    seen.add(name);

    if (!Number.isFinite(parameter.value)) {
      messages.push(`参数 "${name}" 的数值不能为空`);
    }
    if (parameter.unit.trim() === '') {
      messages.push(`参数 "${name}" 需要填写单位；无量纲参数可填写 "-"`);
    }
  }

  return { valid: messages.length === 0, messages };
}

export function validatePositiveNumber(label: string, value: number): ValidationResult {
  const valid = Number.isFinite(value) && value > 0;
  return {
    valid,
    messages: valid ? [] : [`${label} 必须大于 0`]
  };
}

export function validateRange(label: string, min: number, max: number): ValidationResult {
  const valid = Number.isFinite(min) && Number.isFinite(max) && min < max;
  return {
    valid,
    messages: valid ? [] : [`${label} 下限必须小于上限`]
  };
}

export function ensureNonEmptyText(label: string, value: string): ValidationResult {
  const valid = value.trim().length > 0;
  return {
    valid,
    messages: valid ? [] : [`${label} 不能为空`]
  };
}
