import { AlgebraicFormulaConfig, GeneratedNotebookParts } from '../templates/types';
import { mathPreludeCode, normalizeFormulaExpression } from '../validators/formula';
import { parameterCode, parameterRows, pythonArray } from './helpers';

export function algebraicFormulaGenerator(config: AlgebraicFormulaConfig): GeneratedNotebookParts {
  const formula = normalizeFormulaExpression(config.formula);
  const scanValues = Array.from({ length: config.scanPoints }, (_item, index) => {
    if (config.scanPoints <= 1) {
      return config.scanStart;
    }
    return config.scanStart + (config.scanEnd - config.scanStart) * index / (config.scanPoints - 1);
  });

  const modelCode = [
    '# 模型层代码',
    '# 这里把用户填写的经验公式转换成可直接执行的 Python 表达式。',
    mathPreludeCode(),
    '',
    `formula_text = ${JSON.stringify(config.formula)}`,
    `output_variable = ${JSON.stringify(config.outputVariable)}`
  ].join('\n');

  const scanCode = config.enableParameterScan
    ? `
# 参数扫描：改变一个输入参数，观察输出变量的响应
scan_parameter = ${JSON.stringify(config.scanParameter)}
scan_values = np.array(${pythonArray(scanValues)}, dtype=float)
scan_results = []

for value in scan_values:
    ${config.scanParameter} = value
    ${config.outputVariable} = ${formula}
    scan_results.append(${config.outputVariable})

scan_results = np.array(scan_results, dtype=float)
print(f"扫描参数: {scan_parameter}")
print(f"输出变量范围: {scan_results.min():.4g} 到 {scan_results.max():.4g}")`
    : '';

  const visualizationCode = config.enableParameterScan
    ? `# 可视化层代码
plt.figure(figsize=(8, 5))
${config.chartType === 'bar'
      ? `plt.bar(scan_values, scan_results, width=(scan_values.max() - scan_values.min()) / max(len(scan_values), 1) * 0.75)`
      : `plt.plot(scan_values, scan_results, marker='o', linewidth=2)`}
plt.xlabel(scan_parameter)
plt.ylabel(output_variable)
plt.title(f"{output_variable} 随 {scan_parameter} 变化")
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`
    : `# 可视化层代码
plt.figure(figsize=(6, 4))
plt.bar([output_variable], [${config.outputVariable}], color='#2f6f73')
plt.ylabel(output_variable)
plt.title('公式计算结果')
plt.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.show()`;

  return {
    title: config.simulationName,
    problemDescription: config.problemDescription,
    assumptions: config.assumptions,
    parameterRows: parameterRows(config),
    mathModelMarkdown: `经验公式：\n\n$$${config.outputVariable} = ${config.formula}$$`,
    parameterCode: `# 参数层代码\n${parameterCode(config.parameters)}`,
    modelCode,
    solverCode: `# 求解层代码
${config.outputVariable} = ${formula}
print(f"${config.outputVariable} = {${config.outputVariable}:.6g}")${scanCode}`,
    visualizationCode,
    resultCode: `# 结果分析层代码
print("关键结果输出")
print(f"${config.outputVariable}: {${config.outputVariable}:.6g}")`,
    modificationHint: '可以优先修改参数层代码中的输入参数，或替换模型层中的经验公式，再重新运行后续单元。',
    analysisHint: '观察输出变量对关键参数的敏感性；如果开启参数扫描，可比较曲线斜率或柱状差异。'
  };
}
