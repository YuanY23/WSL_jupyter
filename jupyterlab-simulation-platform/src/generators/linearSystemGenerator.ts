import { LinearSystemConfig, GeneratedNotebookParts } from '../templates/types';
import { parameterRows, pythonArray, pythonMatrix } from './helpers';

export function linearSystemGenerator(config: LinearSystemConfig): GeneratedNotebookParts {
  const visualization = config.plotNodes
    ? `# 可视化层代码
plt.figure(figsize=(8, 5))
plt.bar(unknowns, x, color='#356f8f')
plt.xlabel('未知量')
plt.ylabel('求解结果')
plt.title('线性方程组节点结果')
plt.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.show()`
    : `# 可视化层代码
plt.figure(figsize=(8, 5))
plt.plot(np.arange(len(x)), x, marker='o', linewidth=2)
plt.xticks(np.arange(len(x)), unknowns)
plt.xlabel('未知量')
plt.ylabel('求解结果')
plt.title('线性方程组求解结果')
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`;

  return {
    title: config.simulationName,
    problemDescription: config.problemDescription,
    assumptions: config.assumptions,
    parameterRows: [
      ...parameterRows(config),
      { name: 'unknowns', value: String(config.unknowns.length), unit: '-', description: '未知量数量' }
    ],
    mathModelMarkdown: `矩阵方程统一写成：\n\n$$A x = b$$\n\n未知量：${config.unknowns.join(', ')}`,
    parameterCode: `# 参数层代码
unknowns = ${JSON.stringify(config.unknowns)}
A = np.array(${pythonMatrix(config.matrix)}, dtype=float)
b = np.array(${pythonArray(config.rhs)}, dtype=float)`,
    modelCode: `# 模型层代码
equation_descriptions = ${JSON.stringify(config.equationDescriptions, null, 2)}
for index, description in enumerate(equation_descriptions, start=1):
    print(f"方程 {index}: {description}")`,
    solverCode: `# 求解层代码
det_A = np.linalg.det(A)
if abs(det_A) < 1e-12:
    raise ValueError("系数矩阵接近奇异，无法稳定求解")

x = np.linalg.solve(A, b)
residual = A @ x - b

for name, value in zip(unknowns, x):
    print(f"{name} = {value:.6g}")
print(f"最大残差: {np.max(np.abs(residual)):.3e}")`,
    visualizationCode: visualization,
    resultCode: `# 结果分析层代码
print("关键结果输出")
for name, value in zip(unknowns, x):
    print(f"{name}: {value:.6g}")
print("残差向量:", residual)`,
    modificationHint: '可以修改 A、b 或未知量名称，重新运行求解层和可视化层观察节点平衡结果。',
    analysisHint: '重点检查矩阵是否病态、残差是否足够小，以及各节点结果是否符合工程直觉。'
  };
}
