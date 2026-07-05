import { ParamControlConfig } from '../csp/cspNotebookGenerator';

export type CaesNotebookLanguage = 'python' | 'julia';

export interface CaesExampleConfig {
  exampleName: string;
  language: CaesNotebookLanguage;
  operationProfile: 'charge_hold_discharge';
  ambientTemperatureC: number;
  ambientPressureBar: number;
  compressorStages: number;
  expanderStages: number;
  massFlowKgS: number;
  compressorEfficiency: number;
  expanderEfficiency: number;
  motorEfficiency: number;
  generatorEfficiency: number;
  heatExchangerEffectiveness: number;
  storageVolumeM3: number;
  minStoragePressureBar: number;
  maxStoragePressureBar: number;
  initialStoragePressureBar: number;
  storageHeatTransferCoefficientWk: number;
  tesMassKg: number;
  tesSpecificHeatKjKgK: number;
  tesInitialTemperatureC: number;
  tesAmbientLossCoefficientWk: number;
  maxTurbineInletTemperatureC: number;
  minimumTesApproachTemperatureK: number;
  chargeHours: number;
  holdHours: number;
  dischargeHours: number;
  timeStepMinutes: number;
}

interface NotebookCell {
  id?: string;
  cell_type: 'markdown' | 'code';
  metadata: Record<string, unknown>;
  source: string[];
  execution_count?: number | null;
  outputs?: unknown[];
}

export interface NotebookModel {
  cells: NotebookCell[];
  metadata: Record<string, unknown>;
  nbformat: 4;
  nbformat_minor: 5;
}

export const DEFAULT_CAES_CONFIG: CaesExampleConfig = {
  exampleName: '压缩空气储能仿真',
  language: 'python',
  operationProfile: 'charge_hold_discharge',
  ambientTemperatureC: 25,
  ambientPressureBar: 1.01325,
  compressorStages: 3,
  expanderStages: 2,
  massFlowKgS: 12,
  compressorEfficiency: 0.82,
  expanderEfficiency: 0.86,
  motorEfficiency: 0.96,
  generatorEfficiency: 0.96,
  heatExchangerEffectiveness: 0.88,
  storageVolumeM3: 1200,
  minStoragePressureBar: 40,
  maxStoragePressureBar: 120,
  initialStoragePressureBar: 45,
  storageHeatTransferCoefficientWk: 2800,
  tesMassKg: 420000,
  tesSpecificHeatKjKgK: 0.92,
  tesInitialTemperatureC: 120,
  tesAmbientLossCoefficientWk: 1800,
  maxTurbineInletTemperatureC: 520,
  minimumTesApproachTemperatureK: 12,
  chargeHours: 4,
  holdHours: 2,
  dischargeHours: 4,
  timeStepMinutes: 2
};

