export type SolarProfileId = 'summer_clear' | 'winter_clear' | 'cloudy_variable' | 'overcast_low';
export type DispatchStrategyId = 'rated_when_available' | 'daytime_priority' | 'evening_peak_priority';

export interface CspExampleConfig {
  exampleName: string;
  solarProfile: SolarProfileId;
  collectorArea: number;
  opticalEfficiency: number;
  receiverLossCoefficient: number;
  storageTankVolume: number;
  hotSaltTemperature: number;
  coldSaltTemperature: number;
  moltenSaltDensity: number;
  moltenSaltSpecificHeat: number;
  powerBlockRatedPower: number;
  powerBlockEfficiency: number;
  heatExchangerEfficiency: number;
  initialHotTankLevelPercent: number;
  dispatchStrategy: DispatchStrategyId;
}

export type ParamControlType = 'slider' | 'number' | 'dropdown' | 'boolean' | 'text';

export interface ParamControlConfig {
  type: ParamControlType;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  group?: string;
}

interface NotebookCell {
  id?: string;
  cell_type: 'markdown' | 'code';
  metadata: Record<string, any>;
  source: string[];
  execution_count?: number | null;
  outputs?: any[];
}

export interface NotebookModel {
  cells: NotebookCell[];
  metadata: Record<string, any>;
  nbformat: 4;
  nbformat_minor: 5;
}

export const DEFAULT_CSP_CONFIG: CspExampleConfig = {
  exampleName: '槽式太阳能光热发电集热-储热-发电联合过程',
  solarProfile: 'summer_clear',
  collectorArea: 510000,
  opticalEfficiency: 0.73,
  receiverLossCoefficient: 0.42,
  storageTankVolume: 25500,
  hotSaltTemperature: 565,
  coldSaltTemperature: 290,
  moltenSaltDensity: 1800,
  moltenSaltSpecificHeat: 1.53,
  powerBlockRatedPower: 110,
  powerBlockEfficiency: 0.385,
  heatExchangerEfficiency: 0.96,
  initialHotTankLevelPercent: 35,
  dispatchStrategy: 'rated_when_available'
};

export const SOLAR_PROFILE_LABELS: Record<SolarProfileId, string> = {
  summer_clear: '夏季晴天',
  winter_clear: '冬季晴天',
  cloudy_variable: '多云波动日',
  overcast_low: '阴天低辐射日'
};

export const DISPATCH_STRATEGY_LABELS: Record<DispatchStrategyId, string> = {
  rated_when_available: '可用热量优先满发',
  daytime_priority: '白天优先发电',
  evening_peak_priority: '晚高峰优先发电'
};

export const CSP_PARAMETER_BINDINGS: Record<string, ParamControlConfig> = {
  solar_profile: {
    type: 'dropdown',
    label: '典型日照辐射谱',
    options: ['summer_clear', 'winter_clear', 'cloudy_variable', 'overcast_low'],
    group: '太阳辐射输入'
  },
  dispatch_strategy: {
    type: 'dropdown',
    label: '发电调度策略',
    options: ['rated_when_available', 'daytime_priority', 'evening_peak_priority'],
    group: '运行策略'
  },
  collector_area: {
    type: 'slider',
    label: '太阳能集热场面积 (m^2)',
    min: 100000,
    max: 900000,
    step: 10000,
    group: '集热场'
  },
  optical_efficiency: {
    type: 'slider',
    label: '集热场光学效率 (-)',
    min: 0.45,
    max: 0.85,
    step: 0.01,
    group: '集热场'
  },
  receiver_loss_coefficient: {
    type: 'slider',
    label: '接收器热损失系数 (W/m^2/K)',
    min: 0.1,
    max: 1.5,
    step: 0.01,
    group: '集热场'
  },
  storage_tank_volume: {
    type: 'slider',
    label: '单罐有效容积 (m^3)',
    min: 5000,
    max: 45000,
    step: 500,
    group: '双罐熔盐储热'
  },
  hot_salt_temperature: {
    type: 'slider',
    label: '热盐设计温度 (degC)',
    min: 480,
    max: 590,
    step: 1,
    group: '双罐熔盐储热'
  },
  cold_salt_temperature: {
    type: 'slider',
    label: '冷盐设计温度 (degC)',
    min: 240,
    max: 330,
    step: 1,
    group: '双罐熔盐储热'
  },
  molten_salt_density: {
    type: 'number',
    label: '熔盐密度 (kg/m^3)',
    min: 1500,
    max: 2100,
    step: 10,
    group: '双罐熔盐储热'
  },
  molten_salt_specific_heat: {
    type: 'number',
    label: '熔盐定压比热 (kJ/kg/K)',
    min: 1.1,
    max: 1.8,
    step: 0.01,
    group: '双罐熔盐储热'
  },
  initial_hot_tank_level_percent: {
    type: 'slider',
    label: '初始热盐罐液位 (%)',
    min: 0,
    max: 100,
    step: 1,
    group: '双罐熔盐储热'
  },
  power_block_rated_power: {
    type: 'slider',
    label: '汽轮机额定电功率 (MW)',
    min: 30,
    max: 250,
    step: 5,
    group: '发电子系统'
  },
  power_block_efficiency: {
    type: 'slider',
    label: '热功到电功效率 (-)',
    min: 0.25,
    max: 0.45,
    step: 0.005,
    group: '发电子系统'
  },
  heat_exchanger_efficiency: {
    type: 'slider',
    label: '油盐换热效率 (-)',
    min: 0.8,
    max: 0.99,
    step: 0.005,
    group: '换热设备'
  }
};

