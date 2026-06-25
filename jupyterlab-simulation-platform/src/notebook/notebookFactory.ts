import { algebraicFormulaGenerator } from '../generators/algebraicFormulaGenerator';
import { firstOrderDynamicGenerator } from '../generators/firstOrderDynamicGenerator';
import { linearSystemGenerator } from '../generators/linearSystemGenerator';
import { oneDimensionalTransferGenerator } from '../generators/oneDimensionalTransferGenerator';
import { optimizationDispatchGenerator } from '../generators/optimizationDispatchGenerator';
import { secondOrderDynamicGenerator } from '../generators/secondOrderDynamicGenerator';
import { timeSeriesEnergyBalanceGenerator } from '../generators/timeSeriesEnergyBalanceGenerator';
import { assumptionsMarkdown, parameterBindingMetadataFromCode, parameterTableMarkdown } from '../generators/helpers';
import {
  AlgebraicFormulaConfig,
  FirstOrderDynamicConfig,
  GeneratedNotebookParts,
  GenericSimulationConfig,
  LinearSystemConfig,
  NotebookCell,
  NotebookModel,
  OneDimensionalTransferConfig,
  OptimizationDispatchConfig,
  SecondOrderDynamicConfig,
  SimulationConfig,
  TemplateId,
  TimeSeriesEnergyBalanceConfig
} from '../templates/types';
import { codeCell, makeNotebook, markdownCell } from './cells';

export const GENERIC_NOTEBOOK_OUTLINE = [
  '1. 仿真问题说明',
  '2. 模型假设',
  '3. 参数说明表',
  '4. 数学模型或计算规则',
  '5. 计算环境',
  '6. 参数层代码',
  '7. 模型层代码',
  '8. 求解层代码',
  '9. 可视化层代码',
  '10. 关键结果输出',
  '11. 可修改参数提示',
  '12. 结果分析提示'
];

export const NOTEBOOK_OUTLINE = [
  '标题',
  ...GENERIC_NOTEBOOK_OUTLINE.map(item => item.replace(/^\d+\.\s/u, ''))
];

function generateParts(templateId: TemplateId, config: SimulationConfig): GeneratedNotebookParts {
  switch (templateId) {
    case 'algebraic-formula':
      return algebraicFormulaGenerator(config as AlgebraicFormulaConfig);
    case 'first-order-dynamic':
      return firstOrderDynamicGenerator(config as FirstOrderDynamicConfig);
    case 'second-order-dynamic':
      return secondOrderDynamicGenerator(config as SecondOrderDynamicConfig);
    case 'linear-system':
      return linearSystemGenerator(config as LinearSystemConfig);
    case 'one-dimensional-transfer':
      return oneDimensionalTransferGenerator(config as OneDimensionalTransferConfig);
    case 'time-series-energy-balance':
      return timeSeriesEnergyBalanceGenerator(config as TimeSeriesEnergyBalanceConfig);
    case 'optimization-dispatch':
      return optimizationDispatchGenerator(config as OptimizationDispatchConfig);
    default:
      throw new Error(`未知模板类型: ${templateId}`);
  }
}

function genericCodePlaceholder(title: string): string {
  return `# ${title}
# 请在这里填写本部分代码。`;
}

function generateGenericSimulationNotebook(config: GenericSimulationConfig): NotebookModel {
  const cells = GENERIC_NOTEBOOK_OUTLINE.reduce((accumulator, title) => {
    accumulator.push(markdownCell(`## ${title}`));
    accumulator.push(codeCell(genericCodePlaceholder(title)));
    return accumulator;
  }, [] as NotebookCell[]);
  const notebook = makeNotebook(cells, config.programmingKernel);
  notebook.metadata.simulation_param_bindings = parameterBindingMetadataFromCode('', config.parameters);
  return notebook;
}

export function generateSimulationNotebook(templateId: TemplateId, config: SimulationConfig): NotebookModel {
  if (config.templateId !== templateId) {
    throw new Error(`模板 ID 不匹配: ${templateId} / ${config.templateId}`);
  }

  if (templateId === 'generic-simulation') {
    return generateGenericSimulationNotebook(config as GenericSimulationConfig);
  }

  const parts = generateParts(templateId, config);
  const notebook = makeNotebook([
    markdownCell(`# ${parts.title}`),
    markdownCell(`## 1. 仿真问题说明\n\n${parts.problemDescription}`),
    markdownCell(`## 2. 模型假设\n\n${assumptionsMarkdown(parts.assumptions)}`),
    markdownCell(`## 3. 参数说明表\n\n${parameterTableMarkdown(parts.parameterRows)}`),
    markdownCell(`## 4. 数学模型或计算规则\n\n${parts.mathModelMarkdown}`),
    markdownCell('## 5. 计算环境\n\n这里导入 Notebook 后续计算和绘图所需的基础库。'),
    codeCell(`# 基础计算环境
%matplotlib inline
import numpy as np
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = [
    'SimHei',
    'WenQuanYi Micro Hei',
    'WenQuanYi Zen Hei',
    'Microsoft YaHei',
    'sans-serif'
]
plt.rcParams['axes.unicode_minus'] = False`),
    markdownCell('## 6. 参数层代码\n\n这里定义仿真输入参数，用户可以直接修改这些参数观察结果变化。'),
    codeCell(parts.parameterCode),
    markdownCell('## 7. 模型层代码\n\n这里给出数学模型、控制方程、能量平衡关系或优化目标。'),
    codeCell(parts.modelCode),
    markdownCell('## 8. 求解层代码\n\n这里将数学模型转化为 Python 计算过程，并保留关键步骤追踪。'),
    codeCell(parts.solverCode),
    markdownCell('## 9. 可视化层代码\n\n这里绘制仿真结果图像，便于观察趋势、分布和调度结果。'),
    codeCell(parts.visualizationCode),
    markdownCell('## 10. 关键结果输出\n\n这里集中输出关键指标，便于记录和比较不同参数方案。'),
    codeCell(parts.resultCode),
    markdownCell(`## 11. 可修改参数提示\n\n${parts.modificationHint}`),
    markdownCell(`## 12. 结果分析提示\n\n${parts.analysisHint}`)
  ]);
  notebook.metadata.simulation_param_bindings = parameterBindingMetadataFromCode(
    parts.parameterCode,
    config.parameters
  );
  return notebook;
}
