import {
  AlgebraicFormulaConfig,
  FirstOrderDynamicConfig,
  LinearSystemConfig,
  OneDimensionalTransferConfig,
  OptimizationDispatchConfig,
  SecondOrderDynamicConfig,
  SimulationConfig,
  TemplateDefinition,
  TemplateId,
  TimeSeriesEnergyBalanceConfig,
  ValidationResult
} from './types';
import { validateParameters, validatePositiveNumber, validateRange, mergeValidationResults, ensureNonEmptyText } from '../validators/common';
import { validateFormulaExpression } from '../validators/formula';
import { validateLinearSystemDimensions } from '../validators/matrix';
import { validateEqualLengthSeries, validateSocBounds } from '../validators/timeSeries';

const algebraicFormulaDefault: AlgebraicFormulaConfig = {
  templateId: 'algebraic-formula',
  simulationName: '光伏组件输出功率计算',
  problemDescription: '根据组件面积、太阳辐照度和转换效率估算光伏组件输出功率。',
  assumptions: ['辐照度在计算时段内保持不变', '组件效率视为常数', '忽略温度和逆变器损耗影响'],
  parameters: [
    { name: 'pv_area', label: '组件面积', value: 12, unit: 'm^2', description: '参与发电的有效面积' },
    { name: 'irradiance', label: '太阳辐照度', value: 800, unit: 'W/m^2', description: '单位面积太阳辐照功率' },
    { name: 'efficiency', label: '转换效率', value: 0.19, unit: '-', description: '光伏组件电转换效率' }
  ],
  outputs: ['power'],
  formula: 'pv_area * irradiance * efficiency',
  outputVariable: 'power',
  enableParameterScan: true,
  scanParameter: 'irradiance',
  scanStart: 200,
  scanEnd: 1000,
  scanPoints: 9,
  chartType: 'line'
};

const firstOrderDefault: FirstOrderDynamicConfig = {
  templateId: 'first-order-dynamic',
  simulationName: '储能 SOC 一阶动态仿真',
  problemDescription: '根据充放电功率估算储能系统 SOC 随时间的变化。',
  assumptions: ['充放电功率在仿真过程中保持常数', '忽略自放电', 'SOC 变化使用显式欧拉法离散'],
  parameters: [
    { name: 'charge_power', label: '充电功率', value: 8, unit: 'kW', description: '正值表示充电功率' },
    { name: 'capacity', label: '储能容量', value: 40, unit: 'kWh', description: '储能额定容量' },
    { name: 'eta', label: '充电效率', value: 0.94, unit: '-', description: '充电效率' }
  ],
  outputs: ['SOC 曲线'],
  stateVariable: 'soc',
  initialValue: 0.35,
  timeStart: 0,
  timeEnd: 4,
  timeStep: 0.05,
  stateEquation: 'charge_power * eta / capacity'
};

const secondOrderDefault: SecondOrderDynamicConfig = {
  templateId: 'second-order-dynamic',
  simulationName: '弹簧质量阻尼系统响应',
  problemDescription: '使用二阶动态系统模拟机械振动或转子简化动态响应。',
  assumptions: ['质量、阻尼和刚度为常数', '外部激励由用户表达式给定', '使用显式欧拉法展示求解过程'],
  parameters: [
    { name: 'm', label: '质量', value: 1, unit: 'kg', description: '等效质量' },
    { name: 'c', label: '阻尼系数', value: 0.6, unit: 'N·s/m', description: '线性阻尼系数' },
    { name: 'k', label: '刚度', value: 20, unit: 'N/m', description: '线性弹簧刚度' }
  ],
  outputs: ['位移曲线', '速度曲线'],
  displacementVariable: 'x',
  velocityVariable: 'v',
  initialDisplacement: 0.1,
  initialVelocity: 0,
  timeEnd: 10,
  timeStep: 0.01,
  forcingExpression: '0'
};

