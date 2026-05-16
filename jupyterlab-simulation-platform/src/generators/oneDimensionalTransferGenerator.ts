import { OneDimensionalTransferConfig, GeneratedNotebookParts } from '../templates/types';
import { parameterRows } from './helpers';

export function oneDimensionalTransferGenerator(config: OneDimensionalTransferConfig): GeneratedNotebookParts {
  const steadySolver = `# 求解层代码
dx = length / (nodes - 1)
x = np.linspace(0, length, nodes)

A = np.zeros((nodes, nodes))
b = np.zeros(nodes)

A[0, 0] = 1.0
b[0] = left_boundary
A[-1, -1] = 1.0
b[-1] = right_boundary

for i in range(1, nodes - 1):
    A[i, i - 1] = 1.0
    A[i, i] = -2.0
    A[i, i + 1] = 1.0

temperature = np.linalg.solve(A, b)
print(f"中心温度 = {temperature[nodes // 2]:.6g}")`;

  const transientSolver = `# 求解层代码
dx = length / (nodes - 1)
x = np.linspace(0, length, nodes)
time = np.arange(0, time_end + dt, dt)
Fo = coefficient * dt / dx**2
if Fo > 0.5:
    print(f"警告: 显式格式 Fourier 数 Fo={Fo:.3f} > 0.5，结果可能不稳定")
else:
    print(f"Fourier 数 Fo={Fo:.3f}")

temperature = np.full(nodes, initial_condition, dtype=float)
temperature[0] = left_boundary
temperature[-1] = right_boundary
snapshots = []
snapshot_steps = set(np.linspace(0, len(time) - 1, 5, dtype=int))

for step, current_time in enumerate(time):
    if step in snapshot_steps:
        snapshots.append((current_time, temperature.copy()))
    next_temperature = temperature.copy()
    for i in range(1, nodes - 1):
        next_temperature[i] = temperature[i] + Fo * (
            temperature[i - 1] - 2 * temperature[i] + temperature[i + 1]
        )
    next_temperature[0] = left_boundary
    next_temperature[-1] = right_boundary
    temperature = next_temperature

print(f"最终中心温度 = {temperature[nodes // 2]:.6g}")`;

  const visualization = config.problemType === 'steady'
    ? `# 可视化层代码
plt.figure(figsize=(8, 5))
plt.plot(x, temperature, marker='o', linewidth=2)
plt.xlabel('空间位置 x')
plt.ylabel('场变量')
plt.title('一维稳态传热/扩散分布')
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`
    : `# 可视化层代码
plt.figure(figsize=(8, 5))
for current_time, snapshot in snapshots:
    plt.plot(x, snapshot, marker='o', linewidth=1.8, label=f't={current_time:.2f}')
plt.xlabel('空间位置 x')
plt.ylabel('场变量')
plt.title('一维瞬态传热/扩散过程')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`;

  return {
    title: config.simulationName,
    problemDescription: config.problemDescription,
    assumptions: config.assumptions,
    parameterRows: [
      ...parameterRows(config),
      { name: config.coefficientName, value: String(config.coefficientValue), unit: 'm^2/s 或 W/(m·K)', description: '扩散或导热系数' }
    ],
    mathModelMarkdown: `一维传热/扩散控制方程：\n\n$$\\frac{\\partial T}{\\partial t}=\\alpha\\frac{\\partial^2T}{\\partial x^2}$$\n\n稳态时退化为：\n\n$$\\frac{d^2T}{dx^2}=0$$`,
    parameterCode: `# 参数层代码
problem_type = ${JSON.stringify(config.problemType)}
length = ${config.length}
nodes = ${config.nodes}
coefficient = ${config.coefficientValue}
initial_condition = ${config.initialCondition}
left_boundary = ${config.leftBoundary}
right_boundary = ${config.rightBoundary}
time_end = ${config.timeEnd}
dt = ${config.timeStep}`,
    modelCode: `# 模型层代码
print("问题类型:", "稳态" if problem_type == "steady" else "瞬态")
print("边界条件: T(0) =", left_boundary, ", T(L) =", right_boundary)`,
    solverCode: config.problemType === 'steady' ? steadySolver : transientSolver,
    visualizationCode: visualization,
    resultCode: `# 结果分析层代码
print("关键结果输出")
print(f"左边界: {temperature[0]:.6g}")
print(f"中心点: {temperature[len(temperature)//2]:.6g}")
print(f"右边界: {temperature[-1]:.6g}")`,
    modificationHint: '可以修改网格数量、边界条件、扩散系数或时间步长，观察稳定性和分布变化。',
    analysisHint: '稳态问题关注空间梯度；瞬态问题还要检查 Fourier 数和不同时间快照的变化。'
  };
}
