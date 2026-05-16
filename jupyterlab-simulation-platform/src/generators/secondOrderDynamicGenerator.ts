import { SecondOrderDynamicConfig, GeneratedNotebookParts } from '../templates/types';
import { mathPreludeCode, normalizeFormulaExpression } from '../validators/formula';
import { parameterCode, parameterRows } from './helpers';

export function secondOrderDynamicGenerator(config: SecondOrderDynamicConfig): GeneratedNotebookParts {
  const forcing = normalizeFormulaExpression(config.forcingExpression);
  return {
    title: config.simulationName,
    problemDescription: config.problemDescription,
    assumptions: config.assumptions,
    parameterRows: parameterRows(config),
    mathModelMarkdown: `二阶动态系统可写成：\n\n$$m\\ddot{x}+c\\dot{x}+kx=F(t)$$\n\n令 $v=\\dot{x}$，转化为一阶方程组：\n\n$$\\dot{x}=v,\\quad \\dot{v}=\\frac{F(t)-cv-kx}{m}$$`,
    parameterCode: `# 参数层代码
${parameterCode(config.parameters)}
x0 = ${config.initialDisplacement}
v0 = ${config.initialVelocity}
time_end = ${config.timeEnd}
dt = ${config.timeStep}`,
    modelCode: `# 模型层代码
${mathPreludeCode()}

def external_force(t):
    return ${forcing}

def acceleration(t, x, v):
    return (external_force(t) - c * v - k * x) / m`,
    solverCode: `# 求解层代码
time = np.arange(0, time_end + dt, dt)
x = np.zeros_like(time, dtype=float)
v = np.zeros_like(time, dtype=float)
x[0] = x0
v[0] = v0

for i in range(1, len(time)):
    t_prev = time[i - 1]
    a_prev = acceleration(t_prev, x[i - 1], v[i - 1])
    v[i] = v[i - 1] + dt * a_prev
    x[i] = x[i - 1] + dt * v[i - 1]

print(f"最终位移 = {x[-1]:.6g}")
print(f"最终速度 = {v[-1]:.6g}")`,
    visualizationCode: `# 可视化层代码
fig, axes = plt.subplots(2, 1, figsize=(8, 7), sharex=True)
axes[0].plot(time, x, linewidth=2)
axes[0].set_ylabel('${config.displacementVariable}')
axes[0].grid(True, alpha=0.3)
axes[1].plot(time, v, linewidth=2, color='#9a5b13')
axes[1].set_xlabel('时间')
axes[1].set_ylabel('${config.velocityVariable}')
axes[1].grid(True, alpha=0.3)
fig.suptitle('二阶动态系统响应')
plt.tight_layout()
plt.show()`,
    resultCode: `# 结果分析层代码
print("关键结果输出")
print(f"最大位移: {np.max(x):.6g}")
print(f"最小位移: {np.min(x):.6g}")
print(f"最大速度绝对值: {np.max(np.abs(v)):.6g}")`,
    modificationHint: '可以修改 m、c、k、外部激励函数 external_force，比较欠阻尼、临界阻尼和过阻尼响应。',
    analysisHint: '重点分析响应峰值、稳定时间、振荡周期以及阻尼参数对动态过程的影响。'
  };
}
