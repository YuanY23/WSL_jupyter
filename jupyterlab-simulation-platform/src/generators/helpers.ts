import { BaseSimulationConfig, ParameterDefinition, ParameterRow } from '../templates/types';

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