function lineArray(source: string): string[] {
  return source.split('\n').map(line => `${line}\n`);
}

function markdownCell(source: string): NotebookCell {
  return {
    cell_type: 'markdown',
    metadata: {},
    source: lineArray(source)
  };
}

function codeCell(source: string): NotebookCell {
  return {
    cell_type: 'code',
    metadata: {},
    execution_count: null,
    outputs: [],
    source: lineArray(source)
  };
}

function pythonString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function parameterCode(config: CspExampleConfig): string {
  return `# 参数层代码
solar_profile = ${pythonString(config.solarProfile)}
dispatch_strategy = ${pythonString(config.dispatchStrategy)}

# 槽式集热场参数
collector_area = ${config.collectorArea}              # m^2, 槽式反射镜总开口面积
optical_efficiency = ${config.opticalEfficiency}      # -, 反射、跟踪、遮挡和接收综合效率
receiver_loss_coefficient = ${config.receiverLossCoefficient}  # W/(m^2*K), 接收器等效热损失系数

# 双罐熔盐储热参数
storage_tank_volume = ${config.storageTankVolume}     # m^3, 单罐有效容积
hot_salt_temperature = ${config.hotSaltTemperature}   # degC, 热盐设计温度
cold_salt_temperature = ${config.coldSaltTemperature} # degC, 冷盐设计温度
molten_salt_density = ${config.moltenSaltDensity}     # kg/m^3
molten_salt_specific_heat = ${config.moltenSaltSpecificHeat}  # kJ/(kg*K)
initial_hot_tank_level_percent = ${config.initialHotTankLevelPercent}  # %

# 发电子系统与换热设备
power_block_rated_power = ${config.powerBlockRatedPower}  # MW_e
power_block_efficiency = ${config.powerBlockEfficiency}   # -, thermal -> electric
heat_exchanger_efficiency = ${config.heatExchangerEfficiency}  # -, 集热回路到熔盐/蒸汽侧有效换热效率`;
}

const environmentCode = `# 基础计算环境
%matplotlib inline
import numpy as np
import matplotlib.pyplot as plt
from IPython.display import Markdown, display

plt.rcParams['font.sans-serif'] = [
    'SimHei',
    'WenQuanYi Micro Hei',
    'WenQuanYi Zen Hei',
    'Microsoft YaHei',
    'sans-serif'
]
plt.rcParams['axes.unicode_minus'] = False`;

const tableHelperCode = `# 轻量表格输出工具，避免引入额外依赖
def markdown_table(rows, columns):
    header = '| ' + ' | '.join(columns) + ' |'
    separator = '| ' + ' | '.join(['---'] * len(columns)) + ' |'
    body = []
    for row in rows:
        body.append('| ' + ' | '.join(str(row.get(column, '')) for column in columns) + ' |')
    return '\\n'.join([header, separator] + body)`;

