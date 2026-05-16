import { TimeSeriesEnergyBalanceConfig, GeneratedNotebookParts } from '../templates/types';
import { parameterRows, pythonArray } from './helpers';

export function timeSeriesEnergyBalanceGenerator(config: TimeSeriesEnergyBalanceConfig): GeneratedNotebookParts {
  return {
    title: config.simulationName,
    problemDescription: config.problemDescription,
    assumptions: config.assumptions,
    parameterRows: [
      ...parameterRows(config),
      { name: 'storage_capacity', value: String(config.storageCapacity), unit: 'kWh', description: '储能容量' },
      { name: 'initial_soc', value: String(config.initialSoc), unit: '-', description: '初始 SOC' }
    ],
    mathModelMarkdown: `逐时能量平衡规则：\n\n1. 发电优先供负荷。\n2. 多余发电优先给储能充电。\n3. 储能满后产生弃电。\n4. 发电不足时储能放电。\n5. 储能不足时由电网补电。`,
    parameterCode: `# 参数层代码
duration = ${config.duration}
dt = ${config.timeStep}
generation = np.array(${pythonArray(config.generationSeries)}, dtype=float)
load = np.array(${pythonArray(config.loadSeries)}, dtype=float)
storage_capacity = ${config.storageCapacity}
max_charge_power = ${config.maxChargePower}
max_discharge_power = ${config.maxDischargePower}
soc_initial = ${config.initialSoc}
soc_min = ${config.socMin}
soc_max = ${config.socMax}
charge_efficiency = ${config.chargeEfficiency}
discharge_efficiency = ${config.dischargeEfficiency}`,
    modelCode: `# 模型层代码
print(${JSON.stringify(config.operationRule)})
time = np.arange(len(generation)) * dt
if len(generation) != len(load):
    raise ValueError("发电功率序列和负荷功率序列长度不一致")`,
    solverCode: `# 求解层代码
n = len(generation)
soc = np.zeros(n + 1)
charge_power = np.zeros(n)
discharge_power = np.zeros(n)
grid_import = np.zeros(n)
curtailment = np.zeros(n)
direct_use = np.zeros(n)
soc[0] = soc_initial

for t in range(n):
    available_generation = generation[t]
    current_load = load[t]
    direct_use[t] = min(available_generation, current_load)
    surplus = max(available_generation - current_load, 0.0)
    deficit = max(current_load - available_generation, 0.0)

    room_to_charge = max((soc_max - soc[t]) * storage_capacity / dt / charge_efficiency, 0.0)
    charge_power[t] = min(surplus, max_charge_power, room_to_charge)
    soc_after_charge = soc[t] + charge_power[t] * dt * charge_efficiency / storage_capacity
    curtailment[t] = surplus - charge_power[t]

    available_discharge = max((soc_after_charge - soc_min) * storage_capacity * discharge_efficiency / dt, 0.0)
    discharge_power[t] = min(deficit, max_discharge_power, available_discharge)
    soc[t + 1] = soc_after_charge - discharge_power[t] * dt / discharge_efficiency / storage_capacity
    grid_import[t] = deficit - discharge_power[t]

total_generation = np.sum(generation * dt)
total_load = np.sum(load * dt)
total_curtailment = np.sum(curtailment * dt)
total_grid_import = np.sum(grid_import * dt)
self_consumption = np.sum((direct_use + charge_power) * dt)
self_consumption_rate = self_consumption / total_generation if total_generation > 0 else 0
curtailment_rate = total_curtailment / total_generation if total_generation > 0 else 0

print(f"自消纳率: {self_consumption_rate:.2%}")
print(f"弃电率: {curtailment_rate:.2%}")
print(f"购电量: {total_grid_import:.3f} kWh")`,
    visualizationCode: `# 可视化层代码
fig, axes = plt.subplots(2, 1, figsize=(10, 8), sharex=True)
axes[0].plot(time, generation, label='发电功率', linewidth=2)
axes[0].plot(time, load, label='负荷功率', linewidth=2)
axes[0].plot(time, grid_import, label='电网购电', linewidth=1.8)
axes[0].plot(time, curtailment, label='弃电功率', linewidth=1.8)
axes[0].set_ylabel('功率')
axes[0].legend()
axes[0].grid(True, alpha=0.3)
axes[1].step(np.arange(n + 1) * dt, soc, where='post', linewidth=2, color='#336b37')
axes[1].set_xlabel('时间')
axes[1].set_ylabel('SOC')
axes[1].set_ylim(0, 1)
axes[1].grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`,
    resultCode: `# 结果分析层代码
print("关键结果输出")
print(f"总发电量: {total_generation:.3f} kWh")
print(f"总负荷量: {total_load:.3f} kWh")
print(f"总购电量: {total_grid_import:.3f} kWh")
print(f"总弃电量: {total_curtailment:.3f} kWh")
print(f"最终 SOC: {soc[-1]:.3f}")`,
    modificationHint: '可以修改发电/负荷数组、储能容量、功率限制和 SOC 上下限，比较系统运行指标。',
    analysisHint: '重点分析 SOC 是否频繁触及上下限，以及购电量、弃电量、自消纳率对储能配置的敏感性。'
  };
}
