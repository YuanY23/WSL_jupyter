import { ValidationResult } from '../templates/types';

const SAFE_EXPRESSION_RE = /^[0-9A-Za-z_\s+\-*/().,^%]+$/;
const IDENTIFIER_RE = /[A-Za-z_][A-Za-z0-9_]*/g;

const ALLOWED_FUNCTIONS = new Set([
  'abs',
  'min',
  'max',
  'pow',
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'exp',
  'log',
  'log10',
  'sqrt'
]);

const ALLOWED_CONSTANTS = new Set(['pi', 'e']);

export function normalizeFormulaExpression(expression: string): string {
  return expression.replace(/\^/g, '**').trim();
}

export function validateFormulaExpression(expression: string, variableNames: string[]): ValidationResult {
  const messages: string[] = [];
  const normalized = expression.trim();
  const variableSet = new Set(variableNames.map(name => name.trim()).filter(Boolean));

  if (normalized.length === 0) {
    messages.push('公式不能为空');
  }

  if (normalized.includes('__')) {
    messages.push('公式不能包含双下划线');
  }

  if (normalized.length > 0 && !SAFE_EXPRESSION_RE.test(normalized)) {
    messages.push('公式只能包含数字、变量名、常见数学运算符、括号和白名单数学函数');
  }

  const identifiers = normalized.match(IDENTIFIER_RE) || [];
  for (const identifier of identifiers) {
    if (
      !variableSet.has(identifier) &&
      !ALLOWED_FUNCTIONS.has(identifier) &&
      !ALLOWED_CONSTANTS.has(identifier)
    ) {
      messages.push(`公式引用了未定义变量或不允许的函数: ${identifier}`);
    }
  }

  return { valid: messages.length === 0, messages };
}

export function mathPreludeCode(): string {
  return [
    'sin = np.sin',
    'cos = np.cos',
    'tan = np.tan',
    'asin = np.arcsin',
    'acos = np.arccos',
    'atan = np.arctan',
    'exp = np.exp',
    'log = np.log',
    'log10 = np.log10',
    'sqrt = np.sqrt',
    'pi = np.pi',
    'e = np.e'
  ].join('\n');
}