const inputProfileCode = `# 太阳辐射与环境输入层代码
hours = list(range(24))

# DNI 单位: W/m^2。这里给出四种典型日照辐射谱。
dni_profiles = {
    'summer_clear': [0, 0, 0, 0, 0, 80, 260, 520, 720, 840, 910, 940, 930, 880, 760, 560, 320, 100, 0, 0, 0, 0, 0, 0],
    'winter_clear': [0, 0, 0, 0, 0, 0, 90, 280, 480, 610, 690, 720, 700, 620, 470, 260, 80, 0, 0, 0, 0, 0, 0, 0],
    'cloudy_variable': [0, 0, 0, 0, 0, 40, 180, 360, 650, 410, 760, 520, 690, 330, 580, 260, 120, 20, 0, 0, 0, 0, 0, 0],
    'overcast_low': [0, 0, 0, 0, 0, 10, 45, 90, 140, 170, 190, 210, 200, 175, 130, 75, 25, 0, 0, 0, 0, 0, 0, 0]
}

ambient_temperature_profiles = {
    'summer_clear': [24, 23, 23, 22, 22, 23, 25, 28, 31, 34, 36, 38, 39, 39, 38, 36, 33, 30, 28, 27, 26, 25, 25, 24],
    'winter_clear': [4, 4, 3, 3, 3, 4, 6, 8, 11, 14, 16, 18, 19, 18, 16, 13, 10, 7, 6, 5, 5, 4, 4, 4],
    'cloudy_variable': [18, 18, 17, 17, 17, 18, 20, 22, 24, 25, 26, 27, 27, 26, 25, 23, 21, 20, 19, 19, 18, 18, 18, 18],
    'overcast_low': [12, 12, 12, 11, 11, 12, 13, 14, 15, 16, 17, 17, 17, 16, 15, 14, 13, 12, 12, 12, 12, 12, 12, 12]
}

dni_series = np.array(dni_profiles[solar_profile], dtype=float)
ambient_temperature = np.array(ambient_temperature_profiles[solar_profile], dtype=float)`;

const modelCode = `# 模型层代码
# 该示例采用规则驱动的 24 小时动态 process 仿真，而不是单点公式计算。
# 时间步长为 1 h。每一步依次计算: 集热场可用热量 -> 满足汽轮机热需求 -> 充/放熔盐储热 -> 更新双罐液位。
time_step_hours = 1.0

receiver_temperature = 0.5 * (hot_salt_temperature + cold_salt_temperature)
delta_salt_temperature = hot_salt_temperature - cold_salt_temperature
if delta_salt_temperature <= 0:
    raise ValueError('热盐温度必须高于冷盐温度。')

# 单罐有效容积决定可转移的最大热盐质量。冷盐罐与热盐罐等容，质量在两罐间转移。
max_hot_salt_mass = storage_tank_volume * molten_salt_density  # kg
storage_capacity_mwh_th = (
    max_hot_salt_mass
    * molten_salt_specific_heat
    * delta_salt_temperature
    / 3_600_000
)  # MWh_th

stored_energy_mwh = storage_capacity_mwh_th * initial_hot_tank_level_percent / 100
rated_thermal_power_mw = power_block_rated_power / power_block_efficiency
minimum_stable_thermal_power_mw = 0.25 * rated_thermal_power_mw

def target_thermal_power(hour):
    """根据策略给出每小时汽轮机目标热功率需求。"""
    if dispatch_strategy == 'rated_when_available':
        return rated_thermal_power_mw
    if dispatch_strategy == 'daytime_priority':
        return rated_thermal_power_mw if 8 <= hour <= 18 else 0.35 * rated_thermal_power_mw
    if dispatch_strategy == 'evening_peak_priority':
        if 18 <= hour <= 22:
            return rated_thermal_power_mw
        if 8 <= hour <= 17:
            return 0.65 * rated_thermal_power_mw
        return 0.25 * rated_thermal_power_mw
    raise ValueError(f'未知调度策略: {dispatch_strategy}')

def collector_useful_power(dni, ambient):
    """槽式集热场可用热功率，单位 MW_th。"""
    incident_power_mw = dni * collector_area / 1_000_000
    optical_power_mw = incident_power_mw * optical_efficiency
    receiver_loss_mw = (
        receiver_loss_coefficient
        * collector_area
        * max(receiver_temperature - ambient, 0)
        / 1_000_000
    )
    return max((optical_power_mw - receiver_loss_mw) * heat_exchanger_efficiency, 0)`;

