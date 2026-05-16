import { OptimizationDispatchConfig, GeneratedNotebookParts } from '../templates/types';
import { parameterRows, pythonArray } from './helpers';

export function optimizationDispatchGenerator(config: OptimizationDispatchConfig): GeneratedNotebookParts {
  return {
    title: config.simulationName,
    problemDescription: config.problemDescription,
    assumptions: config.assumptions,
    parameterRows: [
      ...parameterRows(config),
      { name: 'objective', value: config.objective, unit: '-', description: '优化目标' },
      { name: 'storage_capacity', value: String(config.storageCapacity), unit: 'kWh', description: '储能容量' }
    ],
    mathModelMarkdown: `优化调度问题：\n\n目标函数：最小化逐时购电成本。\n\n主要约束包括功率平衡、SOC 动态方程、SOC 上下限、充放电功率限制。`,
    parameterCode: `# 参数层代码
dt = ${config.timeStep}
time_horizon = ${config.timeHorizon}
price = np.array(${pythonArray(config.priceSeries)}, dtype=float)
load = np.array(${pythonArray(config.loadSeries)}, dtype=float)
generation = np.array(${pythonArray(config.generationSeries)}, dtype=float)
storage_capacity = ${config.storageCapacity}
max_charge_power = ${config.maxChargePower}
max_discharge_power = ${config.maxDischargePower}
soc_initial = ${config.initialSoc}
soc_min = ${config.socMin}
soc_max = ${config.socMax}
charge_efficiency = ${config.chargeEfficiency}
discharge_efficiency = ${config.dischargeEfficiency}`,
    modelCode: `# 模型层代码
try:
    from scipy.optimize import linprog
except ImportError as exc:
    raise ImportError("简单优化调度模板需要 scipy.optimize.linprog，请在当前 Python 环境安装 scipy") from exc

n = len(load)
if not (len(price) == len(load) == len(generation)):
    raise ValueError("电价、负荷和发电序列长度必须一致")

# 决策变量按顺序排列：
# charge[0:n], discharge[0:n], grid_import[0:n], curtailment[0:n], soc[0:n+1]
def idx_charge(t): return t
def idx_discharge(t): return n + t
def idx_grid(t): return 2 * n + t
def idx_curtail(t): return 3 * n + t
def idx_soc(t): return 4 * n + t

num_variables = 4 * n + (n + 1)`,
    solverCode: `# 求解层代码
c = np.zeros(num_variables)
for t in range(n):
    c[idx_grid(t)] = price[t] * dt
    c[idx_curtail(t)] = 1e-6 * dt

bounds = []
for t in range(n):
    bounds.append((0, max_charge_power))
for t in range(n):
    bounds.append((0, max_discharge_power))
for t in range(n):
    bounds.append((0, None))
for t in range(n):
    bounds.append((0, None))
for t in range(n + 1):
    bounds.append((soc_min, soc_max))

A_eq = []
b_eq = []

# 初始 SOC 约束
row = np.zeros(num_variables)
row[idx_soc(0)] = 1.0
A_eq.append(row)
b_eq.append(soc_initial)

for t in range(n):
    # 功率平衡：发电 + 放电 + 购电 = 负荷 + 充电 + 弃电
    row = np.zeros(num_variables)
    row[idx_discharge(t)] = 1.0
    row[idx_grid(t)] = 1.0
    row[idx_charge(t)] = -1.0
    row[idx_curtail(t)] = -1.0
    A_eq.append(row)
    b_eq.append(load[t] - generation[t])

    # SOC 动态
    row = np.zeros(num_variables)
    row[idx_soc(t + 1)] = 1.0
    row[idx_soc(t)] = -1.0
    row[idx_charge(t)] = -dt * charge_efficiency / storage_capacity
    row[idx_discharge(t)] = dt / discharge_efficiency / storage_capacity
    A_eq.append(row)
    b_eq.append(0.0)

result = linprog(
    c,
    A_eq=np.array(A_eq),
    b_eq=np.array(b_eq),
    bounds=bounds,
    method='highs'
)

if not result.success:
    raise RuntimeError(f"优化求解失败: {result.message}")

solution = result.x
charge = np.array([solution[idx_charge(t)] for t in range(n)])
discharge = np.array([solution[idx_discharge(t)] for t in range(n)])
grid_import = np.array([solution[idx_grid(t)] for t in range(n)])
curtailment = np.array([solution[idx_curtail(t)] for t in range(n)])
soc = np.array([solution[idx_soc(t)] for t in range(n + 1)])
total_cost = np.sum(price * grid_import * dt)

print(f"最小购电成本: {total_cost:.4f}")
print(f"总购电量: {np.sum(grid_import * dt):.4f}")`,
    visualizationCode: `# 可视化层代码
time = np.arange(n) * dt
fig, axes = plt.subplots(3, 1, figsize=(10, 9), sharex=True)
axes[0].plot(time, load, label='负荷', linewidth=2)
axes[0].plot(time, generation, label='发电', linewidth=2)
axes[0].plot(time, grid_import, label='购电', linewidth=1.8)
axes[0].set_ylabel('功率')
axes[0].legend()
axes[0].grid(True, alpha=0.3)

axes[1].bar(time, charge, width=0.8 * dt, label='充电', alpha=0.75)
axes[1].bar(time, -discharge, width=0.8 * dt, label='放电', alpha=0.75)
axes[1].set_ylabel('储能功率')
axes[1].legend()
axes[1].grid(True, alpha=0.3)

axes[2].step(np.arange(n + 1) * dt, soc, where='post', linewidth=2, color='#365f39')
axes[2].set_xlabel('时间')
axes[2].set_ylabel('SOC')
axes[2].set_ylim(0, 1)
axes[2].grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`,
    resultCode: `# 结果分析层代码
print("关键结果输出")
print(f"总成本: {total_cost:.4f}")
print(f"总购电量: {np.sum(grid_import * dt):.4f}")
print(f"总弃电量: {np.sum(curtailment * dt):.4f}")
print(f"最终 SOC: {soc[-1]:.3f}")`,
    modificationHint: '可以修改电价曲线、负荷/发电曲线、储能容量和功率约束，比较最优调度策略。',
    analysisHint: '重点分析高电价时段是否减少购电，SOC 是否遵守约束，以及储能容量变化对成本的影响。'
  };
}