const linearSystemDefault: LinearSystemConfig = {
  templateId: 'linear-system',
  simulationName: '三节点网络平衡求解',
  problemDescription: '用线性方程组表示多个节点之间的热、电或能量平衡关系。',
  assumptions: ['系统为线性稳态网络', '系数矩阵由节点平衡方程组装', '所有未知量同时求解'],
  parameters: [],
  outputs: ['节点未知量结果'],
  unknowns: ['T1', 'T2', 'T3'],
  matrix: [
    [4, -1, 0],
    [-1, 4, -1],
    [0, -1, 3]
  ],
  rhs: [60, 40, 30],
  equationDescriptions: ['节点 1 能量平衡', '节点 2 能量平衡', '节点 3 能量平衡'],
  plotNodes: true
};

const transferDefault: OneDimensionalTransferConfig = {
  templateId: 'one-dimensional-transfer',
  simulationName: '一维墙体传热温度分布',
  problemDescription: '用有限差分方法计算一维传热或扩散问题的空间分布。',
  assumptions: ['材料参数为常数', '边界条件为第一类边界条件', '第一版采用一维网格'],
  parameters: [],
  outputs: ['空间分布图'],
  problemType: 'steady',
  length: 0.24,
  nodes: 25,
  coefficientName: 'alpha',
  coefficientValue: 1.2e-6,
  initialCondition: 20,
  leftBoundary: 40,
  rightBoundary: 5,
  timeEnd: 12,
  timeStep: 0.02
};

const energyBalanceDefault: TimeSeriesEnergyBalanceConfig = {
  templateId: 'time-series-energy-balance',
  simulationName: '光伏储能负荷逐时能量平衡',
  problemDescription: '根据发电、负荷和储能参数计算逐时 SOC、购电功率与弃电功率。',
  assumptions: ['发电优先供负荷', '多余发电优先充电', '缺电时储能优先放电'],
  parameters: [],
  outputs: ['功率曲线', 'SOC 曲线', '自消纳率', '弃电率', '购电量'],
  duration: 8,
  timeStep: 1,
  generationSeries: [0, 4, 10, 15, 12, 6, 1, 0],
  loadSeries: [5, 6, 7, 8, 7, 6, 5, 5],
  storageCapacity: 20,
  maxChargePower: 6,
  maxDischargePower: 6,
  initialSoc: 0.4,
  socMin: 0.1,
  socMax: 0.95,
  chargeEfficiency: 0.95,
  dischargeEfficiency: 0.94,
  operationRule: '发电优先供负荷，多余发电给储能充电，储能满后弃电；发电不足时储能放电，储能不足时电网补电。'
};

const optimizationDefault: OptimizationDispatchConfig = {
  templateId: 'optimization-dispatch',
  simulationName: '分时电价下储能优化调度',
  problemDescription: '在分时电价下优化储能充放电和购电功率，降低购电成本。',
  assumptions: ['电价、负荷和发电预测已知', '采用线性规划表达功率平衡和 SOC 动态', '忽略充放电同时发生的互斥约束以保持第一版模型简洁'],
  parameters: [],
  outputs: ['最优购电功率', '储能充放电功率', 'SOC 曲线', '购电成本'],
  objective: '最小化购电成本',
  timeStep: 1,
  timeHorizon: 8,
  priceSeries: [0.32, 0.32, 0.55, 0.8, 0.8, 0.55, 0.32, 0.32],
  loadSeries: [5, 6, 7, 8, 7, 6, 5, 5],
  generationSeries: [0, 4, 10, 15, 12, 6, 1, 0],
  storageCapacity: 20,
  maxChargePower: 6,
  maxDischargePower: 6,
  initialSoc: 0.4,
  socMin: 0.1,
  socMax: 0.95,
  chargeEfficiency: 0.95,
  dischargeEfficiency: 0.94
};

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  {
    id: 'algebraic-formula',
    name: '代数方程 / 经验公式',
    summary: '公式计算、参数扫描、曲线或柱状结果',
    defaultConfig: algebraicFormulaDefault
  },
  {
    id: 'first-order-dynamic',
    name: '一阶动态系统',
    summary: '一阶 ODE 或状态更新过程',
    defaultConfig: firstOrderDefault
  },
  {
    id: 'second-order-dynamic',
    name: '二阶动态系统',
    summary: '振动、转子或频率响应简化模型',
    defaultConfig: secondOrderDefault
  },
  {
    id: 'linear-system',
    name: '线性方程组 / 网络平衡',
    summary: '矩阵方程 A x = b 与节点结果图',
    defaultConfig: linearSystemDefault
  },
  {
    id: 'one-dimensional-transfer',
    name: '一维传热 / 扩散',
    summary: '稳态或瞬态有限差分模板',
    defaultConfig: transferDefault
  },
  {
    id: 'time-series-energy-balance',
    name: '时序能量平衡',
    summary: '光伏、储能、负荷逐时运行规则',
    defaultConfig: energyBalanceDefault
  },
  {
    id: 'optimization-dispatch',
    name: '简单优化调度',
    summary: '线性规划形式的能源调度优化',
    defaultConfig: optimizationDefault
  }
];