const solverCode = `# 求解层代码
storage_energy_mwh = []
hot_tank_level_percent = []
cold_tank_level_percent = []
power_output_mw = []
useful_collector_power_mw = []
curtailed_heat_mwh = []
charged_heat_mwh = []
discharged_heat_mwh = []
thermal_to_powerblock_mwh = []
mode_by_hour = []

for hour, dni in enumerate(dni_series):
    ambient = ambient_temperature[hour]
    useful_power = collector_useful_power(dni, ambient)
    solar_heat_mwh = useful_power * time_step_hours
    target_heat_mwh = target_thermal_power(hour) * time_step_hours

    charge = 0.0
    discharge = 0.0
    curtailment = 0.0
    thermal_for_generation = 0.0

    if solar_heat_mwh >= target_heat_mwh:
        thermal_for_generation = target_heat_mwh
        surplus = solar_heat_mwh - target_heat_mwh
        remaining_storage_capacity = storage_capacity_mwh_th - stored_energy_mwh
        charge = min(surplus, max(remaining_storage_capacity, 0))
        curtailment = max(surplus - charge, 0)
        stored_energy_mwh += charge

        if curtailment > 1e-9:
            mode = 'curtailment'
        elif charge > 1e-9:
            mode = 'solar_generation_and_charge'
        else:
            mode = 'solar_direct_generation'
    else:
        deficit = target_heat_mwh - solar_heat_mwh
        available_discharge = min(deficit, stored_energy_mwh)
        candidate_generation_heat = solar_heat_mwh + available_discharge

        if candidate_generation_heat >= minimum_stable_thermal_power_mw * time_step_hours:
            discharge = available_discharge
            stored_energy_mwh -= discharge
            thermal_for_generation = candidate_generation_heat
            mode = 'storage_discharge' if solar_heat_mwh < 1e-9 else 'solar_storage_support'
        else:
            thermal_for_generation = 0.0
            mode = 'standby'

    electric_power = thermal_for_generation / time_step_hours * power_block_efficiency
    hot_level = 100 * stored_energy_mwh / storage_capacity_mwh_th
    cold_level = 100 - hot_level

    useful_collector_power_mw.append(useful_power)
    storage_energy_mwh.append(stored_energy_mwh)
    hot_tank_level_percent.append(hot_level)
    cold_tank_level_percent.append(cold_level)
    power_output_mw.append(electric_power)
    charged_heat_mwh.append(charge)
    discharged_heat_mwh.append(discharge)
    curtailed_heat_mwh.append(curtailment)
    thermal_to_powerblock_mwh.append(thermal_for_generation)
    mode_by_hour.append(mode)

results = []
for index, hour in enumerate(hours):
    results.append({
        'hour': hour,
        'DNI_W_m2': round(float(dni_series[index]), 2),
        'ambient_degC': round(float(ambient_temperature[index]), 2),
        'collector_useful_power_MWth': round(float(useful_collector_power_mw[index]), 3),
        'charge_MWhth': round(float(charged_heat_mwh[index]), 3),
        'discharge_MWhth': round(float(discharged_heat_mwh[index]), 3),
        'curtailment_MWhth': round(float(curtailed_heat_mwh[index]), 3),
        'storage_energy_MWhth': round(float(storage_energy_mwh[index]), 3),
        'hot_tank_level_percent': round(float(hot_tank_level_percent[index]), 2),
        'cold_tank_level_percent': round(float(cold_tank_level_percent[index]), 2),
        'power_output_MWe': round(float(power_output_mw[index]), 3),
        'mode': mode_by_hour[index]
    })

display(Markdown(markdown_table(results, [
    'hour',
    'DNI_W_m2',
    'collector_useful_power_MWth',
    'storage_energy_MWhth',
    'hot_tank_level_percent',
    'power_output_MWe',
    'mode'
])))`;

