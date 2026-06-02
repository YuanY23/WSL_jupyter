export const BINDING_METADATA_KEY = 'simulation_param_bindings';
export const PARAMETER_REGION_TITLE = '参数层代码';

export type ParamControlType = 'slider' | 'number' | 'dropdown' | 'boolean' | 'text';
export type ParamValueType = 'number' | 'boolean' | 'string';

export interface IParamControlConfig {
  type: ParamControlType;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  group?: string;
}

export interface IBindingMetadata {
  version: 1;
  title: string;
  parameters: Record<string, IParamControlConfig>;
}

export interface IParsedParam {
  cellId?: string;
  cellIndex: number;
  variableName: string;
  value: any;
  valueType: ParamValueType;
  rawLineValue: string;
  lineIndex: number;
  regionTitle: string;
  regionStartCellId?: string;
  regionStartCellIndex: number;
  metadata: IParamControlConfig;
  configured: boolean;
}

export interface INumericControlAttributes {
  min: number;
  max: number;
  step: number;
  rangeValue: number;
  inputValue: any;
}

interface IHeadingInfo {
  level: number;
  title: string;
}

interface IAssignmentInfo {
  variableName: string;
  rawValue: string;
  value: any;
  valueType: ParamValueType;
}

const headingRegex = /^(#{1,6})\s*(.+)$/m;
const assignmentRegex = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)(?:\s*#.*)?$/;
const numberRegex = /^[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:[eE][+-]?\d+)?$/;
const MAX_RANGE_STEPS = 10000;

function finiteNumber(value: any): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function inferNumericStep(value: any): number {
  const numeric = Math.abs(Number(value));
  if (!Number.isFinite(numeric) || numeric === 0) {
    return 1;
  }
  if (numeric < 1) {
    const step = Number((numeric / 100).toPrecision(6));
    return step > 0 ? step : 1e-10;
  }
  return 1;
}

function inferNumericMax(value: any, min: number): number {
  const numeric = finiteNumber(value);
  if (numeric === undefined) {
    return min + 1;
  }
  if (numeric === 0) {
    return min < 1 ? 1 : min + 1;
  }
  if (numeric < 0) {
    return 0 > min ? 0 : min + Math.max(Math.abs(numeric), 1);
  }
  return numeric * 2 > min ? numeric * 2 : min + Math.max(numeric, 1);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function resolveNumericControlAttributes(
  config: Pick<IParamControlConfig, 'min' | 'max' | 'step'> | undefined,
  sourceValue: any,
  currentValue: any = sourceValue
): INumericControlAttributes {
  const sourceNumber = finiteNumber(sourceValue) ?? 0;
  const configuredMin = finiteNumber(config?.min);
  const min = configuredMin ?? (sourceNumber < 0 ? sourceNumber * 2 : 0);
  const configuredStep = finiteNumber(config?.step);
  let step = configuredStep !== undefined && configuredStep > 0
    ? configuredStep
    : inferNumericStep(sourceNumber);
  let max = finiteNumber(config?.max) ?? inferNumericMax(sourceNumber, min);

  if (max <= min) {
    max = min + Math.max(Math.abs(sourceNumber - min), step, 1);
  }

  const span = max - min;
  if (Number.isFinite(span) && span > 0 && span / step > MAX_RANGE_STEPS) {
    step = span / MAX_RANGE_STEPS;
  }

  step = (Number.isFinite(step) && step > 0) ? step : 1.0;

  const currentNumber = finiteNumber(currentValue);
  const fallbackValue = finiteNumber(sourceValue) ?? min;
  const rangeValue = clampNumber(currentNumber ?? fallbackValue, min, max);

  return {
    min,
    max,
    step,
    rangeValue,
    inputValue: currentValue
  };
}

function sourceToString(source: unknown): string {
  if (Array.isArray(source)) {
    return source.join('');
  }
  if (typeof source === 'string') {
    return source;
  }
  return '';
}

export function getCellSource(cell: any): string {
  if (cell?.model?.sharedModel?.getSource) {
    return cell.model.sharedModel.getSource();
  }
  return sourceToString(cell?.source);
}

export function getCellType(cell: any): string {
  return cell?.model?.type || cell?.cell_type || '';
}

function getCellId(cell: any, cellIndex: number): string | undefined {
  return cell?.model?.id || cell?.id || String(cellIndex);
}

function parseHeading(source: string): IHeadingInfo | null {
  const match = source.match(headingRegex);
  if (!match) {
    return null;
  }
  return {
    level: match[1].length,
    title: match[2].trim()
  };
}

function parsePythonLiteral(rawValue: string): Pick<IAssignmentInfo, 'value' | 'valueType'> | null {
  const value = rawValue.trim();

  if (value === 'True' || value === 'False') {
    return { value: value === 'True', valueType: 'boolean' };
  }

  if (numberRegex.test(value)) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return { value: parsed, valueType: 'number' };
    }
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return {
      value: value.slice(1, -1),
      valueType: 'string'
    };
  }

  return null;
}