export function getTemplateDefinition(templateId: TemplateId): TemplateDefinition {
  const definition = TEMPLATE_REGISTRY.find(item => item.id === templateId);
  if (!definition) {
    throw new Error(`未知模板类型: ${templateId}`);
  }
  return definition;
}

export function getDefaultConfig(templateId: TemplateId): SimulationConfig {
  return JSON.parse(JSON.stringify(getTemplateDefinition(templateId).defaultConfig)) as SimulationConfig;
}

export function validateSimulationConfig(config: SimulationConfig): ValidationResult {
  const baseResults = [
    ensureNonEmptyText('仿真名称', config.simulationName),
    ensureNonEmptyText('问题描述', config.problemDescription),
    validateParameters(config.parameters)
  ];

  switch (config.templateId) {
    case 'algebraic-formula':
      return mergeValidationResults([
        ...baseResults,
        validateFormulaExpression(config.formula, config.parameters.map(parameter => parameter.name)),
        ensureNonEmptyText('输出变量', config.outputVariable),
        validateRange('参数扫描范围', config.scanStart, config.scanEnd),
        validatePositiveNumber('扫描点数', config.scanPoints)
      ]);
    case 'first-order-dynamic':
      return mergeValidationResults([
        ...baseResults,
        validateFormulaExpression(config.stateEquation, [
          ...config.parameters.map(parameter => parameter.name),
          't',
          config.stateVariable
        ]),
        validateRange('仿真时间', config.timeStart, config.timeEnd),
        validatePositiveNumber('时间步长', config.timeStep)
      ]);
    case 'second-order-dynamic':
      return mergeValidationResults([
        ...baseResults,
        validateFormulaExpression(config.forcingExpression, [
          ...config.parameters.map(parameter => parameter.name),
          't'
        ]),
        validatePositiveNumber('仿真时间', config.timeEnd),
        validatePositiveNumber('时间步长', config.timeStep)
      ]);
    case 'linear-system':
      return mergeValidationResults([
        ...baseResults,
        validateLinearSystemDimensions(config.unknowns, config.matrix, config.rhs)
      ]);
    case 'one-dimensional-transfer':
      return mergeValidationResults([
        ...baseResults,
        validatePositiveNumber('空间长度', config.length),
        validatePositiveNumber('网格数量', config.nodes),
        validatePositiveNumber('传热/扩散系数', config.coefficientValue),
        validatePositiveNumber('时间步长', config.timeStep)
      ]);
    case 'time-series-energy-balance':
      return mergeValidationResults([
        ...baseResults,
        validateEqualLengthSeries([
          ['发电功率序列', config.generationSeries],
          ['负荷功率序列', config.loadSeries]
        ]),
        validateSocBounds(config.socMin, config.socMax, config.initialSoc),
        validatePositiveNumber('储能容量', config.storageCapacity),
        validatePositiveNumber('时间步长', config.timeStep)
      ]);
    case 'optimization-dispatch':
      return mergeValidationResults([
        ...baseResults,
        validateEqualLengthSeries([
          ['电价序列', config.priceSeries],
          ['发电功率序列', config.generationSeries],
          ['负荷功率序列', config.loadSeries]
        ]),
        validateSocBounds(config.socMin, config.socMax, config.initialSoc),
        validatePositiveNumber('储能容量', config.storageCapacity),
        validatePositiveNumber('时间步长', config.timeStep)
      ]);
    default:
      return { valid: false, messages: ['未知模板类型'] };
  }
}