const visualizationCode = `# 结果可视化代码
mode_order = [
    'standby',
    'solar_direct_generation',
    'solar_generation_and_charge',
    'solar_storage_support',
    'storage_discharge',
    'curtailment'
]
mode_to_value = {name: index for index, name in enumerate(mode_order)}
mode_values = [mode_to_value[mode] for mode in mode_by_hour]

fig, axes = plt.subplots(3, 2, figsize=(16, 13), constrained_layout=True)

axes[0, 0].plot(hours, dni_series, marker='o', color='#c97912', label='DNI')
axes[0, 0].set_title('24 小时 DNI 输入')
axes[0, 0].set_xlabel('小时')
axes[0, 0].set_ylabel('W/m²')
axes[0, 0].grid(True, alpha=0.25)

axes[0, 1].plot(hours, useful_collector_power_mw, marker='o', color='#2662a6', label='集热场可用热功率')
axes[0, 1].bar(hours, curtailed_heat_mwh, color='#d94f45', alpha=0.5, label='弃热量')
axes[0, 1].set_title('集热场可用热功率与弃热')
axes[0, 1].set_xlabel('小时')
axes[0, 1].set_ylabel('MW / MWh')
axes[0, 1].legend()
axes[0, 1].grid(True, alpha=0.25)

axes[1, 0].plot(hours, hot_tank_level_percent, marker='o', color='#bd3f2f', label='热盐罐液位')
axes[1, 0].plot(hours, cold_tank_level_percent, marker='s', color='#2f7f95', label='冷盐罐液位')
axes[1, 0].set_title('双罐熔盐液位变化')
axes[1, 0].set_xlabel('小时')
axes[1, 0].set_ylabel('%')
axes[1, 0].set_ylim(0, 100)
axes[1, 0].legend()
axes[1, 0].grid(True, alpha=0.25)

axes[1, 1].plot(hours, storage_energy_mwh, marker='o', color='#7b6d2a')
axes[1, 1].axhline(storage_capacity_mwh_th, color='#4f4f4f', linestyle='--', linewidth=1, label='储热容量')
axes[1, 1].set_title('热盐罐可用储热量')
axes[1, 1].set_xlabel('小时')
axes[1, 1].set_ylabel('MWh_th')
axes[1, 1].legend()
axes[1, 1].grid(True, alpha=0.25)

axes[2, 0].step(hours, power_output_mw, where='mid', color='#1f7a4d', linewidth=2)
axes[2, 0].axhline(power_block_rated_power, color='#4f4f4f', linestyle='--', linewidth=1, label='额定功率')
axes[2, 0].set_title('24 小时发电功率输出')
axes[2, 0].set_xlabel('小时')
axes[2, 0].set_ylabel('MW_e')
axes[2, 0].legend()
axes[2, 0].grid(True, alpha=0.25)

axes[2, 1].step(hours, mode_values, where='mid', color='#3c4758', linewidth=2)
axes[2, 1].set_title('运行模式时间轴')
axes[2, 1].set_xlabel('小时')
axes[2, 1].set_yticks(list(mode_to_value.values()))
axes[2, 1].set_yticklabels(list(mode_to_value.keys()))
axes[2, 1].grid(True, axis='x', alpha=0.25)

plt.show()`;

