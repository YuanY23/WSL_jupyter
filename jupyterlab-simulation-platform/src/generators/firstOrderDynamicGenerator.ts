import { FirstOrderDynamicConfig, GeneratedNotebookParts } from '../templates/types';
import { mathPreludeCode, normalizeFormulaExpression } from '../validators/formula';
import { parameterCode, parameterRows } from './helpers';

export function firstOrderDynamicGenerator(config: FirstOrderDynamicConfig): GeneratedNotebookParts {
  const equation = normalizeFormulaExpression(config.stateEquation);
  return {
    title: config.simulationName,
    problemDescription: config.problemDescription,
    assumptions: config.assumptions,
    parameterRows: parameterRows(config),
    mathModelMarkdown: `一阶动态系统写成：\n\n$$\\frac{d${config.stateVariable}}{dt} = f(t, ${config.stateVariable}, p)$$\n\n本模板使用显式欧拉法离散：\n\n$$x_{k+1}=x_k+\\Delta t\\cdot f(t_k,x_k,p)$$`,
    parameterCode: `# 参数层代码
${parameterCode(config.parameters)}
state_initial = ${config.initialValue}
time_start = ${config.timeStart}
time_end = ${config.timeEnd}
dt = ${config.timeStep}`,
    modelCode: `# 模型层代码
${mathPreludeCode()}

def derivative(t, ${config.stateVariable}):
    return ${equation}`,
    solverCode: `# 求解层代码
time = np.arange(time_start, time_end + dt, dt)
${config.stateVariable}_series = np.zeros_like(time, dtype=float)
${config.stateVariable}_series[0] = state_initial

for i in range(1, len(time)):
    t_prev = time[i - 1]
    ${config.stateVariable} = ${config.stateVariable}_series[i - 1]
    dstate_dt = derivative(t_prev, ${config.stateVariable})
    ${config.stateVariable}_series[i] = ${config.stateVariable} + dt * dstate_dt

print(f"最终 ${config.stateVariable} = {${config.stateVariable}_series[-1]:.6g}")`,
    visualizationCode: `# 可视化层代码
plt.figure(figsize=(8, 5))
plt.plot(time, ${config.stateVariable}_series, linewidth=2)
plt.xlabel('时间')
plt.ylabel('${config.stateVariable}')
plt.title('${config.stateVariable} 随时间变化')
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`,
    resultCode: `# 结果分析层代码
print("关键结果输出")
print(f"初始值: {${config.stateVariable}_series[0]:.6g}")
print(f"最终值: {${config.stateVariable}_series[-1]:.6g}")
print(f"最大值: {${config.stateVariable}_series.max():.6g}")
print(f"最小值: {${config.stateVariable}_series.min():.6g}")`,
    modificationHint: '可以修改初始值、时间步长或 derivative 函数中的状态方程，观察动态响应变化。',
    analysisHint: '重点观察状态变量是否收敛、发散、振荡或达到工程限制值。'
  };
}
