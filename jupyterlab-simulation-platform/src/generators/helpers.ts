import { BaseSimulationConfig, ParameterDefinition, ParameterRow } from '../templates/types';

export interface ParameterBindingMetadata {
  version: 1;
  title: string;
  parameters: Record<string, {
    type: 'slider' | 'number' | 'dropdown' | 'boolean' | 'text';
    label?: string;
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
    group?: string;
  }>;
}

export function parameterRows(config: BaseSimulationConfig): ParameterRow[] {
  return config.parameters.map(parameter => ({
    name: parameter.name,
    value: String(parameter.value),
    unit: parameter.unit,
    description: parameter.description || parameter.label
  }));
}

export function parameterCode(parameters: ParameterDefinition[]): string {
  return parameters
    .map(parameter => {
      const comment = [parameter.label, parameter.unit].filter(Boolean).join(', ');
      return `${parameter.name} = ${formatNumber(parameter.value)}  # ${comment}`;
    })
    .join('\n');
}

function parameterLabel(parameter: ParameterDefinition): string {
  return `${parameter.label}${parameter.unit ? ` (${parameter.unit})` : ''}`;
}

function inferStep(value: number): number {
  const absValue = Math.abs(value);
  if (absValue === 0) {
    return 1;
  }
  if (absValue < 0.001) {
    return absValue / 10;
  }
  if (absValue < 1) {
    return 0.01;
  }
  if (absValue < 10) {
    return 0.1;
  }
  return 1;
}

function inferMax(value: number): number {
  if (value === 0) {
    return 1;
  }
  return value > 0 ? value * 2 : 0;
}

function inferParameterBinding(name: string, rawValue: string, parameter?: ParameterDefinition) {
  if (rawValue === 'True' || rawValue === 'False') {
    return {
      type: parameter?.controlType || 'boolean',
      label: parameter ? parameterLabel(parameter) : name,
      group: '参数层代码'
    };
  }

  const numericValue = Number(rawValue);
  if (Number.isFinite(numericValue)) {
    return {
      type: parameter?.controlType || 'slider',
      label: parameter ? parameterLabel(parameter) : name,
      min: parameter?.min ?? (numericValue >= 0 ? 0 : numericValue * 2),
      max: parameter?.max ?? inferMax(numericValue),
      step: parameter?.step ?? inferStep(numericValue),
      group: '参数层代码'
    };
  }

  if (
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
  ) {
    return {
      type: parameter?.controlType || 'text',
      label: parameter ? parameterLabel(parameter) : name,
      options: parameter?.options,
      group: '参数层代码'
    };
  }

  return null;
}

export function parameterBindingMetadataFromCode(
  parameterSource: string,
  parameters: ParameterDefinition[],
  title: string = '参数层代码'
): ParameterBindingMetadata {
  const byName = new Map(parameters.map(parameter => [parameter.name, parameter]));
  const bindings: ParameterBindingMetadata = {
    version: 1,
    title,
    parameters: {}
  };

  parameterSource.split('\n').forEach(line => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)(?:\s*#.*)?$/);
    if (!match) {
      return;
    }
    const name = match[1];
    const rawValue = match[2].trim();
    const binding = inferParameterBinding(name, rawValue, byName.get(name));
    if (binding) {
      bindings.parameters[name] = binding;
    }
  });

  return bindings;
}

export function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return Number(value).toPrecision(12).replace(/\.?0+$/u, '');
}

export function pythonArray(values: number[]): string {
  return `[${values.map(formatNumber).join(', ')}]`;
}

export function pythonMatrix(values: number[][]): string {
  const rows = values.map(row => `    [${row.map(formatNumber).join(', ')}]`);
  return `[\n${rows.join(',\n')}\n]`;
}

export function assumptionsMarkdown(assumptions: string[]): string {
  return assumptions.map(item => `- ${item}`).join('\n');
}

export function parameterTableMarkdown(rows: ParameterRow[]): string {
  const header = '| 参数 | 数值 | 单位 | 说明 |\n| --- | ---: | --- | --- |';
  const body = rows.map(row => `| ${row.name} | ${row.value} | ${row.unit} | ${row.description} |`);
  return [header, ...body].join('\n');
}
