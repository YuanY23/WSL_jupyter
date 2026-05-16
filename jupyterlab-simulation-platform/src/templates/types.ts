export type TemplateId =
  | 'algebraic-formula'
  | 'first-order-dynamic'
  | 'second-order-dynamic'
  | 'linear-system'
  | 'one-dimensional-transfer'
  | 'time-series-energy-balance'
  | 'optimization-dispatch';

export interface ParameterDefinition {
  name: string;
  label: string;
  value: number;
  unit: string;
  description: string;
}

export interface BaseSimulationConfig {
  templateId: TemplateId;
  simulationName: string;
  problemDescription: string;
  assumptions: string[];
  parameters: ParameterDefinition[];
  outputs: string[];
}

export interface AlgebraicFormulaConfig extends BaseSimulationConfig {
  templateId: 'algebraic-formula';
  formula: string;
  outputVariable: string;
  enableParameterScan: boolean;
  scanParameter: string;
  scanStart: number;
  scanEnd: number;
  scanPoints: number;
  chartType: 'line' | 'bar';
}

export interface FirstOrderDynamicConfig extends BaseSimulationConfig {
  templateId: 'first-order-dynamic';
  stateVariable: string;
  initialValue: number;
  timeStart: number;
  timeEnd: number;
  timeStep: number;
  stateEquation: string;
}

export interface SecondOrderDynamicConfig extends BaseSimulationConfig {
  templateId: 'second-order-dynamic';
  displacementVariable: string;
  velocityVariable: string;
  initialDisplacement: number;
  initialVelocity: number;
  timeEnd: number;
  timeStep: number;
  forcingExpression: string;
}

export interface LinearSystemConfig extends BaseSimulationConfig {
  templateId: 'linear-system';
  unknowns: string[];
  matrix: number[][];
  rhs: number[];
  equationDescriptions: string[];
  plotNodes: boolean;
}

export interface OneDimensionalTransferConfig extends BaseSimulationConfig {
  templateId: 'one-dimensional-transfer';
  problemType: 'steady' | 'transient';
  length: number;
  nodes: number;
  coefficientName: string;
  coefficientValue: number;
  initialCondition: number;
  leftBoundary: number;
  rightBoundary: number;
  timeEnd: number;
  timeStep: number;
}

export interface TimeSeriesEnergyBalanceConfig extends BaseSimulationConfig {
  templateId: 'time-series-energy-balance';
  duration: number;
  timeStep: number;
  generationSeries: number[];
  loadSeries: number[];
  storageCapacity: number;
  maxChargePower: number;
  maxDischargePower: number;
  initialSoc: number;
  socMin: number;
  socMax: number;
  chargeEfficiency: number;
  dischargeEfficiency: number;
  operationRule: string;
}

export interface OptimizationDispatchConfig extends BaseSimulationConfig {
  templateId: 'optimization-dispatch';
  objective: string;
  timeStep: number;
  timeHorizon: number;
  priceSeries: number[];
  loadSeries: number[];
  generationSeries: number[];
  storageCapacity: number;
  maxChargePower: number;
  maxDischargePower: number;
  initialSoc: number;
  socMin: number;
  socMax: number;
  chargeEfficiency: number;
  dischargeEfficiency: number;
}

export type SimulationConfig =
  | AlgebraicFormulaConfig
  | FirstOrderDynamicConfig
  | SecondOrderDynamicConfig
  | LinearSystemConfig
  | OneDimensionalTransferConfig
  | TimeSeriesEnergyBalanceConfig
  | OptimizationDispatchConfig;

export interface ValidationResult {
  valid: boolean;
  messages: string[];
}

export interface TemplateDefinition<TConfig extends SimulationConfig = SimulationConfig> {
  id: TemplateId;
  name: string;
  summary: string;
  defaultConfig: TConfig;
}

export interface NotebookCell {
  cell_type: 'markdown' | 'code';
  metadata: Record<string, unknown>;
  source: string[];
  execution_count?: number | null;
  outputs?: unknown[];
}

export interface NotebookModel {
  cells: NotebookCell[];
  metadata: Record<string, unknown>;
  nbformat: 4;
  nbformat_minor: 5;
}

export interface ParameterRow {
  name: string;
  value: string;
  unit: string;
  description: string;
}

export interface GeneratedNotebookParts {
  title: string;
  problemDescription: string;
  assumptions: string[];
  parameterRows: ParameterRow[];
  mathModelMarkdown: string;
  parameterCode: string;
  modelCode: string;
  solverCode: string;
  visualizationCode: string;
  resultCode: string;
  modificationHint: string;
  analysisHint: string;
}

export type TemplateGenerator<TConfig extends SimulationConfig = SimulationConfig> = (
  config: TConfig
) => GeneratedNotebookParts;