const resultCode = `# 关键结果输出
daily_incident_solar_mwh = float(np.sum(dni_series * collector_area / 1_000_000 * time_step_hours))
daily_useful_heat_mwh = float(np.sum(useful_collector_power_mw) * time_step_hours)
daily_electric_energy_mwh = float(np.sum(power_output_mw) * time_step_hours)
daily_solar_to_electric_efficiency = (
    daily_electric_energy_mwh / daily_incident_solar_mwh * 100
    if daily_incident_solar_mwh > 0 else 0
)
capacity_factor = daily_electric_energy_mwh / (power_block_rated_power * 24) * 100
storage_utilization = max(storage_energy_mwh) / storage_capacity_mwh_th * 100
standby_hours = sum(1 for mode in mode_by_hour if mode == 'standby')
curtailment_total_mwh = float(np.sum(curtailed_heat_mwh))
storage_discharge_hours = sum(1 for mode in mode_by_hour if mode == 'storage_discharge')

summary = [
    {'指标': '日入射太阳能量', '数值': round(daily_incident_solar_mwh, 3), '单位': 'MWh_solar'},
    {'指标': '集热场可用热量', '数值': round(daily_useful_heat_mwh, 3), '单位': 'MWh_th'},
    {'指标': '日发电量', '数值': round(daily_electric_energy_mwh, 3), '单位': 'MWh_e'},
    {'指标': '系统日综合光电转换效率', '数值': round(daily_solar_to_electric_efficiency, 3), '单位': '%'},
    {'指标': '汽轮机容量因子', '数值': round(capacity_factor, 3), '单位': '%'},
    {'指标': '最大储热利用率', '数值': round(storage_utilization, 3), '单位': '%'},
    {'指标': '弃热量', '数值': round(curtailment_total_mwh, 3), '单位': 'MWh_th'},
    {'指标': '待机小时数', '数值': standby_hours, '单位': 'h'},
    {'指标': '纯储热放电小时数', '数值': storage_discharge_hours, '单位': 'h'}
]

display(Markdown(markdown_table(summary, ['指标', '数值', '单位'])))`;

const analysisHint = `1. 观察 DNI 高峰与发电功率高峰是否同步，判断储热系统是否起到了削峰填谷作用。
2. 对比热盐罐液位和运行模式时间轴，分析哪些时段处于充热、放热、待机或弃热。
3. 调大集热场面积时，日发电量不一定线性增长；如果热盐罐容量不足，可能出现更多弃热。
4. 调大储热罐容积时，夜间或低辐照时段的发电能力增强，但白天集热不足时效果有限。
5. 改变调度策略后，比较容量因子、弃热量和待机小时数，讨论电站是追求满发还是晚高峰供电。`;

function parameterRowsMarkdown(): string {
  return `| 参数 | 含义 | 默认值 |
| --- | --- | --- |
| solar_profile | 典型日 DNI 辐射谱 | ${DEFAULT_CSP_CONFIG.solarProfile} |
| collector_area | 槽式集热场开口面积 | ${DEFAULT_CSP_CONFIG.collectorArea} m^2 |
| optical_efficiency | 光学效率 | ${DEFAULT_CSP_CONFIG.opticalEfficiency} |
| receiver_loss_coefficient | 接收器热损失系数 | ${DEFAULT_CSP_CONFIG.receiverLossCoefficient} W/(m^2*K) |
| storage_tank_volume | 单罐有效容积 | ${DEFAULT_CSP_CONFIG.storageTankVolume} m^3 |
| hot_salt_temperature / cold_salt_temperature | 热盐与冷盐设计温度 | ${DEFAULT_CSP_CONFIG.hotSaltTemperature} / ${DEFAULT_CSP_CONFIG.coldSaltTemperature} degC |
| power_block_rated_power | 汽轮机额定电功率 | ${DEFAULT_CSP_CONFIG.powerBlockRatedPower} MW_e |
| dispatch_strategy | 发电调度策略 | ${DEFAULT_CSP_CONFIG.dispatchStrategy} |`;
}