export const CAES_PARAMETER_BINDINGS: Record<string, ParamControlConfig> = {
  operation_profile: {
    type: 'dropdown',
    label: '运行工况',
    options: ['charge_hold_discharge'],
    group: '01 运行策略与时间'
  },
  charge_hours: { type: 'slider', label: '充电时长 (h)', min: 1, max: 8, step: 0.5, group: '01 运行策略与时间' },
  hold_hours: { type: 'slider', label: '静置时长 (h)', min: 0, max: 8, step: 0.5, group: '01 运行策略与时间' },
  discharge_hours: { type: 'slider', label: '放电时长 (h)', min: 1, max: 8, step: 0.5, group: '01 运行策略与时间' },
  time_step_minutes: { type: 'slider', label: '时间步长 (min)', min: 0.5, max: 10, step: 0.5, group: '01 运行策略与时间' },
  ambient_temperature_c: { type: 'slider', label: '环境温度 (degC)', min: -10, max: 45, step: 1, group: '02 环境参数' },
  ambient_pressure_bar: { type: 'slider', label: '环境压力 (bar)', min: 0.8, max: 1.2, step: 0.005, group: '02 环境参数' },
  compressor_stages: { type: 'slider', label: '压缩机级数', min: 2, max: 4, step: 1, group: '03 压缩机与电动机' },
  mass_flow_kg_s: { type: 'slider', label: '空气质量流量 (kg/s)', min: 2, max: 40, step: 1, group: '03 压缩机与电动机' },
  compressor_efficiency: { type: 'slider', label: '压缩机等熵效率 (-)', min: 0.65, max: 0.92, step: 0.01, group: '03 压缩机与电动机' },
  motor_efficiency: { type: 'slider', label: '电动机效率 (-)', min: 0.85, max: 0.99, step: 0.005, group: '03 压缩机与电动机' },
  heat_exchanger_effectiveness: { type: 'slider', label: '换热器有效度 (-)', min: 0.65, max: 0.98, step: 0.01, group: '04 冷却器与换热器' },
  storage_volume_m3: { type: 'slider', label: '储气罐容积 (m^3)', min: 200, max: 5000, step: 100, group: '05 储气罐' },
  min_storage_pressure_bar: { type: 'slider', label: '最低储气压力 (bar)', min: 10, max: 80, step: 2, group: '05 储气罐' },
  max_storage_pressure_bar: { type: 'slider', label: '最高储气压力 (bar)', min: 60, max: 200, step: 5, group: '05 储气罐' },
  initial_storage_pressure_bar: { type: 'slider', label: '初始储气压力 (bar)', min: 10, max: 100, step: 2, group: '05 储气罐' },
  storage_heat_transfer_coefficient_wk: { type: 'slider', label: '储气罐换热系数 UA (W/K)', min: 0, max: 10000, step: 100, group: '05 储气罐' },
  tes_mass_kg: { type: 'slider', label: 'TES 储热介质质量 (kg)', min: 50000, max: 1000000, step: 10000, group: '06 热储能 TES' },
  tes_specific_heat_kj_kg_k: { type: 'slider', label: 'TES 比热容 (kJ/kg/K)', min: 0.5, max: 2, step: 0.05, group: '06 热储能 TES' },
  tes_initial_temperature_c: { type: 'slider', label: 'TES 初始温度 (degC)', min: 30, max: 350, step: 5, group: '06 热储能 TES' },
  tes_ambient_loss_coefficient_wk: { type: 'slider', label: 'TES 热损失 UA (W/K)', min: 0, max: 10000, step: 100, group: '06 热储能 TES' },
  max_turbine_inlet_temperature_c: { type: 'slider', label: '膨胀机入口最高温度 (degC)', min: 150, max: 650, step: 10, group: '06 热储能 TES' },
  minimum_tes_approach_temperature_k: { type: 'slider', label: 'TES 最小端差 (K)', min: 2, max: 50, step: 1, group: '06 热储能 TES' },
  expander_stages: { type: 'slider', label: '膨胀机级数', min: 2, max: 4, step: 1, group: '07 膨胀机与发电机' },
  expander_efficiency: { type: 'slider', label: '膨胀机等熵效率 (-)', min: 0.65, max: 0.94, step: 0.01, group: '07 膨胀机与发电机' },
  generator_efficiency: { type: 'slider', label: '发电机效率 (-)', min: 0.85, max: 0.99, step: 0.005, group: '07 膨胀机与发电机' }
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

function juliaString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function caesMetadata(language: CaesNotebookLanguage): Record<string, unknown> {
  const kernelspec = language === 'julia'
    ? { display_name: 'Julia 1.12', language: 'julia', name: 'julia-1.12' }
    : { display_name: 'Python 3 (ipykernel)', language: 'python', name: 'python3' };
  const languageInfo = language === 'julia'
    ? { name: 'julia', version: '1.12.0', file_extension: '.jl', mimetype: 'application/julia' }
    : { name: 'python', version: '3.10.0', file_extension: '.py', mimetype: 'text/x-python' };

  return {
    kernelspec,
    language_info: languageInfo,
    simulation_param_bindings: {
      version: 1,
      title: '参数层代码',
      parameters: CAES_PARAMETER_BINDINGS
    }
  };
}

function makeNotebook(cells: NotebookCell[], language: CaesNotebookLanguage): NotebookModel {
  return {
    cells: cells.map((cell, index) => ({
      ...cell,
      id: `official-caes-${language}-${index + 1}`
    })),
    metadata: caesMetadata(language),
    nbformat: 4,
    nbformat_minor: 5
  };
}

function parameterMarkdown(config: CaesExampleConfig): string {
  return `| 参数 | 含义 | 默认值 |
| --- | --- | --- |
| operation_profile | 运行工况 | ${config.operationProfile} |
| ambient_temperature_c | 环境温度 | ${config.ambientTemperatureC} degC |
| ambient_pressure_bar | 环境压力 | ${config.ambientPressureBar} bar |
| compressor_stages | 压缩机级数 | ${config.compressorStages} |
| expander_stages | 膨胀机级数 | ${config.expanderStages} |
| mass_flow_kg_s | 空气质量流量 | ${config.massFlowKgS} kg/s |
| compressor_efficiency | 压缩机等熵效率 | ${config.compressorEfficiency} |
| expander_efficiency | 膨胀机等熵效率 | ${config.expanderEfficiency} |
| heat_exchanger_effectiveness | 换热器有效度 | ${config.heatExchangerEffectiveness} |
| storage_volume_m3 | 储气罐容积 | ${config.storageVolumeM3} m3 |
| min_storage_pressure_bar | 最低放电压力 | ${config.minStoragePressureBar} bar |
| max_storage_pressure_bar | 最高储气压力 | ${config.maxStoragePressureBar} bar |
| tes_mass_kg | TES 储热介质质量 | ${config.tesMassKg} kg |
| charge_hours / hold_hours / discharge_hours | 充电/静置/放电时长 | ${config.chargeHours} / ${config.holdHours} / ${config.dischargeHours} h |`;
}

function pythonParameterCode(config: CaesExampleConfig): string {
  return `# 参数层代码
operation_profile = ${pythonString(config.operationProfile)}

# 02 环境参数
ambient_temperature_c = ${config.ambientTemperatureC}
ambient_pressure_bar = ${config.ambientPressureBar}

# 03 压缩机与电动机
compressor_stages = ${config.compressorStages}
mass_flow_kg_s = ${config.massFlowKgS}
compressor_efficiency = ${config.compressorEfficiency}
motor_efficiency = ${config.motorEfficiency}

# 04 冷却器与换热器
heat_exchanger_effectiveness = ${config.heatExchangerEffectiveness}

# 05 储气罐
storage_volume_m3 = ${config.storageVolumeM3}
min_storage_pressure_bar = ${config.minStoragePressureBar}
max_storage_pressure_bar = ${config.maxStoragePressureBar}
initial_storage_pressure_bar = ${config.initialStoragePressureBar}
storage_heat_transfer_coefficient_wk = ${config.storageHeatTransferCoefficientWk}

# 06 热储能 TES
tes_mass_kg = ${config.tesMassKg}
tes_specific_heat_kj_kg_k = ${config.tesSpecificHeatKjKgK}
tes_initial_temperature_c = ${config.tesInitialTemperatureC}
tes_ambient_loss_coefficient_wk = ${config.tesAmbientLossCoefficientWk}
max_turbine_inlet_temperature_c = ${config.maxTurbineInletTemperatureC}
minimum_tes_approach_temperature_k = ${config.minimumTesApproachTemperatureK}

# 07 膨胀机与发电机
expander_stages = ${config.expanderStages}
expander_efficiency = ${config.expanderEfficiency}
generator_efficiency = ${config.generatorEfficiency}

# 01 运行策略与时间
charge_hours = ${config.chargeHours}
hold_hours = ${config.holdHours}
discharge_hours = ${config.dischargeHours}
time_step_minutes = ${config.timeStepMinutes}`;
}

function juliaParameterCode(config: CaesExampleConfig): string {
  return pythonParameterCode(config)
    .replace(`operation_profile = ${pythonString(config.operationProfile)}`, `operation_profile = ${juliaString(config.operationProfile)}`);
}

const pythonEnvironmentCode = `# 计算环境
%matplotlib inline
import math
import warnings
import numpy as np
import matplotlib.pyplot as plt
from IPython.display import Markdown, display

plt.rcParams['font.sans-serif'] = [
    'SimHei',
    'WenQuanYi Micro Hei',
    'WenQuanYi Zen Hei',
    'Microsoft YaHei',
    'Arial Unicode MS',
    'sans-serif'
]
plt.rcParams['axes.unicode_minus'] = False

def markdown_table(rows, columns):
    header = '| ' + ' | '.join(columns) + ' |'
    separator = '| ' + ' | '.join(['---'] * len(columns)) + ' |'
    body = []
    for row in rows:
        body.append('| ' + ' | '.join(str(row.get(column, '')) for column in columns) + ' |')
    return '\\n'.join([header, separator] + body)`;

const pythonPropertyCode = `# 物性层代码
AIR = 'Air'
R_AIR = 287.05
T_REF = 298.15
P_REF = 101325.0

try:
    import CoolProp.CoolProp as CP
    COOLPROP_AVAILABLE = True
except ImportError:
    CP = None
    COOLPROP_AVAILABLE = False
    warnings.warn(
        '当前环境未安装 CoolProp，已启用透明 cp(T) 备用模型。正式系统建议安装: pip install CoolProp',
        RuntimeWarning
    )

def cp_air_polynomial(T):
    """Variable cp(T) fallback for dry air, J/(kg*K)."""
    theta = np.asarray(T, dtype=float) - 300.0
    cp = 1006.0 + 0.085 * theta + 1.2e-4 * theta**2
    return np.maximum(cp, 950.0)

def h_air_fallback(T):
    T = np.asarray(T, dtype=float)
    x = T - 300.0
    x0 = 273.15 - 300.0
    return (
        1006.0 * (T - 273.15)
        + 0.085 * (x**2 - x0**2) / 2
        + 1.2e-4 * (x**3 - x0**3) / 3
    )

def T_from_h_fallback(h_target, low=180.0, high=1200.0):
    lo, hi = low, high
    for _ in range(80):
        mid = 0.5 * (lo + hi)
        if h_air_fallback(mid) < h_target:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)

def T_from_u_rho_fallback(u_target, rho, low=180.0, high=1200.0):
    lo, hi = low, high
    for _ in range(80):
        mid = 0.5 * (lo + hi)
        u_mid = h_air_fallback(mid) - R_AIR * mid
        if u_mid < u_target:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)

def air_props(T, p):
    """Return air properties at temperature T [K] and pressure p [Pa]."""
    if COOLPROP_AVAILABLE:
        return {
            'T': T,
            'p': p,
            'cp': CP.PropsSI('Cpmass', 'T', T, 'P', p, AIR),
            'cv': CP.PropsSI('Cvmass', 'T', T, 'P', p, AIR),
            'h': CP.PropsSI('Hmass', 'T', T, 'P', p, AIR),
            'u': CP.PropsSI('Umass', 'T', T, 'P', p, AIR),
            's': CP.PropsSI('Smass', 'T', T, 'P', p, AIR),
            'rho': CP.PropsSI('Dmass', 'T', T, 'P', p, AIR)
        }
    cp = float(cp_air_polynomial(T))
    cv = cp - R_AIR
    h = float(h_air_fallback(T))
    rho = p / (R_AIR * T)
    s = cp * math.log(T / T_REF) - R_AIR * math.log(p / P_REF)
    return {'T': T, 'p': p, 'cp': cp, 'cv': cv, 'h': h, 'u': h - R_AIR * T, 's': s, 'rho': rho}

def h_from_T_p(T, p):
    return air_props(T, p)['h']

def u_from_T_p(T, p):
    return air_props(T, p)['u']

def rho_from_T_p(T, p):
    return air_props(T, p)['rho']

def T_from_h_p(h, p):
    if COOLPROP_AVAILABLE:
        return CP.PropsSI('T', 'P', p, 'Hmass', h, AIR)
    return T_from_h_fallback(h)

def T_p_from_u_rho(u, rho):
    if COOLPROP_AVAILABLE:
        try:
            T = CP.PropsSI('T', 'Umass', u, 'Dmass', rho, AIR)
            p = CP.PropsSI('P', 'T', T, 'Dmass', rho, AIR)
            return T, p
        except Exception:
            pass
    T = T_from_u_rho_fallback(u, rho)
    p = rho * R_AIR * T
    return T, p

def isentropic_h_out_compression(T_in, p_in, p_out):
    if COOLPROP_AVAILABLE:
        s_in = CP.PropsSI('Smass', 'T', T_in, 'P', p_in, AIR)
        return CP.PropsSI('Hmass', 'P', p_out, 'Smass', s_in, AIR)
    props = air_props(T_in, p_in)
    gamma = props['cp'] / props['cv']
    T_out_s = T_in * (p_out / p_in) ** ((gamma - 1) / gamma)
    return h_air_fallback(T_out_s)

def isentropic_h_out_expansion(T_in, p_in, p_out):
    return isentropic_h_out_compression(T_in, p_in, p_out)

print('CoolProp 可用:', COOLPROP_AVAILABLE)
print('环境空气 cp:', f"{air_props(298.15, 101325)['cp']:.2f} J/(kg*K)")`;

const pythonEquipmentCode = `# 设备模型层代码
# ============================================================
# 单位换算与公共常量
# ------------------------------------------------------------
# 作用：把参数层中便于用户理解的单位，转换成模型计算使用的 SI 单位。
# 注意：后续所有设备模型默认使用 K、Pa、kg/s、J、W。
# ============================================================
ambient_temperature_k = ambient_temperature_c + 273.15
ambient_pressure_pa = ambient_pressure_bar * 1e5
tes_specific_heat_j_kg_k = tes_specific_heat_kj_kg_k * 1000

# ============================================================
# 模型 1：压缩机单级模型 compressor_stage
# ------------------------------------------------------------
# 物理意义：把空气从 p_in 压缩到 p_out。
# 输入：T_in [K], p_in [Pa], p_out [Pa], eta_isentropic [-], mass_flow [kg/s]
# 输出：T_out [K], h_out [J/kg], power_w [W]
# 原理级公式：
#   T2 = T1 * (1 + (pi_c^((k-1)/k) - 1) / eta_c)
#   Wc = mdot * cp * (T2 - T1)
# 当前实现：优先用焓差 h_out - h_in；无 CoolProp 时由 cp(T) 备用模型给出焓。
# ============================================================
def compressor_stage(T_in, p_in, p_out, eta_isentropic, mass_flow):
    h_in = h_from_T_p(T_in, p_in)
    h_out_s = isentropic_h_out_compression(T_in, p_in, p_out)
    h_out = h_in + (h_out_s - h_in) / eta_isentropic
    T_out = T_from_h_p(h_out, p_out)
    power_w = mass_flow * (h_out - h_in)
    return T_out, h_out, power_w

# ============================================================
# 模型 2：膨胀机单级模型 expander_stage
# ------------------------------------------------------------
# 物理意义：高压热空气从 p_in 膨胀到 p_out，并输出轴功。
# 输入：T_in [K], p_in [Pa], p_out [Pa], eta_isentropic [-], mass_flow [kg/s]
# 输出：T_out [K], h_out [J/kg], power_w [W]
# 原理级公式：
#   T4 = T3 * (1 - eta_t * (1 - pi_t^((1-k)/k)))
#   Wt = mdot * cp * (T3 - T4)
# 当前实现：用等熵焓降乘以膨胀机等熵效率。
# ============================================================
def expander_stage(T_in, p_in, p_out, eta_isentropic, mass_flow):
    h_in = h_from_T_p(T_in, p_in)
    h_out_s = isentropic_h_out_expansion(T_in, p_in, p_out)
    h_out = h_in - eta_isentropic * (h_in - h_out_s)
    T_out = T_from_h_p(h_out, p_out)
    power_w = mass_flow * max(h_in - h_out, 0.0)
    return T_out, h_out, power_w

# ============================================================
# 模型 3：冷却器 / 换热器有效度模型 cooler
# ------------------------------------------------------------
# 物理意义：压缩后的高温空气向 TES 或冷端介质放热。
# 输入：热端入口温度、冷端入口温度、两侧热容率、换热器有效度。
# 输出：热端出口温度、冷端出口温度、换热功率。
# 原理级关系：Q = epsilon * C_min * (T_hot,in - T_cold,in)
# ============================================================
def cooler(T_hot_in, T_cold_in, heat_capacity_hot, heat_capacity_cold, effectiveness):
    """epsilon heat exchanger model. Heat capacity rates use W/K."""
    delta_t = max(T_hot_in - T_cold_in, 0.0)
    if delta_t <= 0 or heat_capacity_hot <= 0 or heat_capacity_cold <= 0:
        return T_hot_in, T_cold_in, 0.0
    c_min = min(heat_capacity_hot, heat_capacity_cold)
    heat_w = effectiveness * c_min * delta_t
    T_hot_out = T_hot_in - heat_w / heat_capacity_hot
    T_cold_out = T_cold_in + heat_w / heat_capacity_cold
    return T_hot_out, T_cold_out, heat_w

# ============================================================
# 模型 4：定容储气罐动态模型 storage_tank_step
# ------------------------------------------------------------
# 物理意义：储气罐是定容容器，核心状态为 m_tank、T_tank、p_tank。
# 输入：上一时刻 state、进气质量流量、进气焓、出气质量流量、时间步长。
# 输出：下一时刻 state = {mass, temperature, pressure}
# 至少满足：
#   dm/dt = mdot_in - mdot_out
#   pV = mRT
# 当前实现：比等温模型更进一步，采用集中参数能量平衡：
#   U_new = U_old + mdot_in*h_in*dt - mdot_out*h_out*dt + Q_wall*dt
# ============================================================
def storage_tank_step(state, m_in, h_in, m_out, dt):
    m_old = max(state['mass'], 1e-6)
    T_old = state['temperature']
    p_old = state['pressure']
    u_old = u_from_T_p(T_old, p_old)
    h_out = h_from_T_p(T_old, p_old)
    heat_wall_w = -storage_heat_transfer_coefficient_wk * (T_old - ambient_temperature_k)
    internal_energy = m_old * u_old + m_in * h_in * dt - m_out * h_out * dt + heat_wall_w * dt
    m_new = max(m_old + (m_in - m_out) * dt, 1e-6)
    rho_new = max(m_new / storage_volume_m3, 1e-9)
    u_new = internal_energy / m_new
    T_new, p_new = T_p_from_u_rho(u_new, rho_new)
    return {'mass': m_new, 'temperature': T_new, 'pressure': p_new}

# ============================================================
# 模型 5：热储能 TES 动态模型 tes_step
# ------------------------------------------------------------
# 物理意义：TES 储存压缩热，并在放电阶段加热进入膨胀机的空气。
# 输入：上一时刻 TES 状态、充热功率、放热功率、时间步长。
# 输出：下一时刻 TES 状态 = {energy_j, temperature_k}
# 能量平衡：
#   E_new = E_old + Q_charge*dt - Q_discharge*dt - UA_loss*(T_TES - T_amb)*dt
# ============================================================
def tes_step(tes_state, heat_charge, heat_discharge, dt):
    energy_old = tes_state['energy_j']
    temperature_old = tes_state['temperature_k']
    loss_w = tes_ambient_loss_coefficient_wk * (temperature_old - ambient_temperature_k)
    energy_new = max(energy_old + heat_charge * dt - heat_discharge * dt - loss_w * dt, 0.0)
    temperature_k = ambient_temperature_k + energy_new / (tes_mass_kg * tes_specific_heat_j_kg_k)
    return {'energy_j': energy_new, 'temperature_k': temperature_k}

# ============================================================
# 辅助函数：多级压缩/膨胀的压力序列
# ------------------------------------------------------------
# 作用：在给定入口压力、出口压力和级数后，生成等压比分配的级间压力。
# ============================================================
def pressure_sequence(p_start, p_end, stages):
    ratio = (p_end / p_start) ** (1 / stages)
    values = [p_start]
    for _ in range(stages):
        values.append(values[-1] * ratio)
    values[-1] = p_end
    return values`;

const pythonSolverCode = `# 系统状态机与求解层代码
def run_caes_cycle():
    dt = time_step_minutes * 60
    total_hours = charge_hours + hold_hours + discharge_hours
    total_steps = int(round(total_hours * 3600 / dt)) + 1
    initial_pressure_pa = initial_storage_pressure_bar * 1e5
    initial_rho = rho_from_T_p(ambient_temperature_k, initial_pressure_pa)
    storage_state = {'mass': initial_rho * storage_volume_m3, 'temperature': ambient_temperature_k, 'pressure': initial_pressure_pa}
    tes_state = {
        'energy_j': max(tes_mass_kg * tes_specific_heat_j_kg_k * (tes_initial_temperature_c - ambient_temperature_c), 0.0),
        'temperature_k': tes_initial_temperature_c + 273.15
    }
    time_hours = []
    pressure_bar = []
    air_temperature_c = []
    air_mass_kg = []
    tes_temperature_c = []
    compressor_power_mw = []
    expander_power_mw = []
    net_power_mw = []
    charge_heat_mw = []
    discharge_heat_mw = []
    mode_by_step = []
    electric_input_j = 0.0
    electric_output_j = 0.0
    compression_heat_recovered_j = 0.0
    tes_heat_delivered_j = 0.0
    for step in range(total_steps):
        current_hour = step * dt / 3600
        if current_hour < charge_hours:
            mode = 'charge'
        elif current_hour < charge_hours + hold_hours:
            mode = 'hold'
        else:
            mode = 'discharge'
        p_tank = storage_state['pressure']
        T_tank = storage_state['temperature']
        m_dot_in = 0.0
        m_dot_out = 0.0
        h_in_storage = 0.0
        compressor_power_w = 0.0
        expander_power_w = 0.0
        heat_charge_w = 0.0
        heat_discharge_w = 0.0
        if mode == 'charge':
            if p_tank >= 0.98 * max_storage_pressure_bar * 1e5:
                mode = 'charge_pressure_limited'
            else:
                m_dot_in = mass_flow_kg_s
                p_final = min(max(p_tank * 1.005, min_storage_pressure_bar * 1e5), 0.98 * max_storage_pressure_bar * 1e5)
                pressures = pressure_sequence(ambient_pressure_pa, p_final, compressor_stages)
                T_air = ambient_temperature_k
                tes_capacity_rate = max(tes_mass_kg * tes_specific_heat_j_kg_k / dt, 1.0)
                for stage in range(compressor_stages):
                    T_air, h_air, power_w = compressor_stage(T_air, pressures[stage], pressures[stage + 1], compressor_efficiency, m_dot_in)
                    compressor_power_w += power_w / motor_efficiency
                    cp_hot = air_props(T_air, pressures[stage + 1])['cp']
                    hot_capacity_rate = m_dot_in * cp_hot
                    T_air, _, q_w = cooler(T_air, tes_state['temperature_k'], hot_capacity_rate, tes_capacity_rate, heat_exchanger_effectiveness)
                    heat_charge_w += q_w
                h_in_storage = h_from_T_p(T_air, p_final)
                compression_heat_recovered_j += heat_charge_w * dt
                electric_input_j += compressor_power_w * dt
        elif mode == 'discharge':
            if p_tank <= 1.05 * min_storage_pressure_bar * 1e5 or storage_state['mass'] <= 1e-6:
                mode = 'discharge_pressure_limited'
            else:
                available_mass_flow = max((storage_state['mass'] - 1e-6) / dt, 0.0)
                m_dot_out = min(mass_flow_kg_s, available_mass_flow)
                T_air = T_tank
                p_start = p_tank
                p_final = ambient_pressure_pa
                cp_current = air_props(T_air, p_start)['cp']
                target_turbine_inlet_k = min(max_turbine_inlet_temperature_c + 273.15, max(tes_state['temperature_k'] - minimum_tes_approach_temperature_k, T_air))
                preheat_w = max(m_dot_out * cp_current * (target_turbine_inlet_k - T_air), 0.0)
                preheat_w = min(preheat_w, max(tes_state['energy_j'] / dt, 0.0))
                if preheat_w > 0:
                    T_air += preheat_w / max(m_dot_out * cp_current, 1e-9)
                    heat_discharge_w += preheat_w
                pressures = pressure_sequence(p_start, p_final, expander_stages)
                for stage in range(expander_stages):
                    T_air, h_air, power_w = expander_stage(T_air, pressures[stage], pressures[stage + 1], expander_efficiency, m_dot_out)
                    expander_power_w += power_w * generator_efficiency
                    if stage < expander_stages - 1:
                        cp_reheat = air_props(T_air, pressures[stage + 1])['cp']
                        target_reheat_k = min(max_turbine_inlet_temperature_c + 273.15, max(tes_state['temperature_k'] - minimum_tes_approach_temperature_k, T_air))
                        reheat_w = max(m_dot_out * cp_reheat * (target_reheat_k - T_air), 0.0)
                        reheat_w = min(reheat_w, max((tes_state['energy_j'] - heat_discharge_w * dt) / dt, 0.0))
                        if reheat_w > 0:
                            T_air += reheat_w / max(m_dot_out * cp_reheat, 1e-9)
                            heat_discharge_w += reheat_w
                electric_output_j += expander_power_w * dt
                tes_heat_delivered_j += heat_discharge_w * dt
        if mode.startswith('charge'):
            storage_state = storage_tank_step(storage_state, m_dot_in, h_in_storage, 0.0, dt)
            tes_state = tes_step(tes_state, heat_charge_w, 0.0, dt)
        elif mode.startswith('discharge'):
            storage_state = storage_tank_step(storage_state, 0.0, 0.0, m_dot_out, dt)
            tes_state = tes_step(tes_state, 0.0, heat_discharge_w, dt)
        else:
            storage_state = storage_tank_step(storage_state, 0.0, 0.0, 0.0, dt)
            tes_state = tes_step(tes_state, 0.0, 0.0, dt)
        time_hours.append(current_hour)
        pressure_bar.append(storage_state['pressure'] / 1e5)
        air_temperature_c.append(storage_state['temperature'] - 273.15)
        air_mass_kg.append(storage_state['mass'])
        tes_temperature_c.append(tes_state['temperature_k'] - 273.15)
        compressor_power_mw.append(compressor_power_w / 1e6)
        expander_power_mw.append(expander_power_w / 1e6)
        net_power_mw.append((expander_power_w - compressor_power_w) / 1e6)
        charge_heat_mw.append(heat_charge_w / 1e6)
        discharge_heat_mw.append(heat_discharge_w / 1e6)
        mode_by_step.append(mode)
    round_trip_efficiency = electric_output_j / electric_input_j if electric_input_j > 0 else 0.0
    return {
        'time_hours': np.array(time_hours),
        'pressure_bar': np.array(pressure_bar),
        'air_temperature_c': np.array(air_temperature_c),
        'air_mass_kg': np.array(air_mass_kg),
        'tes_temperature_c': np.array(tes_temperature_c),
        'compressor_power_mw': np.array(compressor_power_mw),
        'expander_power_mw': np.array(expander_power_mw),
        'net_power_mw': np.array(net_power_mw),
        'charge_heat_mw': np.array(charge_heat_mw),
        'discharge_heat_mw': np.array(discharge_heat_mw),
        'mode_by_step': mode_by_step,
        'electric_input_j': electric_input_j,
        'electric_output_j': electric_output_j,
        'compression_heat_recovered_j': compression_heat_recovered_j,
        'tes_heat_delivered_j': tes_heat_delivered_j,
        'round_trip_efficiency': round_trip_efficiency
    }

results = run_caes_cycle()
time_hours = results['time_hours']
pressure_bar = results['pressure_bar']
air_temperature_c = results['air_temperature_c']
air_mass_kg = results['air_mass_kg']
tes_temperature_c = results['tes_temperature_c']
compressor_power_mw = results['compressor_power_mw']
expander_power_mw = results['expander_power_mw']
net_power_mw = results['net_power_mw']
charge_heat_mw = results['charge_heat_mw']
discharge_heat_mw = results['discharge_heat_mw']
mode_by_step = results['mode_by_step']
round_trip_efficiency = results['round_trip_efficiency']
print(f'仿真步数: {len(time_hours)}')
print(f'最高储气压力: {np.max(pressure_bar):.2f} bar')
print(f'最低储气压力: {np.min(pressure_bar):.2f} bar')
print(f'往返效率: {round_trip_efficiency:.2%}')`;

const pythonVisualizationCode = `# 结果可视化代码
mode_order = ['charge', 'charge_pressure_limited', 'hold', 'discharge', 'discharge_pressure_limited']
mode_to_value = {name: index for index, name in enumerate(mode_order)}
mode_values = [mode_to_value.get(mode, -1) for mode in mode_by_step]

fig, axes = plt.subplots(3, 2, figsize=(16, 12), constrained_layout=True)
axes[0, 0].plot(time_hours, pressure_bar, color='#2868a6', linewidth=2)
axes[0, 0].axhline(max_storage_pressure_bar, color='#a83232', linestyle='--', linewidth=1, label='最高压力')
axes[0, 0].axhline(min_storage_pressure_bar, color='#555555', linestyle='--', linewidth=1, label='最低压力')
axes[0, 0].set_title('储气罐压力动态')
axes[0, 0].set_xlabel('时间 / h')
axes[0, 0].set_ylabel('压力 / bar')
axes[0, 0].legend()
axes[0, 0].grid(True, alpha=0.25)
axes[0, 1].plot(time_hours, air_temperature_c, color='#cc6f2d', linewidth=2)
axes[0, 1].axhline(ambient_temperature_c, color='#555555', linestyle='--', linewidth=1, label='环境温度')
axes[0, 1].set_title('储气罐空气温度')
axes[0, 1].set_xlabel('时间 / h')
axes[0, 1].set_ylabel('温度 / degC')
axes[0, 1].legend()
axes[0, 1].grid(True, alpha=0.25)
axes[1, 0].plot(time_hours, air_mass_kg, color='#39704f', linewidth=2)
axes[1, 0].set_title('储气罐空气质量')
axes[1, 0].set_xlabel('时间 / h')
axes[1, 0].set_ylabel('质量 / kg')
axes[1, 0].grid(True, alpha=0.25)
axes[1, 1].plot(time_hours, tes_temperature_c, color='#b23b45', linewidth=2)
axes[1, 1].axhline(ambient_temperature_c, color='#555555', linestyle='--', linewidth=1, label='环境温度')
axes[1, 1].set_title('TES 等效温度')
axes[1, 1].set_xlabel('时间 / h')
axes[1, 1].set_ylabel('温度 / degC')
axes[1, 1].legend()
axes[1, 1].grid(True, alpha=0.25)
axes[2, 0].plot(time_hours, compressor_power_mw, color='#7a4ea3', linewidth=2, label='压缩耗电')
axes[2, 0].plot(time_hours, expander_power_mw, color='#1f7a4d', linewidth=2, label='膨胀发电')
axes[2, 0].plot(time_hours, net_power_mw, color='#222222', linewidth=1.5, label='净功率')
axes[2, 0].set_title('系统功率动态')
axes[2, 0].set_xlabel('时间 / h')
axes[2, 0].set_ylabel('功率 / MW')
axes[2, 0].legend()
axes[2, 0].grid(True, alpha=0.25)
axes[2, 1].step(time_hours, mode_values, where='post', color='#36454f', linewidth=2)
axes[2, 1].set_title('运行模式时间轴')
axes[2, 1].set_xlabel('时间 / h')
axes[2, 1].set_yticks(list(mode_to_value.values()))
axes[2, 1].set_yticklabels(list(mode_to_value.keys()))
axes[2, 1].grid(True, axis='x', alpha=0.25)
plt.show()`;

const pythonResultCode = `# 关键结果输出
electric_input_mwh = results['electric_input_j'] / 3.6e9
electric_output_mwh = results['electric_output_j'] / 3.6e9
compression_heat_recovered_mwh = results['compression_heat_recovered_j'] / 3.6e9
tes_heat_delivered_mwh = results['tes_heat_delivered_j'] / 3.6e9
summary_rows = [
    {'指标': '压缩阶段电输入', '数值': f'{electric_input_mwh:.3f}', '单位': 'MWh'},
    {'指标': '膨胀阶段电输出', '数值': f'{electric_output_mwh:.3f}', '单位': 'MWh'},
    {'指标': '系统往返效率', '数值': f'{round_trip_efficiency * 100:.2f}', '单位': '%'},
    {'指标': '最高储气压力', '数值': f'{np.max(pressure_bar):.2f}', '单位': 'bar'},
    {'指标': '最低储气压力', '数值': f'{np.min(pressure_bar):.2f}', '单位': 'bar'},
    {'指标': '最终储气压力', '数值': f'{pressure_bar[-1]:.2f}', '单位': 'bar'},
    {'指标': '最高储气温度', '数值': f'{np.max(air_temperature_c):.2f}', '单位': 'degC'},
    {'指标': '最终 TES 温度', '数值': f'{tes_temperature_c[-1]:.2f}', '单位': 'degC'},
    {'指标': '压缩热回收量', '数值': f'{compression_heat_recovered_mwh:.3f}', '单位': 'MWh_th'},
    {'指标': 'TES 放热量', '数值': f'{tes_heat_delivered_mwh:.3f}', '单位': 'MWh_th'},
]
display(Markdown(markdown_table(summary_rows, ['指标', '数值', '单位'])))
mode_counts = {mode: mode_by_step.count(mode) for mode in sorted(set(mode_by_step))}
print('运行模式步数:', mode_counts)`;

const juliaEnvironmentCode = `# 计算环境
using Printf

function markdown_table(rows, columns)
    header = "| " * join(columns, " | ") * " |"
    separator = "| " * join(fill("---", length(columns)), " | ") * " |"
    body = String[]
    for row in rows
        push!(body, "| " * join([string(get(row, column, "")) for column in columns], " | ") * " |")
    end
    return join(vcat([header, separator], body), "\\n")
end`;

const juliaPropertyCode = `# 物性层代码
const R_AIR = 287.05
const T_REF = 298.15
const P_REF = 101325.0
ambient_temperature_k = ambient_temperature_c + 273.15
ambient_pressure_pa = ambient_pressure_bar * 1e5
tes_specific_heat_j_kg_k = tes_specific_heat_kj_kg_k * 1000.0

function cp_air_polynomial(T)
    theta = T - 300.0
    cp = 1006.0 + 0.085 * theta + 1.2e-4 * theta^2
    return max(cp, 950.0)
end

function h_air(T)
    x = T - 300.0
    x0 = 273.15 - 300.0
    return 1006.0 * (T - 273.15) + 0.085 * (x^2 - x0^2) / 2 + 1.2e-4 * (x^3 - x0^3) / 3
end

function T_from_h(h_target; low=180.0, high=1200.0)
    lo, hi = low, high
    for _ in 1:80
        mid = 0.5 * (lo + hi)
        if h_air(mid) < h_target
            lo = mid
        else
            hi = mid
        end
    end
    return 0.5 * (lo + hi)
end

function T_from_u_rho(u_target, rho; low=180.0, high=1200.0)
    lo, hi = low, high
    for _ in 1:80
        mid = 0.5 * (lo + hi)
        u_mid = h_air(mid) - R_AIR * mid
        if u_mid < u_target
            lo = mid
        else
            hi = mid
        end
    end
    return 0.5 * (lo + hi)
end

function air_props(T, p)
    cp = cp_air_polynomial(T)
    cv = cp - R_AIR
    h = h_air(T)
    rho = p / (R_AIR * T)
    s = cp * log(T / T_REF) - R_AIR * log(p / P_REF)
    u = h - R_AIR * T
    return Dict(:T => T, :p => p, :cp => cp, :cv => cv, :h => h, :u => u, :rho => rho, :s => s)
end

h_from_T_p(T, p) = air_props(T, p)[:h]
u_from_T_p(T, p) = air_props(T, p)[:u]
rho_from_T_p(T, p) = air_props(T, p)[:rho]

function T_p_from_u_rho(u, rho)
    T = T_from_u_rho(u, rho)
    p = rho * R_AIR * T
    return T, p
end

function isentropic_h_out(T_in, p_in, p_out)
    props = air_props(T_in, p_in)
    gamma = props[:cp] / props[:cv]
    T_out_s = T_in * (p_out / p_in)^((gamma - 1.0) / gamma)
    return h_air(T_out_s)
end

@printf("环境空气 cp = %.2f J/(kg*K)\\n", air_props(298.15, 101325.0)[:cp])`;

const juliaEquipmentTailCode = `# 设备模型层代码
# ============================================================
# 单位换算与公共常量
# ------------------------------------------------------------
# 作用：本 Julia 版在物性层已经完成 SI 单位换算。
# 后续设备函数统一使用 K、Pa、kg/s、J、W。
# ============================================================

# ============================================================
# 模型 1：压缩机单级模型 compressor_stage
# ------------------------------------------------------------
# 物理意义：把空气从 p_in 压缩到 p_out。
# 输入：T_in [K], p_in [Pa], p_out [Pa], eta_isentropic [-], mass_flow [kg/s]
# 输出：T_out [K], h_out [J/kg], power_w [W]
# ============================================================
function compressor_stage(T_in, p_in, p_out, eta_isentropic, mass_flow)
    h_in = h_from_T_p(T_in, p_in)
    h_out_s = isentropic_h_out(T_in, p_in, p_out)
    h_out = h_in + (h_out_s - h_in) / eta_isentropic
    T_out = T_from_h(h_out)
    power_w = mass_flow * (h_out - h_in)
    return T_out, h_out, power_w
end

# ============================================================
# 模型 2：膨胀机单级模型 expander_stage
# ------------------------------------------------------------
# 物理意义：高压热空气从 p_in 膨胀到 p_out，并输出轴功。
# 输入：T_in [K], p_in [Pa], p_out [Pa], eta_isentropic [-], mass_flow [kg/s]
# 输出：T_out [K], h_out [J/kg], power_w [W]
# ============================================================
function expander_stage(T_in, p_in, p_out, eta_isentropic, mass_flow)
    h_in = h_from_T_p(T_in, p_in)
    h_out_s = isentropic_h_out(T_in, p_in, p_out)
    h_out = h_in - eta_isentropic * (h_in - h_out_s)
    T_out = T_from_h(h_out)
    power_w = mass_flow * max(h_in - h_out, 0.0)
    return T_out, h_out, power_w
end

# ============================================================
# 模型 3：冷却器 / 换热器有效度模型 cooler
# ------------------------------------------------------------
# 原理级关系：Q = epsilon * C_min * (T_hot,in - T_cold,in)
# ============================================================
function cooler(T_hot_in, T_cold_in, heat_capacity_hot, heat_capacity_cold, effectiveness)
    delta_t = max(T_hot_in - T_cold_in, 0.0)
    if delta_t <= 0.0 || heat_capacity_hot <= 0.0 || heat_capacity_cold <= 0.0
        return T_hot_in, T_cold_in, 0.0
    end
    c_min = min(heat_capacity_hot, heat_capacity_cold)
    heat_w = effectiveness * c_min * delta_t
    T_hot_out = T_hot_in - heat_w / heat_capacity_hot
    T_cold_out = T_cold_in + heat_w / heat_capacity_cold
    return T_hot_out, T_cold_out, heat_w
end

# ============================================================
# 模型 4：定容储气罐动态模型 storage_tank_step
# ------------------------------------------------------------
# 核心状态：m_tank、T_tank、p_tank。满足 dm/dt = mdot_in - mdot_out 与 pV = mRT。
# ============================================================
function storage_tank_step(state, m_in, h_in, m_out, dt)
    m_old = max(state[:mass], 1e-6)
    T_old = state[:temperature]
    p_old = state[:pressure]
    u_old = u_from_T_p(T_old, p_old)
    h_out = h_from_T_p(T_old, p_old)
    heat_wall_w = -storage_heat_transfer_coefficient_wk * (T_old - ambient_temperature_k)
    internal_energy = m_old * u_old + m_in * h_in * dt - m_out * h_out * dt + heat_wall_w * dt
    m_new = max(m_old + (m_in - m_out) * dt, 1e-6)
    rho_new = max(m_new / storage_volume_m3, 1e-9)
    u_new = internal_energy / m_new
    T_new, p_new = T_p_from_u_rho(u_new, rho_new)
    return Dict(:mass => m_new, :temperature => T_new, :pressure => p_new)
end

# ============================================================
# 模型 5：热储能 TES 动态模型 tes_step
# ------------------------------------------------------------
# 能量平衡：E_new = E_old + Q_charge*dt - Q_discharge*dt - UA_loss*(T_TES - T_amb)*dt
# ============================================================
function tes_step(tes_state, heat_charge, heat_discharge, dt)
    energy_old = tes_state[:energy_j]
    temperature_old = tes_state[:temperature_k]
    loss_w = tes_ambient_loss_coefficient_wk * (temperature_old - ambient_temperature_k)
    energy_new = max(energy_old + heat_charge * dt - heat_discharge * dt - loss_w * dt, 0.0)
    temperature_k = ambient_temperature_k + energy_new / (tes_mass_kg * tes_specific_heat_j_kg_k)
    return Dict(:energy_j => energy_new, :temperature_k => temperature_k)
end

# ============================================================
# 辅助函数：多级压缩/膨胀的压力序列
# ============================================================
function pressure_sequence(p_start, p_end, stages)
    ratio = (p_end / p_start)^(1.0 / stages)
    values = [p_start]
    for _ in 1:stages
        push!(values, values[end] * ratio)
    end
    values[end] = p_end
    return values
end`;

const juliaSolverCode = `# 系统状态机与求解层代码
function run_caes_cycle()
    dt = time_step_minutes * 60.0
    total_hours = charge_hours + hold_hours + discharge_hours
    total_steps = Int(round(total_hours * 3600.0 / dt)) + 1
    initial_pressure_pa = initial_storage_pressure_bar * 1e5
    initial_rho = rho_from_T_p(ambient_temperature_k, initial_pressure_pa)
    storage_state = Dict(:mass => initial_rho * storage_volume_m3, :temperature => ambient_temperature_k, :pressure => initial_pressure_pa)
    tes_state = Dict(:energy_j => max(tes_mass_kg * tes_specific_heat_j_kg_k * (tes_initial_temperature_c - ambient_temperature_c), 0.0), :temperature_k => tes_initial_temperature_c + 273.15)
    time_hours = Float64[]; pressure_bar = Float64[]; air_temperature_c = Float64[]; air_mass_kg = Float64[]; tes_temperature_c = Float64[]
    compressor_power_mw = Float64[]; expander_power_mw = Float64[]; net_power_mw = Float64[]; charge_heat_mw = Float64[]; discharge_heat_mw = Float64[]; mode_by_step = String[]
    electric_input_j = 0.0; electric_output_j = 0.0; compression_heat_recovered_j = 0.0; tes_heat_delivered_j = 0.0
    for step in 0:(total_steps - 1)
        current_hour = step * dt / 3600.0
        mode = current_hour < charge_hours ? "charge" : (current_hour < charge_hours + hold_hours ? "hold" : "discharge")
        p_tank = storage_state[:pressure]; T_tank = storage_state[:temperature]
        m_dot_in = 0.0; m_dot_out = 0.0; h_in_storage = 0.0; compressor_power_w = 0.0; expander_power_w = 0.0; heat_charge_w = 0.0; heat_discharge_w = 0.0
        if mode == "charge"
            if p_tank >= 0.98 * max_storage_pressure_bar * 1e5
                mode = "charge_pressure_limited"
            else
                m_dot_in = mass_flow_kg_s
                p_final = min(max(p_tank * 1.005, min_storage_pressure_bar * 1e5), 0.98 * max_storage_pressure_bar * 1e5)
                pressures = pressure_sequence(ambient_pressure_pa, p_final, compressor_stages)
                T_air = ambient_temperature_k
                tes_capacity_rate = max(tes_mass_kg * tes_specific_heat_j_kg_k / dt, 1.0)
                for stage in 1:compressor_stages
                    T_air, h_air_stage, power_w = compressor_stage(T_air, pressures[stage], pressures[stage + 1], compressor_efficiency, m_dot_in)
                    compressor_power_w += power_w / motor_efficiency
                    cp_hot = air_props(T_air, pressures[stage + 1])[:cp]
                    hot_capacity_rate = m_dot_in * cp_hot
                    T_air, _, q_w = cooler(T_air, tes_state[:temperature_k], hot_capacity_rate, tes_capacity_rate, heat_exchanger_effectiveness)
                    heat_charge_w += q_w
                end
                h_in_storage = h_from_T_p(T_air, p_final)
                compression_heat_recovered_j += heat_charge_w * dt
                electric_input_j += compressor_power_w * dt
            end
        elseif mode == "discharge"
            if p_tank <= 1.05 * min_storage_pressure_bar * 1e5 || storage_state[:mass] <= 1e-6
                mode = "discharge_pressure_limited"
            else
                available_mass_flow = max((storage_state[:mass] - 1e-6) / dt, 0.0)
                m_dot_out = min(mass_flow_kg_s, available_mass_flow)
                T_air = T_tank
                p_start = p_tank
                p_final = ambient_pressure_pa
                cp_current = air_props(T_air, p_start)[:cp]
                target_turbine_inlet_k = min(max_turbine_inlet_temperature_c + 273.15, max(tes_state[:temperature_k] - minimum_tes_approach_temperature_k, T_air))
                preheat_w = min(max(m_dot_out * cp_current * (target_turbine_inlet_k - T_air), 0.0), max(tes_state[:energy_j] / dt, 0.0))
                if preheat_w > 0.0
                    T_air += preheat_w / max(m_dot_out * cp_current, 1e-9)
                    heat_discharge_w += preheat_w
                end
                pressures = pressure_sequence(p_start, p_final, expander_stages)
                for stage in 1:expander_stages
                    T_air, h_air_stage, power_w = expander_stage(T_air, pressures[stage], pressures[stage + 1], expander_efficiency, m_dot_out)
                    expander_power_w += power_w * generator_efficiency
                    if stage < expander_stages
                        cp_reheat = air_props(T_air, pressures[stage + 1])[:cp]
                        target_reheat_k = min(max_turbine_inlet_temperature_c + 273.15, max(tes_state[:temperature_k] - minimum_tes_approach_temperature_k, T_air))
                        reheat_w = max(m_dot_out * cp_reheat * (target_reheat_k - T_air), 0.0)
                        reheat_w = min(reheat_w, max((tes_state[:energy_j] - heat_discharge_w * dt) / dt, 0.0))
                        if reheat_w > 0.0
                            T_air += reheat_w / max(m_dot_out * cp_reheat, 1e-9)
                            heat_discharge_w += reheat_w
                        end
                    end
                end
                electric_output_j += expander_power_w * dt
                tes_heat_delivered_j += heat_discharge_w * dt
            end
        end
        if startswith(mode, "charge")
            storage_state = storage_tank_step(storage_state, m_dot_in, h_in_storage, 0.0, dt)
            tes_state = tes_step(tes_state, heat_charge_w, 0.0, dt)
        elseif startswith(mode, "discharge")
            storage_state = storage_tank_step(storage_state, 0.0, 0.0, m_dot_out, dt)
            tes_state = tes_step(tes_state, 0.0, heat_discharge_w, dt)
        else
            storage_state = storage_tank_step(storage_state, 0.0, 0.0, 0.0, dt)
            tes_state = tes_step(tes_state, 0.0, 0.0, dt)
        end
        push!(time_hours, current_hour); push!(pressure_bar, storage_state[:pressure] / 1e5); push!(air_temperature_c, storage_state[:temperature] - 273.15); push!(air_mass_kg, storage_state[:mass]); push!(tes_temperature_c, tes_state[:temperature_k] - 273.15)
        push!(compressor_power_mw, compressor_power_w / 1e6); push!(expander_power_mw, expander_power_w / 1e6); push!(net_power_mw, (expander_power_w - compressor_power_w) / 1e6); push!(charge_heat_mw, heat_charge_w / 1e6); push!(discharge_heat_mw, heat_discharge_w / 1e6); push!(mode_by_step, mode)
    end
    round_trip_efficiency = electric_input_j > 0.0 ? electric_output_j / electric_input_j : 0.0
    return Dict(:time_hours => time_hours, :pressure_bar => pressure_bar, :air_temperature_c => air_temperature_c, :air_mass_kg => air_mass_kg, :tes_temperature_c => tes_temperature_c, :compressor_power_mw => compressor_power_mw, :expander_power_mw => expander_power_mw, :net_power_mw => net_power_mw, :charge_heat_mw => charge_heat_mw, :discharge_heat_mw => discharge_heat_mw, :mode_by_step => mode_by_step, :electric_input_j => electric_input_j, :electric_output_j => electric_output_j, :compression_heat_recovered_j => compression_heat_recovered_j, :tes_heat_delivered_j => tes_heat_delivered_j, :round_trip_efficiency => round_trip_efficiency)
end

results = run_caes_cycle()
time_hours = results[:time_hours]; pressure_bar = results[:pressure_bar]; air_temperature_c = results[:air_temperature_c]; air_mass_kg = results[:air_mass_kg]; tes_temperature_c = results[:tes_temperature_c]
compressor_power_mw = results[:compressor_power_mw]; expander_power_mw = results[:expander_power_mw]; net_power_mw = results[:net_power_mw]
mode_by_step = results[:mode_by_step]; round_trip_efficiency = results[:round_trip_efficiency]
@printf("仿真步数: %d\\n", length(time_hours))
@printf("最高储气压力: %.2f bar\\n", maximum(pressure_bar))
@printf("最低储气压力: %.2f bar\\n", minimum(pressure_bar))
@printf("往返效率: %.2f %%\\n", round_trip_efficiency * 100)`;

const juliaVisualizationCode = `# 结果可视化代码
try
    @eval using Plots
    mode_order = ["charge", "charge_pressure_limited", "hold", "discharge", "discharge_pressure_limited"]
    mode_to_value = Dict(mode => index for (index, mode) in enumerate(mode_order))
    mode_values = [get(mode_to_value, mode, 0) for mode in mode_by_step]
    p1 = plot(time_hours, pressure_bar, linewidth=2, label="储气压力", xlabel="时间 / h", ylabel="bar", title="储气罐压力动态")
    hline!(p1, [max_storage_pressure_bar], linestyle=:dash, label="最高压力")
    hline!(p1, [min_storage_pressure_bar], linestyle=:dash, label="最低压力")
    p2 = plot(time_hours, air_temperature_c, linewidth=2, label="空气温度", xlabel="时间 / h", ylabel="degC", title="储气罐空气温度")
    p3 = plot(time_hours, air_mass_kg, linewidth=2, label="空气质量", xlabel="时间 / h", ylabel="kg", title="储气罐空气质量")
    p4 = plot(time_hours, tes_temperature_c, linewidth=2, label="TES 温度", xlabel="时间 / h", ylabel="degC", title="TES 等效温度")
    p5 = plot(time_hours, compressor_power_mw, linewidth=2, label="压缩耗电", xlabel="时间 / h", ylabel="MW", title="系统功率动态")
    plot!(p5, time_hours, expander_power_mw, linewidth=2, label="膨胀发电")
    plot!(p5, time_hours, net_power_mw, linewidth=2, label="净功率")
    p6 = plot(time_hours, mode_values, seriestype=:steppost, linewidth=2, label="运行模式", xlabel="时间 / h", title="运行模式时间轴")
    yticks!(p6, collect(values(mode_to_value)), collect(keys(mode_to_value)))
    plot(p1, p2, p3, p4, p5, p6, layout=(3, 2), size=(1200, 900))
catch err
    println("当前 Julia 环境未安装或无法加载 Plots.jl，因此跳过绘图。")
    println("如需绘图，可在 Julia 中运行: using Pkg; Pkg.add(\\"Plots\\")")
    println("模型结果数组仍已生成，可查看 pressure_bar、tes_temperature_c、net_power_mw 等变量。")
end`;

const juliaResultCode = `# 关键结果输出
electric_input_mwh = results[:electric_input_j] / 3.6e9
electric_output_mwh = results[:electric_output_j] / 3.6e9
compression_heat_recovered_mwh = results[:compression_heat_recovered_j] / 3.6e9
tes_heat_delivered_mwh = results[:tes_heat_delivered_j] / 3.6e9
summary_rows = [
    Dict("指标" => "压缩阶段电输入", "数值" => @sprintf("%.3f", electric_input_mwh), "单位" => "MWh"),
    Dict("指标" => "膨胀阶段电输出", "数值" => @sprintf("%.3f", electric_output_mwh), "单位" => "MWh"),
    Dict("指标" => "系统往返效率", "数值" => @sprintf("%.2f", round_trip_efficiency * 100), "单位" => "%"),
    Dict("指标" => "最高储气压力", "数值" => @sprintf("%.2f", maximum(pressure_bar)), "单位" => "bar"),
    Dict("指标" => "最低储气压力", "数值" => @sprintf("%.2f", minimum(pressure_bar)), "单位" => "bar"),
    Dict("指标" => "最终 TES 温度", "数值" => @sprintf("%.2f", tes_temperature_c[end]), "单位" => "degC"),
    Dict("指标" => "压缩热回收量", "数值" => @sprintf("%.3f", compression_heat_recovered_mwh), "单位" => "MWh_th"),
    Dict("指标" => "TES 放热量", "数值" => @sprintf("%.3f", tes_heat_delivered_mwh), "单位" => "MWh_th")
]
println(markdown_table(summary_rows, ["指标", "数值", "单位"]))
mode_counts = Dict(mode => count(==(mode), mode_by_step) for mode in unique(mode_by_step))
println("运行模式步数: ", mode_counts)`;

function flowMarkdown(config: CaesExampleConfig, isJulia: boolean): string {
  return `# ${isJulia ? `${config.exampleName} Julia 版` : config.exampleName}

本 Notebook 是一个面向代码可视化展示的 **先进绝热压缩空气储能 AA-CAES** 系统级 process 仿真${isJulia ? ' Julia 语言版本' : '原型'}。它把压缩机、换热器、储气罐、热储能 TES、膨胀机和发电机放在同一个动态流程中，展示电能、压力能和热能在完整充放电周期中的转化。`;
}

function commonCells(config: CaesExampleConfig, language: CaesNotebookLanguage): NotebookCell[] {
  const isJulia = language === 'julia';
  return [
    markdownCell(flowMarkdown(config, isJulia)),
    markdownCell(`## 1. 工艺流程说明

流程链路：

文本流程:
环境空气 -> 多级压缩机 -> 级间冷却 / TES 充热 -> 高压储气罐
     -> 静置保压与热损失
     -> TES 加热 -> 多级膨胀机 -> 发电机输出

当前只实现第一种工况：charge_hold_discharge，即充电、静置、放电。`),
    markdownCell(`## 2. 建模假设

1. 储气罐采用 0D 集中参数模型，不做三维空间分布。
2. 空气物性采用原理级热力学模型，${isJulia ? 'Julia 版使用显式 cp(T) 变比热模型' : 'Python 版优先使用 CoolProp，未安装时使用透明 cp(T) 备用模型'}。
3. 压缩机和膨胀机采用多级等熵效率模型，各级等压比分配。
4. 换热器采用有效度模型，压缩热回收至 TES，放电时 TES 为膨胀前空气再热。
5. TES 采用集中参数模型，跟踪储热量和等效温度。
6. 时间推进采用显式欧拉法，便于代码可视化展示。`),
    markdownCell(`## 3. 参数说明表

${parameterMarkdown(config)}`),
    markdownCell(`## 4. 数学模型

压缩机：

T2 = T1 * (1 + (pi_c^((k-1)/k) - 1) / eta_c)
Wc = mdot * cp * (T2 - T1)

定容储气罐：

dm/dt = mdot_in - mdot_out
pV = mRT

膨胀机：

T4 = T3 * (1 - eta_t * (1 - pi_t^((1-k)/k)))
Wt = mdot * cp * (T3 - T4)
`)
  ];
}

function analysisHint(language: CaesNotebookLanguage): string {
  return `1. 调大 storage_volume_m3 后，储气压力变化更慢，系统可放电时间更长。
2. 调高 heat_exchanger_effectiveness 后，TES 能回收更多压缩热，放电阶段再热能力增强。
3. 调大 tes_mass_kg 后，TES 温度变化更平缓，但温升也会降低。
4. ${language === 'julia' ? 'Julia 版依赖少，适合观察科学计算代码结构。' : 'Python 版更适合与当前 JupyterLab 参数绑定和 Matplotlib 可视化集成。'}
5. 当前只实现 charge_hold_discharge 第一种工况。`;
}

function generatePythonCaesNotebook(config: CaesExampleConfig): NotebookModel {
  return makeNotebook([
    ...commonCells(config, 'python'),
    markdownCell('## 5. 计算环境\\n\\n这里导入 Notebook 后续计算和绘图所需的基础库。'),
    codeCell(pythonEnvironmentCode),
    markdownCell('## 6. 参数层代码\\n\\n这里定义 CAES process 仿真的主要输入参数。生成 Notebook 后，左侧参数绑定侧边栏会按 metadata 将数值参数显示为滑块。'),
    codeCell(pythonParameterCode(config)),
    markdownCell('## 7. 物性层代码\\n\\n本层优先使用 CoolProp 计算空气物性。如果当前环境没有 CoolProp，Notebook 会启用可见的 `cp(T)` 变比热备用模型。'),
    codeCell(pythonPropertyCode),
    markdownCell(`## 8. 设备模型层代码

本层按设备边界拆分为五个小模型，代码中也用分段标题标出。`),
    codeCell(pythonEquipmentCode),
    markdownCell('## 9. 系统状态机与求解层代码\\n\\n这里执行完整充电、静置和放电周期，并输出所有后续绘图与结果分析所需的数组。'),
    codeCell(pythonSolverCode),
    markdownCell('## 10. 结果可视化代码\\n\\n这里绘制储气压力、温度、空气质量、TES 温度、功率和运行模式时间轴。'),
    codeCell(pythonVisualizationCode),
    markdownCell('## 11. 关键结果输出\\n\\n这里集中输出输入电量、输出电量、往返效率、压力范围、TES 温度和热量利用。'),
    codeCell(pythonResultCode),
    markdownCell(`## 12. 结果分析提示

${analysisHint('python')}`)
  ], 'python');
}

function generateJuliaCaesNotebook(config: CaesExampleConfig): NotebookModel {
  return makeNotebook([
    ...commonCells(config, 'julia'),
    markdownCell('## 5. 计算环境\\n\\n核心计算只使用 Julia Base 和标准库 `Printf`。绘图在后面单独尝试加载 `Plots.jl`。'),
    codeCell(juliaEnvironmentCode),
    markdownCell('## 6. 参数层代码\\n\\n变量命名与 Python 版保持一致，方便比较两种语言实现。'),
    codeCell(juliaParameterCode(config)),
    markdownCell('## 7. 物性层代码\\n\\nJulia 版采用显式 `cp(T)` 变比热模型，不强制依赖外部物性包。'),
    codeCell(juliaPropertyCode),
    markdownCell(`## 8. 设备模型层代码

本层按设备边界拆分为五个小模型，代码中也用分段标题标出。`),
    codeCell(juliaEquipmentTailCode),
    markdownCell('## 9. 系统状态机与求解层代码\\n\\n这里执行完整充电、静置和放电周期，并输出所有后续绘图与结果分析所需的数组。'),
    codeCell(juliaSolverCode),
    markdownCell('## 10. 结果可视化代码\\n\\n该单元尝试使用 `Plots.jl`。如果环境未安装 `Plots`，模型计算结果仍然可用，只是不会绘制图像。'),
    codeCell(juliaVisualizationCode),
    markdownCell('## 11. 关键结果输出\\n\\n这里集中输出输入电量、输出电量、往返效率、压力范围、TES 温度和热量利用。'),
    codeCell(juliaResultCode),
    markdownCell(`## 12. 结果分析提示

${analysisHint('julia')}`)
  ], 'julia');
}

export function generateCaesNotebook(config: CaesExampleConfig = DEFAULT_CAES_CONFIG): NotebookModel {
  return config.language === 'julia'
    ? generateJuliaCaesNotebook(config)
    : generatePythonCaesNotebook(config);
}

export function makeCaesNotebookFilename(config: CaesExampleConfig): string {
  const cleaned = config.exampleName
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80) || '压缩空气储能仿真';
  const timestamp = new Date().toISOString().slice(0, 23).replace(/[T:.]/g, '-');
  return `official-thermal-caes-${config.language}_${cleaned}_${timestamp}.ipynb`;
}