function parseAssignment(line: string): IAssignmentInfo | null {
  const match = line.match(assignmentRegex);
  if (!match) {
    return null;
  }

  const variableName = match[1];
  const rawValue = match[2].trim();
  const parsed = parsePythonLiteral(rawValue);
  if (!parsed) {
    return null;
  }

  return {
    variableName,
    rawValue,
    value: parsed.value,
    valueType: parsed.valueType
  };
}

function defaultConfigForParam(param: IAssignmentInfo, regionTitle: string): IParamControlConfig {
  if (param.valueType === 'boolean') {
    return {
      type: 'boolean',
      label: param.variableName,
      group: regionTitle
    };
  }

  if (param.valueType === 'string') {
    return {
      type: 'text',
      label: param.variableName,
      group: regionTitle
    };
  }

  return {
    type: 'number',
    label: param.variableName,
    group: regionTitle
  };
}

function normalizeMetadata(metadata?: Partial<IBindingMetadata> | null): IBindingMetadata {
  const parameters = metadata?.parameters || {};
  return {
    version: 1,
    title: metadata?.title || PARAMETER_REGION_TITLE,
    parameters
  };
}

export function scanParameterRegion(
  cells: readonly any[],
  metadata?: Partial<IBindingMetadata> | null,
  titleKeyword: string = PARAMETER_REGION_TITLE
): IParsedParam[] {
  const bindings = normalizeMetadata(metadata);
  const params: IParsedParam[] = [];
  let activeRegion: IHeadingInfo | null = null;
  let regionStartCellIndex = -1;
  let regionStartCellId: string | undefined;

  cells.forEach((cell, cellIndex) => {
    const cellType = getCellType(cell);
    const source = getCellSource(cell);

    if (cellType === 'markdown') {
      const heading = parseHeading(source);
      if (!heading) {
        return;
      }

      if (activeRegion && heading.level <= activeRegion.level) {
        activeRegion = null;
        regionStartCellIndex = -1;
        regionStartCellId = undefined;
      }

      if (heading.title.includes(titleKeyword)) {
        activeRegion = heading;
        regionStartCellIndex = -1;
        regionStartCellId = undefined;
      }
      return;
    }

    if (!activeRegion || cellType !== 'code') {
      return;
    }

    if (regionStartCellIndex === -1) {
      regionStartCellIndex = cellIndex;
      regionStartCellId = getCellId(cell, cellIndex);
    }

    source.split('\n').forEach((line, lineIndex) => {
      const assignment = parseAssignment(line);
      if (!assignment) {
        return;
      }

      const configured = Object.prototype.hasOwnProperty.call(
        bindings.parameters,
        assignment.variableName
      );
      const savedConfig = bindings.parameters[assignment.variableName];
      const metadataConfig = {
        ...defaultConfigForParam(assignment, activeRegion!.title),
        ...savedConfig,
        group: savedConfig?.group || activeRegion!.title
      };

      params.push({
        cellId: getCellId(cell, cellIndex),
        cellIndex,
        variableName: assignment.variableName,
        value: assignment.value,
        valueType: assignment.valueType,
        rawLineValue: assignment.rawValue,
        lineIndex,
        regionTitle: activeRegion!.title,
        regionStartCellId,
        regionStartCellIndex,
        metadata: metadataConfig,
        configured
      });
    });
  });

  return params;
}

function escapePythonString(value: string, quote: string): string {
  const escaped = value.replace(/\\/g, '\\\\').replace(new RegExp(quote, 'g'), `\\${quote}`);
  return `${quote}${escaped}${quote}`;
}

export function formatPythonValue(newValue: any, valueType: ParamValueType, originalRawValue?: string): string {
  if (valueType === 'boolean') {
    return newValue ? 'True' : 'False';
  }

  if (valueType === 'string') {
    const quote = originalRawValue?.trim().startsWith("'") ? "'" : '"';
    return escapePythonString(String(newValue), quote);
  }

  return String(newValue);
}

export function updateAssignmentSource(
  source: string,
  param: Pick<IParsedParam, 'lineIndex' | 'variableName' | 'valueType'>,
  newValue: any
): string {
  const lines = source.split('\n');
  if (param.lineIndex < 0 || param.lineIndex >= lines.length) {
    throw new Error(`Line index ${param.lineIndex} is out of bounds.`);
  }

  const targetLine = lines[param.lineIndex];
  const regex = new RegExp(`^(\\s*${param.variableName}\\s*=\\s*)(.*?)(\\s*(?:#.*)?)$`);
  const match = targetLine.match(regex);
  if (!match) {
    throw new Error(`Variable ${param.variableName} was not found on line ${param.lineIndex}.`);
  }

  const nextValue = formatPythonValue(newValue, param.valueType, match[2]);
  lines[param.lineIndex] = `${match[1]}${nextValue}${match[3]}`;
  return lines.join('\n');
}

export function createEmptyBindingMetadata(title: string = PARAMETER_REGION_TITLE): IBindingMetadata {
  return {
    version: 1,
    title,
    parameters: {}
  };
}