export function generateCspNotebook(config: CspExampleConfig = DEFAULT_CSP_CONFIG): NotebookModel {
  const cells = [
    markdownCell(`# ${config.exampleName}`),
    markdownCell(`## 1. 工艺流程说明

本 Notebook 是“官方热力建模示例”中的槽式太阳能光热发电 process 仿真。它以 1 小时为步长模拟 24 小时动态过程，将 **DNI 输入、槽式集热、油盐换热、双罐熔盐储热、汽轮机发电和运行模式切换** 放在同一个可执行模型中。

流程链路：

\`\`\`text
DNI -> 槽式集热场 -> 油盐换热器 -> 热盐罐/冷盐罐 -> 蒸汽发生与汽轮机 -> 发电功率
\`\`\``),
    markdownCell(`## 2. 建模假设

1. 采用小时级 lumped process 模型，忽略集热场管路内的分钟级传输延迟。
2. 槽式集热场有效热功率由 DNI、集热面积、光学效率和接收器热损失共同决定。
3. 双罐熔盐储热使用等容热盐罐与冷盐罐，热盐质量增加代表储热，热盐质量减少代表放热。
4. 熔盐温度按热盐设计温度和冷盐设计温度处理，不模拟罐内温度分层。
5. 汽轮机按额定热功率需求和热功到电功效率计算，低于最小稳定热负荷时进入待机。
6. 当太阳能过剩且热盐罐已满时，系统记录为弃热。`),
    markdownCell(`## 3. 参数说明表

${parameterRowsMarkdown()}`),
    markdownCell(`## 4. 数学模型与控制逻辑

集热场吸收热功率：

\`\`\`text
Q_solar = DNI * A_collector * eta_optical
Q_loss = U_loss * A_collector * (T_receiver - T_ambient)
Q_useful = max(Q_solar - Q_loss, 0) * eta_hx
\`\`\`

双罐熔盐储热容量：

\`\`\`text
E_storage,max = m_salt * cp_salt * (T_hot - T_cold)
\`\`\`

汽轮机热需求：

\`\`\`text
Q_powerblock,rated = P_rated / eta_powerblock
\`\`\`

运行模式由每小时的太阳热量、目标发电热需求和当前储热量共同决定，包括：

- \`solar_direct_generation\`：太阳能直接满足发电。
- \`solar_generation_and_charge\`：发电后仍有余热，余热进入热盐罐。
- \`solar_storage_support\`：太阳能不足，储热补充发电。
- \`storage_discharge\`：太阳能近似为零，热盐罐独立放热发电。
- \`standby\`：太阳能和储热都不足，电站待机。
- \`curtailment\`：热盐罐已满且太阳能过剩，发生弃热。`),
    markdownCell('## 5. 计算环境\n\n这里导入 Notebook 后续计算和绘图所需的基础库。'),
    codeCell(environmentCode),
    codeCell(tableHelperCode),
    markdownCell('## 6. 参数层代码\n\n这里定义 process 仿真的主要输入参数，可由参数绑定侧边栏修改。'),
    codeCell(parameterCode(config)),
    markdownCell('## 7. 太阳辐射与环境输入层代码\n\n这里给出 24 小时 DNI 和环境温度输入。'),
    codeCell(inputProfileCode),
    markdownCell('## 8. 模型层代码\n\n这里把光热收集、熔盐储热和汽轮机热需求转化为可执行模型。'),
    codeCell(modelCode),
    markdownCell('## 9. 求解层代码\n\n这里按小时推进系统状态，并显式保留运行模式切换逻辑。'),
    codeCell(solverCode),
    markdownCell('## 10. 结果可视化代码\n\n这里绘制 DNI、集热、储热、发电功率和运行模式时间轴。'),
    codeCell(visualizationCode),
    markdownCell('## 11. 关键结果输出\n\n这里集中输出日发电量、光电转换效率、容量因子、弃热量和待机小时数。'),
    codeCell(resultCode),
    markdownCell(`## 12. 结果分析提示

${analysisHint}`)
  ];

  return {
    cells: cells.map((cell, index) => ({
      ...cell,
      id: `official-csp-${index + 1}`
    })),
    metadata: {
      kernelspec: { display_name: 'Python 3 (ipykernel)', language: 'python', name: 'python3' },
      language_info: { name: 'python', version: '3.10.0', file_extension: '.py' },
      simulation_param_bindings: {
        version: 1,
        title: '参数层代码',
        parameters: CSP_PARAMETER_BINDINGS
      }
    },
    nbformat: 4,
    nbformat_minor: 5
  };
}

export function makeCspNotebookFilename(title: string): string {
  const cleaned = title
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80) || 'CSP_双罐熔盐示例';
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  return `official-thermal-csp_${cleaned}_${timestamp}.ipynb`;
}
