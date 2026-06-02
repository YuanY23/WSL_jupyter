/**
 * NotebookGenerator.ts
 * ===================================================
 * 为每个仿真场景生成自包含的 .ipynb JSON。
 * 遵循仿真平台 12 栏结构设计，且每个参数独占一个 cell，便于前端滑块绑定。
 */

// 场景中文名称
const SCENARIO_NAMES: Record<string, string> = {
    steady_flat_plate: '一维稳态导热 · 无限大平板 (FDM)',
    steady_multilayer_plate: '一维稳态导热 · 多层复合平板 (FVM)',
    steady_cylindrical_wall: '一维稳态导热 · 圆筒壁径向导热 (FDM)',
    steady_straight_fin: '一维稳态导热 · 等截面直肋 (FVM)',
    transient_plate_const_temp: '一维瞬态导热 · 两侧恒温加热 (显式FDM)',
    transient_plate_const_flux: '一维瞬态导热 · 一侧恒定热流 (隐式FVM)',
    convection_laminar_plate: '对流换热 · 平板层流强制对流',
    convection_turbulent_plate: '对流换热 · 平板湍流强制对流',
    convection_natural_vertical: '对流换热 · 竖板自然对流',
    convection_internal_tube: '对流换热 · 圆管内强迫对流',
    radiation_parallel_plates: '热辐射 · 平行平板辐射换热',
    radiation_3surface: '热辐射 · 三表面空腔辐射',
    steady_internal_heat: '一维稳态导热 · 内热源平壁 (解析解)',
    steady_2d_plate: '二维稳态导热 · 矩形平板 (FDM)',
};

// 全局静态参数属性映射，包含中文名称、单位、控件类型、最小值、最大值和步长
interface ParamConfig {
    label: string;
    unit: string;
    type: 'slider' | 'number' | 'boolean' | 'dropdown';
    min: number;
    max: number;
    step: number;
}

export interface ParamControlOverride {
    type?: 'slider' | 'number' | 'boolean' | 'dropdown';
    label?: string;
    min?: number;
    max?: number;
    step?: number;
    group?: string;
}

export interface ThermalNotebookInput {
    values: Record<string, number>;
    controls?: Record<string, ParamControlOverride>;
}

type ThermalGenerateInput = Record<string, number> | ThermalNotebookInput;

let activeControlOverrides: Record<string, ParamControlOverride> = {};

const PARAM_CONFIGS: Record<string, ParamConfig> = {
    thickness: { label: '平板厚度', unit: 'm', type: 'slider', min: 0.001, max: 10, step: 0.001 },
    L1: { label: '第1层厚度', unit: 'm', type: 'slider', min: 0.001, max: 1, step: 0.001 },
    L2: { label: '第2层厚度', unit: 'm', type: 'slider', min: 0.001, max: 1, step: 0.001 },
    L3: { label: '第3层厚度', unit: 'm', type: 'slider', min: 0.001, max: 1, step: 0.001 },
    r_inner: { label: '内半径', unit: 'm', type: 'slider', min: 0.001, max: 10, step: 0.001 },
    r_outer: { label: '外半径', unit: 'm', type: 'slider', min: 0.002, max: 10, step: 0.001 },
    fin_length: { label: '肋片长度', unit: 'm', type: 'slider', min: 0.001, max: 1, step: 0.001 },
    fin_thickness: { label: '肋片厚度', unit: 'm', type: 'slider', min: 0.0001, max: 0.1, step: 0.0001 },
    fin_width: { label: '肋片宽度', unit: 'm', type: 'slider', min: 0.001, max: 1, step: 0.001 },
    plate_length: { label: '平板长度', unit: 'm', type: 'slider', min: 0.01, max: 50, step: 0.01 },
    plate_height: { label: '板高', unit: 'm', type: 'slider', min: 0.01, max: 10, step: 0.01 },
    length: { label: '长度', unit: 'm', type: 'slider', min: 0.01, max: 10, step: 0.01 },
    width: { label: '宽度', unit: 'm', type: 'slider', min: 0.01, max: 10, step: 0.01 },
    tube_length: { label: '管长', unit: 'm', type: 'slider', min: 0.01, max: 100, step: 0.01 },
    tube_diameter: { label: '管径', unit: 'm', type: 'slider', min: 0.001, max: 2, step: 0.001 },
    area_1: { label: '表面1面积', unit: 'm²', type: 'slider', min: 0.01, max: 1000, step: 0.01 },
    area_2: { label: '表面2面积', unit: 'm²', type: 'slider', min: 0.01, max: 1000, step: 0.01 },

    thermal_conductivity: { label: '导热系数', unit: 'W/(m·K)', type: 'slider', min: 0.01, max: 5000, step: 0.1 },
    k1: { label: '第1层导热系数', unit: 'W/(m·K)', type: 'slider', min: 0.01, max: 5000, step: 0.1 },
    k2: { label: '第2层导热系数', unit: 'W/(m·K)', type: 'slider', min: 0.01, max: 5000, step: 0.1 },
    k3: { label: '第3层导热系数', unit: 'W/(m·K)', type: 'slider', min: 0.01, max: 5000, step: 0.1 },
    alpha: { label: '热扩散率', unit: 'm²/s', type: 'number', min: 1e-8, max: 1e-3, step: 1e-7 },
    density: { label: '密度', unit: 'kg/m³', type: 'slider', min: 100, max: 20000, step: 1 },
    specific_heat: { label: '比热', unit: 'J/(kg·K)', type: 'slider', min: 100, max: 5000, step: 1 },
    fluid_k: { label: '流体导热系数', unit: 'W/(m·K)', type: 'slider', min: 0.001, max: 100, step: 0.001 },
    fluid_nu: { label: '运动粘度', unit: 'm²/s', type: 'number', min: 1e-7, max: 1e-3, step: 1e-7 },
    fluid_Pr: { label: 'Prandtl 数', unit: '', type: 'slider', min: 0.001, max: 1000, step: 0.001 },
    fluid_rho: { label: '流体密度', unit: 'kg/m³', type: 'slider', min: 0.1, max: 20000, step: 0.1 },
    fluid_cp: { label: '流体比热', unit: 'J/(kg·K)', type: 'slider', min: 100, max: 5000, step: 1 },
    emissivity1: { label: '板1发射率', unit: '', type: 'slider', min: 0.01, max: 1, step: 0.01 },
    emissivity2: { label: '板2发射率', unit: '', type: 'slider', min: 0.01, max: 1, step: 0.01 },
    emissivity_shield: { label: '遮热板发射率', unit: '', type: 'slider', min: 0.01, max: 1, step: 0.01 },
    emissivity_1: { label: '表面1发射率', unit: '', type: 'slider', min: 0.01, max: 1, step: 0.01 },
    emissivity_2: { label: '表面2发射率', unit: '', type: 'slider', min: 0.01, max: 1, step: 0.01 },

    temp_left: { label: '左侧边界温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_right: { label: '右侧边界温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_top: { label: '上侧边界温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_bottom: { label: '下侧边界温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_inner: { label: '内壁温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_outer: { label: '外壁温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_base: { label: '肋根温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_ambient: { label: '环境温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_init: { label: '初始温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_surface: { label: '壁面温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_wall: { label: '壁面温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_fluid: { label: '流体温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_plate1: { label: '板1温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_plate2: { label: '板2温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_inlet: { label: '入口温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_1: { label: '表面1温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    temp_2: { label: '表面2温度', unit: '°C', type: 'slider', min: -273, max: 3000, step: 1 },
    internal_heat_rate: { label: '内热源强度', unit: 'W/m³', type: 'number', min: -1e8, max: 1e8, step: 1000 },
    h_conv: { label: '对流换热系数', unit: 'W/(m²·K)', type: 'slider', min: 0.1, max: 50000, step: 0.1 },
    heat_flux: { label: '热流密度', unit: 'W/m²', type: 'slider', min: 0, max: 1e6, step: 10 },
    velocity: { label: '流速', unit: 'm/s', type: 'slider', min: 0.01, max: 100, step: 0.01 },
    view_factor_12: { label: '角系数 F12', unit: '', type: 'slider', min: 0, max: 1, step: 0.01 },

    n_nodes: { label: '节点数', unit: '个', type: 'slider', min: 10, max: 1000, step: 1 },
    nx: { label: 'x 分辨率', unit: '个', type: 'slider', min: 3, max: 100, step: 1 },
    ny: { label: 'y 分辨率', unit: '个', type: 'slider', min: 3, max: 100, step: 1 },
    n_shield: { label: '遮热板数量', unit: '块', type: 'slider', min: 0, max: 10, step: 1 },
    time: { label: '仿真时间', unit: 's', type: 'slider', min: 0.1, max: 100000, step: 0.1 },

    N: { label: '空间节点数', unit: '个', type: 'slider', min: 10, max: 200, step: 1 },
    n_per_layer: { label: '每层节点数', unit: '个', type: 'slider', min: 5, max: 50, step: 1 },
    n_snapshots: { label: '快照数量', unit: '个', type: 'slider', min: 2, max: 10, step: 1 },
    n_steps: { label: '时间推进步数', unit: '个', type: 'slider', min: 10, max: 1000, step: 1 },
    Re_cr: { label: '临界雷诺数', unit: '', type: 'number', min: 1e4, max: 1e7, step: 1000 },
    g: { label: '重力加速度', unit: 'm/s²', type: 'number', min: 1.0, max: 20.0, step: 0.01 },
    sigma: { label: '玻尔兹曼常数', unit: 'W/(m²·K⁴)', type: 'number', min: 1e-9, max: 1e-7, step: 1e-10 }
};

// ============================================================
//  Notebook 生成底座
// ============================================================

function cellSourceToString(cell: any): string {
    const source = cell.source || '';
    return Array.isArray(source) ? source.join('') : String(source);
}

function isNumberedMarkdownHeading(cell: any): boolean {
    return cell.cell_type === 'markdown' && /^##\s+\d+\./.test(cellSourceToString(cell).trim());
}

function isParameterLayerHeading(cell: any): boolean {
    return cell.cell_type === 'markdown' && cellSourceToString(cell).includes('参数层代码');
}

function normalizeParameterLayerHeading(cell: any): any {
    const source = cellSourceToString(cell).replace(
        /下方每个参数都各自占用一个单元格，您可以通过拖拽左侧的滑块调节参数，系统会自动同步更新对应单元格的代码并运行计算。/g,
        '下方参数统一写入同一个代码单元格，您可以通过拖拽左侧的滑块调节参数，系统会自动同步更新参数代码并运行计算。'
    );
    return {
        ...cell,
        source: source.split('\n').map(l => l + '\n')
    };
}

function mergeParameterLayerCells(cells: any[]): any[] {
    const mergedCells: any[] = [];

    for (let index = 0; index < cells.length; index += 1) {
        const cell = cells[index];
        if (!isParameterLayerHeading(cell)) {
            mergedCells.push(cell);
            continue;
        }

        mergedCells.push(normalizeParameterLayerHeading(cell));

        const sources: string[] = [];
        const bindingParameters: Record<string, any> = {};
        let cursor = index + 1;
        while (cursor < cells.length && !isNumberedMarkdownHeading(cells[cursor])) {
            const candidate = cells[cursor];
            if (candidate.cell_type === 'code') {
                const source = cellSourceToString(candidate).replace(/\s+$/g, '');
                if (source) {
                    sources.push(source);
                }
                const cellBindings = candidate.metadata?.simulation_param_bindings?.parameters;
                if (cellBindings) {
                    Object.assign(bindingParameters, cellBindings);
                }
            }
            cursor += 1;
        }

        if (sources.length > 0) {
            mergedCells.push(code(sources.join('\n'), {
                simulation_param_bindings: {
                    parameters: bindingParameters
                }
            }));
        }

        index = cursor - 1;
    }

    return mergedCells;
}

function makeNotebook(title: string, cells: any[]): any {
    const notebookCells = mergeParameterLayerCells(cells);
    const bindingParameters: Record<string, any> = {};
    notebookCells.forEach(cell => {
        const cellBindings = cell.metadata?.simulation_param_bindings?.parameters;
        if (cellBindings) {
            Object.assign(bindingParameters, cellBindings);
        }
    });

    return {
        cells: notebookCells,
        metadata: {
            kernelspec: { display_name: 'Python 3 (ipykernel)', language: 'python', name: 'python3' },
            language_info: { name: 'python', version: '3.10.0', file_extension: '.py' },
            simulation_param_bindings: {
                version: 1,
                title: '参数层代码',
                parameters: bindingParameters
            }
        },
        nbformat: 4,
        nbformat_minor: 5
    };
}

function md(source: string) {
    return { cell_type: 'markdown', metadata: {}, source: source.split('\n').map(l => l + '\n') };
}

function code(source: string, metadata: Record<string, any> = {}) {
    return { cell_type: 'code', execution_count: null, metadata, outputs: [], source: source.split('\n').map(l => l + '\n') };
}

function controlOverrideFor(pythonName: string, controlPanelKey: string): ParamControlOverride {
    return activeControlOverrides[pythonName] || activeControlOverrides[controlPanelKey] || {};
}

// 自动组装生成单个参数的代码单元格，控件配置写入 Notebook metadata
function makeParamCell(pythonName: string, controlPanelKey: string, value: number, group: string = '参数层代码'): any {
    const config = PARAM_CONFIGS[controlPanelKey] || PARAM_CONFIGS[pythonName];
    const override = controlOverrideFor(pythonName, controlPanelKey);
    if (!config) {
        return code(`${pythonName} = ${value}`, {
            simulation_param_bindings: {
                parameters: {
                    [pythonName]: {
                        type: override.type || 'slider',
                        label: override.label || pythonName,
                        min: override.min,
                        max: override.max,
                        step: override.step,
                        group: override.group || group
                    }
                }
            }
        });
    }
    const meta: any = {
        type: override.type || config.type,
        label: `${config.label}${config.unit ? ' (' + config.unit + ')' : ''}`,
        min: override.min ?? config.min,
        max: override.max ?? config.max,
        step: override.step ?? config.step,
        group: override.group || group
    };
    if (override.label) {
        meta.label = override.label;
    }
    return code(`${pythonName} = ${value}`, {
        simulation_param_bindings: {
            parameters: {
                [pythonName]: meta
            }
        }
    });
}

// 动态生成 Markdown 格式的参数说明表
function makeParameterTable(items: { name: string; key: string; value: number }[]): string {
    const header = '| 参数变量 | 默认数值 | 单位 | 物理意义说明 |\n| --- | ---: | --- | --- |';
    const body = items.map(item => {
        const config = PARAM_CONFIGS[item.key] || PARAM_CONFIGS[item.name];
        const label = config ? config.label : item.name;
        const unit = config ? config.unit : '-';
        return `| ${item.name} | ${item.value} | ${unit} | ${label} |`;
    });
    return [header, ...body].join('\n');
}

// 全局导入和中文字体设置，用于合并进“模型层代码”
const SETUP_IMPORTS_CODE = `# 导入科学计算与绘图库
%matplotlib inline
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import os

# 加载全局中文字体，支持 Windows(SimHei/YaHei) 和 Linux(WenQuanYi)
plt.rcParams['font.sans-serif'] = ['SimHei', 'WenQuanYi Micro Hei', 'WenQuanYi Zen Hei', 'Microsoft YaHei', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False`;

// ============================================================
//  场景 1: 无限大平板导热 (FDM)
// ============================================================
function gen_steady_flat_plate(params: Record<string, number>) {
    const paramItems = [
        { name: 'L', key: 'thickness', value: params.thickness },
        { name: 'k', key: 'thermal_conductivity', value: params.thermal_conductivity },
        { name: 'T_left', key: 'temp_left', value: params.temp_left },
        { name: 'T_right', key: 'temp_right', value: params.temp_right },
        { name: 'N', key: 'N', value: 50 }
    ];

    return makeNotebook('无限大平板导热', [
        md(`# 一维稳态导热 · 无限大平板 (有限差分法 FDM)`),
        md(`## 1. 仿真问题说明
一维稳态无内热源导热问题。一块厚度为 L 的无限大平板，左侧温度为 T_left，右侧温度为 T_right，导热系数 k 为常数。本仿真旨在研究在一维理想条件下，平板内部的稳态温度分布规律以及通过平板的热流密度大小。`),
        md(`## 2. 模型假设
- 平板沿宽度与高度方向无限延伸，温度场仅在厚度方向（x轴正方向）发生变化，可简化为一维传热模型。
- 平板材料是各向同性且均匀的，导热系数 k 为常数，不随温度或空间位置改变。
- 导热过程处于稳态，系统不随时间演化。
- 平板内部没有内热源。`),
        md(`## 3. 参数说明表
${makeParameterTable(paramItems)}`),
        md(`## 4. 数学模型或计算规则
一维稳态导热控制微分方程（Laplace方程）：
$$\\frac{d^2T}{dx^2} = 0 \\quad (0 < x < L)$$

### 边界条件：
- 左侧第一类边界：$T(0) = T_{left}$
- 右侧第一类边界：$T(L) = T_{right}$

### 理论解析解
对控制方程进行二次积分即可得到温度分布的线性解析解：
$$T(x) = T_{left} + (T_{right} - T_{left}) \\cdot \\frac{x}{L}$$
通过平板的稳态热流密度为：
$$q = -k \\frac{dT}{dx} = k \\frac{T_{left} - T_{right}}{L}$$

### 数值求解方法
采用有限差分法 (FDM) 离散空间，对内部节点使用二阶中心差商离散微分方程，最后求解联立的三对角方程组 $A \\cdot T = b$。`),
        md(`## 5. 参数层代码
下方每个参数都各自占用一个单元格，您可以通过拖拽左侧的滑块调节参数，系统会自动同步更新对应单元格的代码并运行计算。`),
        makeParamCell('L', 'thickness', params.thickness),
        makeParamCell('k', 'thermal_conductivity', params.thermal_conductivity),
        makeParamCell('T_left', 'temp_left', params.temp_left),
        makeParamCell('T_right', 'temp_right', params.temp_right),
        makeParamCell('N', 'N', 50),
        md(`## 6. 模型层代码
这里导入计算基础库并初始化网格。`),
        code(`${SETUP_IMPORTS_CODE}

dx = L / (N - 1)
x = np.linspace(0, L, N)`),
        md(`## 7. 求解层代码
利用数值求解器组装系数矩阵 $A$ 并求解，同时计算理论解析解。`),
        code(`# 组装三对角系数矩阵
A = np.zeros((N, N))
b = np.zeros(N)

# 边界条件
A[0, 0] = 1.0;      b[0] = T_left
A[-1, -1] = 1.0;    b[-1] = T_right

# 内部节点: T[i-1] - 2*T[i] + T[i+1] = 0
for i in range(1, N - 1):
    A[i, i - 1] = 1.0
    A[i, i]     = -2.0
    A[i, i + 1] = 1.0
    b[i] = 0.0

T_numerical = np.linalg.solve(A, b)

# 解析解
T_analytical = T_left + (T_right - T_left) * x / L`),
        md(`## 8. 结果可视化代码
绘制数值解与解析解温度分布对比图。`),
        code(`plt.figure(figsize=(10, 6))
plt.plot(x * 1000, T_numerical, 'bo-', markersize=4, label='FDM 数值解')
plt.plot(x * 1000, T_analytical, 'r--', linewidth=2, label='解析解')
plt.xlabel('位置 x (mm)')
plt.ylabel('温度 T (°C)')
plt.title('无限大平板一维稳态导热 — FDM 求解')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`),
        md(`## 9. 关键结果输出
输出数值误差以及稳态热流密度。`),
        code(`max_error = np.max(np.abs(T_numerical - T_analytical))
print(f"最大误差: {max_error:.2e} °C")
print(f"热流密度 q = k·ΔT/L = {k * (T_left - T_right) / L:.2f} W/m^2")`),
        md(`## 10. 可修改参数提示
- 调节平板厚度 \`L\`：厚度增加时，热阻增大，通过平壁的热流密度 \`q\` 将按反比例下降。
- 改变导热系数 \`k\`：导热系数增加，热传导能力更强，热流密度 \`q\` 同步正比例增加。
- 改变两侧边界温差 \`T_left - T_right\`：温差越大，传热驱动力越大，热流密度越大，内部温度分布保持线性。
- 尝试修改空间节点数 \`N\`：稳态一维无内热源导热中，中心差分无截断误差，节点数对精度影响微乎其微。`),
        md(`## 11. 结果分析提示
- 一维稳态、常导热系数且无内热源的平板导热，其内部温度分布的理论解是完全的直线（线性分布）。
- 数值解与解析解的最大误差极小（机器精度级别），说明中心差分方案在此场景下非常精确。`)
    ]);
}

// ============================================================
//  场景 2: 多层复合平板导热 (FVM)
// ============================================================
function gen_steady_multilayer_plate(params: Record<string, number>) {
    const paramItems = [
        { name: 'L1', key: 'L1', value: params.L1 },
        { name: 'k1', key: 'k1', value: params.k1 },
        { name: 'L2', key: 'L2', value: params.L2 },
        { name: 'k2', key: 'k2', value: params.k2 },
        { name: 'L3', key: 'L3', value: params.L3 },
        { name: 'k3', key: 'k3', value: params.k3 },
        { name: 'T_left', key: 'temp_left', value: params.temp_left },
        { name: 'T_right', key: 'temp_right', value: params.temp_right },
        { name: 'n_per_layer', key: 'n_per_layer', value: 20 }
    ];

    return makeNotebook('多层复合平板导热', [
        md(`# 一维稳态导热 · 多层复合平板 (有限体积法 FVM)`),
        md(`## 1. 仿真问题说明
三层不同材料构成的复合平壁的一维稳态导热问题。左侧表面温度为 T_left，右侧表面温度为 T_right。旨在分析不同导热系数和厚度的多层复合平壁内部的稳态温度曲线分布、计算各层热阻及通过复合平板的总热流密度。`),
        md(`## 2. 模型假设
- 复合平板沿宽度和高度方向无限延伸，简化为一维导热问题。
- 各层材料均匀、各向同性，每一层内部的导热系数为常数。
- 界面间接触完全贴合，不考虑层与层之间的接触热阻。
- 系统无内部热源，属于稳态传热。`),
        md(`## 3. 参数说明表
${makeParameterTable(paramItems)}`),
        md(`## 4. 数学模型或计算规则
一维稳态传热方程在各层中为：
$$\\frac{d}{dx}\\left( k(x) \\frac{dT}{dx} \\right) = 0$$

### 界面交界处处理（有限体积法 FVM）：
对于相邻的不同材质节点，控制体积交界处的等效导热系数采用调和平均数以保证热流连续性：
$$k_e = \\frac{2 k_L k_R}{k_L + k_R}$$

### 理论解析解：
根据热阻串联公式：
$$R_{total} = \\sum_{j=1}^3 \\frac{L_j}{k_j}$$
$$q = \\frac{T_{left} - T_{right}}{R_{total}}$$
各界面处的温度值可以通过热流密度 $q$ 依次计算得出。`),
        md(`## 5. 参数层代码
定义各层厚度、导热系数和两侧温差。您可以通过侧边栏滑块调节这些参数。`),
        makeParamCell('L1', 'L1', params.L1),
        makeParamCell('k1', 'k1', params.k1),
        makeParamCell('L2', 'L2', params.L2),
        makeParamCell('k2', 'k2', params.k2),
        makeParamCell('L3', 'L3', params.L3),
        makeParamCell('k3', 'k3', params.k3),
        makeParamCell('T_left', 'temp_left', params.temp_left),
        makeParamCell('T_right', 'temp_right', params.temp_right),
        makeParamCell('n_per_layer', 'n_per_layer', 20),
        md(`## 6. 模型层代码
这里导入计算基础库并初始化复合平板的网格与物理物性数组。`),
        code(`${SETUP_IMPORTS_CODE}

layers = [(L1, k1), (L2, k2), (L3, k3)]
L_total = sum(l for l, _ in layers)
N = n_per_layer * len(layers)
dx = L_total / N

# 节点坐标与导热系数
x_nodes = np.array([(i + 0.5) * dx for i in range(N)])
k_nodes = np.zeros(N)
cumulative = 0.0
for L_layer, k_layer in layers:
    for i in range(N):
        if cumulative <= x_nodes[i] < cumulative + L_layer:
            k_nodes[i] = k_layer
    cumulative += L_layer
k_nodes[k_nodes == 0] = layers[-1][1]`),
        md(`## 7. 求解层代码
组装 FVM 离散方程，在内部节点和边界节点上组装控制方程，求解出多层壁面内部温度场。`),
        code(`# 组装系数矩阵
A = np.zeros((N, N))
b = np.zeros(N)

for i in range(N):
    if i == 0:
        k_e = 2 * k_nodes[0] * k_nodes[1] / (k_nodes[0] + k_nodes[1])
        a_E = k_e / dx
        a_W_boundary = k_nodes[0] / (dx / 2)
        A[i, i] = a_E + a_W_boundary
        A[i, i + 1] = -a_E
        b[i] = a_W_boundary * T_left
    elif i == N - 1:
        k_w = 2 * k_nodes[-1] * k_nodes[-2] / (k_nodes[-1] + k_nodes[-2])
        a_W = k_w / dx
        a_E_boundary = k_nodes[-1] / (dx / 2)
        A[i, i] = a_W + a_E_boundary
        A[i, i - 1] = -a_W
        b[i] = a_E_boundary * T_right
    else:
        k_w = 2 * k_nodes[i] * k_nodes[i - 1] / (k_nodes[i] + k_nodes[i - 1])
        k_e = 2 * k_nodes[i] * k_nodes[i + 1] / (k_nodes[i] + k_nodes[i + 1])
        a_W = k_w / dx
        a_E = k_e / dx
        A[i, i] = a_W + a_E
        A[i, i - 1] = -a_W
        A[i, i + 1] = -a_E

T = np.linalg.solve(A, b)`),
        md(`## 8. 结果可视化代码
绘制多层复合平壁内部的温度场曲线，并用彩色背景标识不同的材料层。`),
        code(`fig, ax = plt.subplots(figsize=(10, 6))
ax.plot(x_nodes * 1000, T, 'b-o', markersize=3, label='FVM 数值解')

# 标记层界面
cumL = 0
colors = ['#FFE0B2', '#E3F2FD', '#E8F5E9']
for idx, (L_l, k_l) in enumerate(layers):
    ax.axvspan(cumL * 1000, (cumL + L_l) * 1000, alpha=0.3, color=colors[idx],
               label=f'层{idx+1}: k={k_l} W/(m·K)')
    cumL += L_l

ax.set_xlabel('位置 x (mm)')
ax.set_ylabel('温度 T (°C)')
ax.set_title('多层复合平板一维稳态导热 — FVM 求解')
ax.legend()
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`),
        md(`## 9. 关键结果输出
输出热阻计算值和热流密度计算值。`),
        code(`R_total = sum(L_l / k_l for L_l, k_l in layers)
q = (T_left - T_right) / R_total
print(f"热流密度 q = {q:.2f} W/m^2")
print(f"总热阻 R = {R_total:.6f} m²·K/W")`),
        md(`## 10. 可修改参数提示
- 调节第二层（隔热层）导热系数 \`k2\` 和厚度 \`L2\`：对于保温结构，减小 \`k2\` 或增加 \`L2\` 可以显著降低总热流密度 \`q\`。
- 改变层顺序或厚度比例：在总厚度不变的情况下改变材料组合，探索不同工况下的界面极限温度。`),
        md(`## 11. 结果分析提示
- 在一维无源稳态导热中，虽然不同材料内的温度斜率不同（导热系数 k 越小，热阻越大，局部温度下降越陡峭），但通过各层截面的热流密度是处处相等的（热流守恒）。
- 控制体积交界处的调和平均等效导热系数是保证不同介质界面热流连续性的关键。`)
    ]);
}

// ============================================================
//  场景 3: 圆筒壁径向导热 (FDM)
// ============================================================
function gen_steady_cylindrical_wall(params: Record<string, number>) {
    const paramItems = [
        { name: 'r_inner', key: 'r_inner', value: params.r_inner },
        { name: 'r_outer', key: 'r_outer', value: params.r_outer },
        { name: 'k', key: 'thermal_conductivity', value: params.thermal_conductivity },
        { name: 'T_inner', key: 'temp_inner', value: params.temp_inner },
        { name: 'T_outer', key: 'temp_outer', value: params.temp_outer },
        { name: 'N', key: 'N', value: 50 }
    ];

    return makeNotebook('圆筒壁径向导热', [
        md(`# 一维稳态导热 · 圆筒壁径向导热 (FDM)`),
        md(`## 1. 仿真问题说明
无限长空心圆筒壁在稳态条件下一维径向热传导问题。内半径为 r_inner，外半径为 r_outer，导热系数为 k，内壁温度为 T_inner，外壁温度为 T_outer。本仿真主要分析在柱坐标系下，空心管壁内部的非线性温度分布曲线，计算单位长度圆筒壁传递的稳态热流量。`),
        md(`## 2. 模型假设
- 空心圆柱体长度无限长，忽略轴向两端传热，简化为一维径向（r方向）导热问题。
- 圆筒壁材料是均匀、各向同性的，导热系数 k 恒定。
- 导热过程处于稳态，无时间变化。
- 无内热源。`),
        md(`## 3. 参数说明表
${makeParameterTable(paramItems)}`),
        md(`## 4. 数学模型 or 计算规则
柱坐标系下一维稳态径向导热控制方程：
$$\\frac{d^2T}{dr^2} + \\frac{1}{r}\\frac{dT}{dr} = 0$$

### 边界条件：
- 内壁第一类边界：$T(r_{inner}) = T_{inner}$
- 外壁第一类边界：$T(r_{outer}) = T_{outer}$

### 理论解析解：
一维柱坐标下导热方程积分后温度呈对数分布：
$$T(r) = T_{inner} + (T_{outer} - T_{inner}) \\cdot \\frac{\\ln(r/r_{inner})}{\\ln(r_{outer}/r_{inner})}$$
单位管长热流量（热流速率）：
$$\\phi_L = 2 \\pi k \\frac{T_{inner} - T_{outer}}{\\ln(r_{outer}/r_{inner})}$$`),
        md(`## 5. 参数层代码
设置管壁几何尺寸、导热系数和内壁外壁的边界温度参数。`),
        makeParamCell('r_inner', 'r_inner', params.r_inner),
        makeParamCell('r_outer', 'r_outer', params.r_outer),
        makeParamCell('k', 'thermal_conductivity', params.thermal_conductivity),
        makeParamCell('T_inner', 'temp_inner', params.temp_inner),
        makeParamCell('T_outer', 'temp_outer', params.temp_outer),
        makeParamCell('N', 'N', 50),
        md(`## 6. 模型层代码
这里导入计算基础库并初始化网格。`),
        code(`${SETUP_IMPORTS_CODE}

dr = (r_outer - r_inner) / (N - 1)
r = np.linspace(r_inner, r_outer, N)`),
        md(`## 7. 求解层代码
在柱坐标离散网格上组装三对角有限差分格式并求解，同时计算对数规律的解析解。`),
        code(`A = np.zeros((N, N))
b = np.zeros(N)

# 边界条件
A[0, 0] = 1.0;    b[0] = T_inner
A[-1, -1] = 1.0;  b[-1] = T_outer

# 内部节点: d²T/dr² + (1/r)dT/dr = 0
for i in range(1, N - 1):
    ri = r[i]
    A[i, i - 1] = 1.0 / dr**2 - 1.0 / (2.0 * ri * dr)
    A[i, i]     = -2.0 / dr**2
    A[i, i + 1] = 1.0 / dr**2 + 1.0 / (2.0 * ri * dr)

T_numerical = np.linalg.solve(A, b)

# 解析解
T_analytical = T_inner + (T_outer - T_inner) * np.log(r / r_inner) / np.log(r_outer / r_inner)`),
        md(`## 8. 结果可视化代码
绘制数值解与解析解径向温度分布对比图。`),
        code(`plt.figure(figsize=(10, 6))
plt.plot(r * 1000, T_numerical, 'bo-', markersize=4, label='FDM 数值解')
plt.plot(r * 1000, T_analytical, 'r--', linewidth=2, label='解析解 (对数分布)')
plt.xlabel('半径 r (mm)')
plt.ylabel('温度 T (°C)')
plt.title('圆筒壁径向稳态导热 — FDM 求解')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`),
        md(`## 9. 关键结果输出
输出径向导热数值误差和管壁单位长度散热量。`),
        code(`max_error = np.max(np.abs(T_numerical - T_analytical))
q_line = 2 * np.pi * k * (T_inner - T_outer) / np.log(r_outer / r_inner)
print(f"最大误差: {max_error:.4e} °C")
print(f"单位长度热流: {q_line:.2f} W/m")`),
        md(`## 10. 可修改参数提示
- 调节径比 \`r_outer / r_inner\`：在壁厚增加或者内径减小时，虽然表面积发生改变，但由于对数形式的热阻增加，总传热量会呈非线性减小。
- 改变内、外壁温度：调节内外壁温差将正比改变通过管道截面的单位长度总热流量。`),
        md(`## 11. 结果分析提示
- 与平板导热的线性温度分布不同，圆筒壁径向导热的温度分布曲线呈**非线性对数形态**。这是由于随着半径 $r$ 的增大，导热截面积 $A = 2\\pi r L$ 逐渐变大，因此温度梯度 $dT/dr$ 必然逐渐减小，导致曲线斜率放缓。
- FDM 求解误差保持在极低水平，说明在极坐标下合理差分离散后的三对角有限差分算法同样极其精准。`)
    ]);
}

// ============================================================
//  场景 4: 等截面直肋导热 (FVM)
// ============================================================
function gen_steady_straight_fin(params: Record<string, number>) {
    const paramItems = [
        { name: 'fin_L', key: 'fin_length', value: params.fin_length },
        { name: 'fin_t', key: 'fin_thickness', value: params.fin_thickness },
        { name: 'fin_w', key: 'fin_width', value: params.fin_width },
        { name: 'k', key: 'thermal_conductivity', value: params.thermal_conductivity },
        { name: 'h', key: 'h_conv', value: params.h_conv },
        { name: 'T_base', key: 'temp_base', value: params.temp_base },
        { name: 'T_inf', key: 'temp_ambient', value: params.temp_ambient },
        { name: 'N', key: 'N', value: 50 }
    ];

    return makeNotebook('等截面直肋导热', [
        md(`# 一维稳态导热 · 等截面直肋 (FVM + 对流源项)`),
        md(`## 1. 仿真问题说明
通过附着于壁面上的等截面矩形直肋的传热模拟。直肋长度为 fin_L，厚度为 fin_t，宽度为 fin_w，材料导热系数为 k，根部维持在恒定温度 T_base，肋片置于对流换热系数为 h、温度为 T_inf 的环境中。本仿真主要分析肋片沿长度方向的非线性温度分布、计算肋片散热量及评估肋片传热效率。`),
        md(`## 2. 模型假设
- 肋片厚度远小于其长度和宽度，可忽略肋片内部横截面上的温度梯度，简化为一维导热问题。
- 材料是均匀的，导热系数 k 和表面对流换热系数 h 在肋表面各处保持恒定。
- 肋片顶端（x = L）视为绝热边界（忽略顶端对流）。
- 导热处于稳态，无内热源。`),
        md(`## 3. 参数说明表
${makeParameterTable(paramItems)}`),
        md(`## 4. 数学模型与计算规则
一维肋片导热的能量平衡微分方程（引入对流散热作为负源项）：
$$k A_c \\frac{d^2T}{dx^2} - h P (T - T_{\\infty}) = 0$$

### 边界条件：
- 根部（x=0）：$T(0) = T_{base}$
- 顶端（x=L）：绝热边界 $\\frac{dT}{dx} = 0$

### 理论解析解：
过余温度 $\\theta(x) = T(x) - T_\\infty$ 的分布为：
$$T(x) = T_\\infty + (T_{base} - T_\\infty) \\frac{\\cosh[m(L-x)]}{\\cosh(mL)}$$
其中肋性参数 $m = \\sqrt{\\frac{hP}{kA_c}}$。
肋片效率解析解：
$$\\eta = \\frac{\\tanh(mL)}{mL}$$

### 数值求解方法：
采用有限体积法 (FVM) 离散空间，并在每个控制体内部引入对流换热项并线性化作为方程负源项，求解三对角方程组。`),
        md(`## 5. 参数层代码
设定直肋的长度、厚度、宽度、导热系数、对流换热系数及根部、环境温度参数。`),
        makeParamCell('fin_L', 'fin_length', params.fin_length),
        makeParamCell('fin_t', 'fin_thickness', params.fin_thickness),
        makeParamCell('fin_w', 'fin_width', params.fin_width),
        makeParamCell('k', 'thermal_conductivity', params.thermal_conductivity),
        makeParamCell('h', 'h_conv', params.h_conv),
        makeParamCell('T_base', 'temp_base', params.temp_base),
        makeParamCell('T_inf', 'temp_ambient', params.temp_ambient),
        makeParamCell('N', 'N', 50),
        md(`## 6. 模型层代码
这里导入计算基础库，并初始化肋片网格、肋面周长、截面积等辅助几何属性。`),
        code(`${SETUP_IMPORTS_CODE}

Ac = fin_t * fin_w           # 截面积
P = 2 * (fin_t + fin_w)     # 周长
dx = fin_L / N
x_nodes = np.array([(i + 0.5) * dx for i in range(N)])`),
        md(`## 7. 求解层代码
使用有限体积法组装包含线性化对流源项的稀疏代数矩阵 $A$ 并求解，同时计算过余温度的理论双曲余弦解析解。`),
        code(`A = np.zeros((N, N))
b = np.zeros(N)

for i in range(N):
    S_P = -h * P * dx / (k * Ac)
    S_u = h * P * dx * T_inf / (k * Ac)

    if i == 0:
        a_E = 1.0 / dx
        a_W_b = 1.0 / (dx / 2)
        A[i, i] = a_E + a_W_b - S_P
        A[i, i + 1] = -a_E
        b[i] = a_W_b * T_base + S_u
    elif i == N - 1:
        a_W = 1.0 / dx
        A[i, i] = a_W - S_P   # 绝热顶端: a_E = 0
        A[i, i - 1] = -a_W
        b[i] = S_u
    else:
        a_W = 1.0 / dx
        a_E = 1.0 / dx
        A[i, i] = a_W + a_E - S_P
        A[i, i - 1] = -a_W
        A[i, i + 1] = -a_E
        b[i] = S_u

T = np.linalg.solve(A, b)

# 计算解析解
m = np.sqrt(h * P / (k * Ac))
theta_b = T_base - T_inf
T_analytical = T_inf + theta_b * np.cosh(m * (fin_L - x_nodes)) / np.cosh(m * fin_L)`),
        md(`## 8. 结果可视化代码
绘制肋片沿轴线方向的数值解与解析解温度梯度对比图，并用虚线表示环境温标。`),
        code(`plt.figure(figsize=(10, 6))
plt.plot(x_nodes * 1000, T, 'bo-', markersize=4, label='FVM 数值解')
plt.plot(x_nodes * 1000, T_analytical, 'r--', linewidth=2, label='解析解')
plt.axhline(y=T_inf, color='gray', linestyle=':', label=f'环境温度 T∞={T_inf}°C')
plt.xlabel('沿肋片方向 x (mm)')
plt.ylabel('温度 T (°C)')
plt.title('等截面直肋温度分布曲线')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`),
        md(`## 9. 关键结果输出
计算并输出肋片散热效率、根部传导热流散热量指标。`),
        code(`eta_analytical = np.tanh(m * fin_L) / (m * fin_L)
Q_actual = k * Ac * (T_base - T[0]) / (dx / 2)
Q_max = h * P * fin_L * theta_b
eta_numerical = Q_actual / Q_max if Q_max > 0 else 0

print(f"肋片效率 η (数值): {eta_numerical:.4f}")
print(f"肋片效率 η (解析): {eta_analytical:.4f}")
print(f"肋片散热量 Q = {Q_actual:.4f} W")`),
        md(`## 10. 可修改参数提示
- 增加对流换热系数 \`h\`：肋表面散热速率加快，沿轴向温度下降更为剧烈，肋片散热效率 \`η\` 会随之降低。
- 换用高导热材料 \`k\`：肋内热阻变小，热量更容易被传导至肋片顶端，肋片沿程温差减小，散热效率 \`η\` 显著提高。
- 改变几何长宽比：较薄、较长的肋片会提高与环境的总换热面积，但肋末端由于温差小导致换热利用率降低。`),
        md(`## 11. 结果分析提示
- 等截面直肋由于在传热沿程不断向两侧流体散热，因而其轴向温度分布呈现**抛物线/双曲余弦曲线**（越靠近顶端曲线越平缓，温降越慢）。
- 肋片效率 \`η\` 表征了“肋片实际散热量”与“若整块肋片都处于根部温度下的理想散热量”之比。导热系数较高或对流相对较弱的工况，效率更高。`)
    ]);
}

// ============================================================
//  场景 5: 两侧恒温加热 (显式 FTCS)
// ============================================================
function gen_transient_plate_const_temp(params: Record<string, number>) {
    const paramItems = [
        { name: 'L', key: 'thickness', value: params.thickness },
        { name: 'alpha', key: 'alpha', value: params.alpha },
        { name: 'T_init', key: 'temp_init', value: params.temp_init },
        { name: 'T_s', key: 'temp_surface', value: params.temp_surface },
        { name: 'time_total', key: 'time', value: params.time },
        { name: 'N', key: 'N', value: 50 },
        { name: 'n_snapshots', key: 'n_snapshots', value: 5 }
    ];

    return makeNotebook('两侧恒温加热', [
        md(`# 一维瞬态导热 · 两侧恒温加热 (显式有限差分 FTCS)`),
        md(`## 1. 仿真问题说明
一维平板在突然遭受外部加热或冷却后的瞬态温度演化规律。平板厚度为 L，初始温度为均匀的 T_init。在时间步 t = 0 起，左右两侧壁面突然且维持在恒定温度 T_s。仿真旨在模拟板内温度随时间的演化过程，并分析显式有限差分法（FTCS格式）在计算时间步长上的数值稳定性要求。`),
        md(`## 2. 模型假设
- 平板沿宽度与高度无限延伸，简化为一维瞬态热传导问题。
- 平板材料是各向同性且均匀的，热扩散率 alpha（热扩散系数）为常数。
- 考虑无内热源的瞬态热传导过程。`),
        md(`## 3. 参数说明表
${makeParameterTable(paramItems)}`),
        md(`## 4. 数学模型与计算规则
一维瞬态导热控制微分方程（一维热传导方程）：
$$\\frac{\\partial T}{\\partial t} = \\alpha \\frac{\\partial^2 T}{\\partial x^2}$$

### 初始条件和边界条件：
- 初始条件：$T(x, 0) = T_{init} \\quad (0 < x < L)$
- 双侧第一类边界：$T(0, t) = T_s, \\quad T(L, t) = T_s$

### 显式有限差分 FTCS 时间推进方程：
利用前向时间差分和中心空间差分：
$$T_i^{n+1} = T_i^n + Fo \\cdot (T_{i-1}^n - 2T_i^n + T_{i+1}^n)$$
其中 Fourier 数 $Fo = \\alpha \\Delta t / \\Delta x^2$。

### 数值稳定性判据：
显式格式的稳定性受到严重的约束，要求网格 Fourier 数必须满足：
$$Fo \\le 0.5 \\quad \\implies \\quad \\Delta t \\le \\frac{\\Delta x^2}{2 \\alpha}$$
如果时间步长大于此阈值，计算数值会立即出现无界发散和震荡。`),
        md(`## 5. 参数层代码
设置平板厚度、材料扩散系数、初始温度、外部加热温标以及仿真物理总时长。`),
        makeParamCell('L', 'thickness', params.thickness),
        makeParamCell('alpha', 'alpha', params.alpha),
        makeParamCell('T_init', 'temp_init', params.temp_init),
        makeParamCell('T_s', 'temp_surface', params.temp_surface),
        makeParamCell('time_total', 'time', params.time),
        makeParamCell('N', 'N', 50),
        makeParamCell('n_snapshots', 'n_snapshots', 5),
        md(`## 6. 模型层代码
这里导入计算基础库，并初始化瞬态计算网格和稳定性条件校核。`),
        code(`${SETUP_IMPORTS_CODE}

dx = L / (N - 1)
x = np.linspace(0, L, N)

# 稳定性控制与步长自适应计算
Fo_target = 0.4
dt = Fo_target * dx**2 / alpha
n_steps = int(np.ceil(time_total / dt))
dt = time_total / n_steps
Fo = alpha * dt / dx**2`),
        md(`## 7. 求解层代码
执行显式格式的时间步循环演化推进，记录指定时刻的温度场分布快照。`),
        code(`# 初始化温度场
T = np.full(N, T_init, dtype=float)
T[0] = T_s
T[-1] = T_s

snap_indices = [int(round(i * n_steps / n_snapshots)) for i in range(1, n_snapshots + 1)]
snapshots = []

# FTCS 显式时间步迭代
for step in range(1, n_steps + 1):
    T_new = T.copy()
    for i in range(1, N - 1):
        T_new[i] = T[i] + Fo * (T[i-1] - 2*T[i] + T[i+1])
    T = T_new
    if step in snap_indices:
        snapshots.append((round(step * dt, 4), T.copy()))`),
        md(`## 8. 结果可视化代码
绘制一维瞬态导热各个物理时刻的板内温度分布趋势对比曲线。`),
        code(`plt.figure(figsize=(10, 6))
# 绘制初始时刻
plt.plot(x * 1000, np.full(N, T_init), 'k--', label='t = 0 s (初始温度)')
for t_snap, T_snap in snapshots:
    plt.plot(x * 1000, T_snap, '-o', markersize=2, label=f't = {t_snap:.1f} s')
plt.xlabel('位置 x (mm)')
plt.ylabel('温度 T (°C)')
plt.title('平板两侧恒温加热 — 瞬态温度演化')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`),
        md(`## 9. 关键结果输出
输出当前 Fourier 数、物理时间步信息以及最终平板内部的中心节点温度。`),
        code(`print(f"空间节点数 N = {N}, 网格 Fourier 数 Fo = {Fo:.4f} (< 0.5 ✓)")
print(f"物理时间步长 Δt = {dt:.6f} s, 计算推进总步数 = {n_steps}")
print(f"最终时刻平板中心温度 T_center = {T[N//2]:.2f} °C")
print(f"全局傅里叶数 Fo_global = α·t/L² = {alpha * time_total / L**2:.4f}")`),
        md(`## 10. 可修改参数提示
- 调节热扩散率 \`alpha\`：扩散率越大，热响应速度越快，相同时间下平板中心温度变化越迅速，但也越容易触发显式发散约束。
- 改变仿真总时间 \`time_total\`：增加仿真时间至全局 Fourier 数大于1时，温度场会整体趋于稳态的恒温分布。`),
        md(`## 11. 结果分析提示
- 一维瞬态导热在两侧突加等温的情况下，由于没有内部源项，在经历了瞬态波动的升/降温演化后，其最终稳态趋势必将退化成均匀等温 $T_s$。
- 显式格式 FTCS 极其依赖网格 Fourier 数判据 $Fo \\le 0.5$。尝试将时间推进代码中手动更改 \`Fo_target > 0.5\`，会立即看到算出来的数值呈现剧烈的正负无穷大溢出。`)
    ]);
}

// ============================================================
//  场景 6: 一侧恒定热流 (隐式 FVM)
// ============================================================
function gen_transient_plate_const_flux(params: Record<string, number>) {
    const paramItems = [
        { name: 'L', key: 'thickness', value: params.thickness },
        { name: 'k', key: 'thermal_conductivity', value: params.thermal_conductivity },
        { name: 'rho', key: 'density', value: params.density },
        { name: 'cp', key: 'specific_heat', value: params.specific_heat },
        { name: 'q_s', key: 'heat_flux', value: params.heat_flux },
        { name: 'T_init', key: 'temp_init', value: params.temp_init },
        { name: 'time_total', key: 'time', value: params.time },
        { name: 'N', key: 'N', value: 50 },
        { name: 'n_steps', key: 'n_steps', value: 200 }
    ];

    return makeNotebook('一侧恒定热流', [
        md(`# 一维瞬态导热 · 一侧恒定热流 (全隐式有限体积法)`),
        md(`## 1. 仿真问题说明
研究平板在一侧突然遭受恒定热流加热，而另一侧处于绝热状态下的非稳态温度响应过程。平板初始温度为 T_init，左侧突然加入恒定热流 q_s。为了克服显式差分法时间步长的严苛约束，本算例使用无条件稳定的**全隐式有限体积法 (FVM)** 进行时间推进。`),
        md(`## 2. 模型假设
- 平板沿宽度和高度尺寸无限大，简化为一维瞬态导热。
- 平板材料物性为常数，导热系数 k、密度 rho、比热 cp 在计算中均保持恒定。
- 右侧壁面（x = L）完全绝热。
- 系统无内部热源。`),
        md(`## 3. 参数说明表
${makeParameterTable(paramItems)}`),
        md(`## 4. 数学模型与计算规则
控制偏微分方程：
$$\\rho c_p \\frac{\\partial T}{\\partial t} = k \\frac{\\partial^2 T}{\\partial x^2}$$

### 边界条件：
- 左侧输入恒定热流（第二类边界）：$-k \\frac{\\partial T}{\\partial x} = q_s \\quad (x = 0)$
- 右侧完全绝热（第二类边界）：$\\frac{\\partial T}{\\partial x} = 0 \\quad (x = L)$

### 全隐式格式离散控制方程：
利用后向时间差分离散，每个节点 $i$ 在当前时间步都需要通过组装稀疏方程组 $[A]\\{T\\}^{n+1} = \\{b\\}$ 求解，该格式**在数学上无条件稳定**，时间步长 $\\Delta t$ 的取值可不受 $Fo \\le 0.5$ 限制。`),
        md(`## 5. 参数层代码
配置平板尺寸、导热及热容属性、输入边界热流、初始温度及仿真步数参数。`),
        makeParamCell('L', 'thickness', params.thickness),
        makeParamCell('k', 'thermal_conductivity', params.thermal_conductivity),
        makeParamCell('rho', 'density', params.density),
        makeParamCell('cp', 'specific_heat', params.specific_heat),
        makeParamCell('q_s', 'heat_flux', params.heat_flux),
        makeParamCell('T_init', 'temp_init', params.temp_init),
        makeParamCell('time_total', 'time', params.time),
        makeParamCell('N', 'N', 50),
        makeParamCell('n_steps', 'n_steps', 200),
        md(`## 6. 模型层代码
这里导入计算基础库，并配置全隐式空间网格、自适应网格参数。`),
        code(`${SETUP_IMPORTS_CODE}

alpha = k / (rho * cp)
dx = L / N
dt = time_total / n_steps
Fo = alpha * dt / dx**2
x_nodes = np.array([(i + 0.5) * dx for i in range(N)])`),
        md(`## 7. 求解层代码
组装全隐式时间推进离散矩阵系数并利用线性求解器递推，同时对总输入能量和系统内储能总量进行守恒性检验。`),
        code(`# 组装系数矩阵 (每步不变)
A = np.zeros((N, N))
a_P0 = rho * cp * dx / dt

for i in range(N):
    if i == 0:
        a_E = k / dx
        A[i, i] = a_E + a_P0
        A[i, i+1] = -a_E
    elif i == N - 1:
        a_W = k / dx
        A[i, i] = a_W + a_P0
        A[i, i-1] = -a_W
    else:
        a_W = k / dx; a_E = k / dx
        A[i, i] = a_W + a_E + a_P0
        A[i, i-1] = -a_W
        A[i, i+1] = -a_E

# 时间演化递推
T = np.full(N, T_init, dtype=float)
snapshots = []
snap_indices = set(int(round(i * n_steps / 5)) for i in range(1, 6))

for step in range(1, n_steps + 1):
    b_vec = a_P0 * T.copy()
    b_vec[0] += q_s  # 左边界热流源项注入
    T = np.linalg.solve(A, b_vec)
    if step in snap_indices:
        snapshots.append((round(step * dt, 2), T.copy()))`),
        md(`## 8. 结果可视化代码
绘制一侧恒定热流注入下，平板各时刻内部的瞬态非线性温度剖面。`),
        code(`plt.figure(figsize=(10, 6))
# 绘制初始温度
plt.plot(x_nodes * 1000, np.full(N, T_init), 'k--', label='t = 0 s (初始温度)')
for t_snap, T_snap in snapshots:
    plt.plot(x_nodes * 1000, T_snap, '-o', markersize=2, label=f't = {t_snap} s')
plt.xlabel('位置 x (mm)')
plt.ylabel('温度 T (°C)')
plt.title('一侧恒定热流加热 — 瞬态温度演化 (隐式FVM)')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`),
        md(`## 9. 关键结果输出
输出热端与冷端的最终数值、能量守恒检验相对误差。`),
        code(`Q_in = q_s * time_total
Q_stored = rho * cp * L * (np.mean(T) - T_init)
conservation_error = abs(Q_in - Q_stored)/Q_in*100 if Q_in > 0 else 0

print(f"网格傅里叶数 Fo = {Fo:.4f}")
print(f"热面壁温 T_left = {T[0]:.2f} °C, 绝热面壁温 T_right = {T[-1]:.2f} °C")
print(f"总输入能量 = {Q_in:.2f} J/m^2, 板内储能增量 = {Q_stored:.2f} J/m^2")
print(f"能量守恒相对误差: {conservation_error:.4f}%")`),
        md(`## 10. 可修改参数提示
- 调节热流密度 \`q_s\`：热流密度越大，左侧温度上升斜率越陡峭，温升速度越快。
- 改变热容密度项 \`rho\` 和 \`cp\`：当板的比热或密度增加，热容增大，系统的温升速率会按反比放缓。
- 尝试设置极大的时间步长（使得网格 Fourier 数远大于0.5），由于隐式格式**无条件稳定**，温度场不会发散，仍能给出光滑合理的物理解。`),
        md(`## 11. 结果分析提示
- 在一侧输入恒热流、另一侧绝热的瞬态过程中，由于热量不断累积，系统温度没有稳态极限，会一直持续上升。
- 系统能量守恒的严格校验是数值计算正确性的重要标志。本例中通过 FVM 离散后由于边界能量积分是严格保守的，计算误差基本保持在0%完美吻合。`)
    ]);
}

// ============================================================
//  场景 7: 平板层流强制对流
// ============================================================
function gen_convection_laminar_plate(params: Record<string, number>) {
    const paramItems = [
        { name: 'L', key: 'plate_length', value: params.plate_length },
        { name: 'U_inf', key: 'velocity', value: params.velocity },
        { name: 'T_w', key: 'temp_wall', value: params.temp_wall },
        { name: 'T_inf', key: 'temp_fluid', value: params.temp_fluid },
        { name: 'k_f', key: 'fluid_k', value: params.fluid_k },
        { name: 'nu', key: 'fluid_nu', value: params.fluid_nu },
        { name: 'Pr', key: 'fluid_Pr', value: params.fluid_Pr }
    ];

    return makeNotebook('平板层流强制对流', [
        md(`# 对流换热 · 平板层流强制对流`),
        md(`## 1. 仿真问题说明
均匀来流（流速 U_inf，温度 T_inf）扫过温度恒为 T_w 的平板的强制对流换热问题。旨在依据边界层理论计算边界上的局部雷诺数、局部 Nusselt 数及传热系数，并进一步估计流体动力学边界层和热边界层在沿程方向的非线性厚度演化规律。`),
        md(`## 2. 模型假设
- 平板两端面足够宽，流动可视为平面二维流动。
- 壁温 T_w 空间分布恒定均匀。
- 雷诺数 Re_L 小于转捩临界雷诺数 5e5，流态在整个板长范围内均为层流。`),
        md(`## 3. 参数说明表
${makeParameterTable(paramItems)}`),
        md(`## 4. 数学模型与计算规则
### 局部与平均传热关联式：
由 Blasius 及 Pohlhausen 平板边界层相似解可得，当流体普朗特数 $Pr > 0.6$ 时，层流下 Nusselt 数关联式为：
- 局部 Nusselt 数：$$Nu_x = \\frac{h_x x}{k_f} = 0.332 Re_x^{1/2} Pr^{1/3}$$
- 平均 Nusselt 数：$$\\bar{Nu}_L = \\frac{\\bar{h} L}{k_f} = 0.664 Re_L^{1/2} Pr^{1/3}$$

从而平均传热系数是板末端局部传热系数的2倍：
$$\\bar{h} = 2 \\cdot h_x|_{x=L}$$

### 边界层厚度理论式：
- 速度边界层厚度：$$\\delta_x \\approx \\frac{5.0 x}{\\sqrt{Re_x}}$$
- 热边界层厚度：$$\\delta_{t,x} \\approx \\frac{\\delta_x}{Pr^{1/3}}$$`),
        md(`## 5. 参数层代码
设置平板物理长度、来流风速、壁温/流温、流体物性（运动粘度、导热系数、普朗特数）。`),
        makeParamCell('L', 'plate_length', params.plate_length),
        makeParamCell('U_inf', 'velocity', params.velocity),
        makeParamCell('T_w', 'temp_wall', params.temp_wall),
        makeParamCell('T_inf', 'temp_fluid', params.temp_fluid),
        makeParamCell('k_f', 'fluid_k', params.fluid_k),
        makeParamCell('nu', 'fluid_nu', params.fluid_nu),
        makeParamCell('Pr', 'fluid_Pr', params.fluid_Pr),
        md(`## 6. 模型层代码
这里导入计算基础库，并初始化沿程网格坐标及局部雷诺数分布计算。`),
        code(`${SETUP_IMPORTS_CODE}

Re_L = U_inf * L / nu
x = np.linspace(L / 200, L, 200)
Re_x = U_inf * x / nu`),
        md(`## 7. 求解层代码
利用相似解公式计算速度和温度边界层的厚度演程曲线，并积分得到平均换热物理量。`),
        code(`Nu_x = 0.332 * Re_x**0.5 * Pr**(1/3)
h_x = Nu_x * k_f / x
delta = 5.0 * x / Re_x**0.5
delta_t = delta / Pr**(1/3)

# 积分计算平均值
Nu_L = 0.664 * Re_L**0.5 * Pr**(1/3)
h_avg = Nu_L * k_f / L
Q_total = h_avg * L * (T_w - T_inf)`),
        md(`## 8. 结果可视化代码
绘制对流边界层厚度沿程展开图，以及局部换热系数 $h_x$ 沿流动方向的衰减曲线。`),
        code(`fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# 局部换热系数分布
ax1.plot(x * 1000, h_x, 'b-', linewidth=2, label='局部 h_x')
ax1.axhline(y=h_avg, color='r', linestyle='--', label=f'平均 h_avg = {h_avg:.3f}')
ax1.set_xlabel('位置 x (mm)')
ax1.set_ylabel('对流换热系数 h_x (W/(m²·K))')
ax1.set_title('局部与平均传热系数沿程分布')
ax1.legend()
ax1.grid(True, alpha=0.3)

# 边界层厚度沿程发展
ax2.plot(x * 1000, delta * 1000, 'b-', label='速度边界层 δ')
ax2.plot(x * 1000, delta_t * 1000, 'r--', label='热边界层 δ_t')
ax2.set_xlabel('位置 x (mm)')
ax2.set_ylabel('边界层厚度 (mm)')
ax2.set_title('速度边界层与热边界层厚度发展趋势')
ax2.legend()
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()`),
        md(`## 9. 关键结果输出
输出末端总雷诺数及换热系数计算校核结果。`),
        code(`print(f"平板末端雷诺数 Re_L = {Re_L:.0f} (层流限值 < 5e5)")
print(f"平均 Nu_L = {Nu_L:.2f}")
print(f"平均传热系数 h_avg = {h_avg:.4f} W/(m²·K)")
print(f"验证: h_avg / h_x_L = {h_avg / h_x[-1]:.4f} (理论比值=2.0)")
print(f"单位宽度平板总对流换热功率 Q = {Q_total:.2f} W/m")`),
        md(`## 10. 可修改参数提示
- 调节流速 \`U_inf\`：流速增大，雷诺数升高，边界层厚度 \`δ\` 变薄，局部传热系数 \`h_x\` 增加，换热得到强化。
- 调节普朗特数 \`Pr\`：当普朗特数大于1时，热边界层厚度 \`δ_t\` 明显薄于速度边界层厚度 \`δ\`。`),
        md(`## 11. 结果分析提示
- 平板前缘附近的局部传热系数 $h_x$ 趋于无穷大，随后随着流动延伸，边界层逐渐增厚，热阻加大，换热系数逐渐衰减。
- 从传热量估算看，由于前缘的“前锋优势”，积分算出的平均传热系数刚好处处等于板端点局部传热系数的两倍。`)
    ]);
}

// ============================================================
//  场景 8: 平板湍流强制对流
// ============================================================
function gen_convection_turbulent_plate(params: Record<string, number>) {
    const paramItems = [
        { name: 'L', key: 'plate_length', value: params.plate_length },
        { name: 'U_inf', key: 'velocity', value: params.velocity },
        { name: 'T_w', key: 'temp_wall', value: params.temp_wall },
        { name: 'T_inf', key: 'temp_fluid', value: params.temp_fluid },
        { name: 'k_f', key: 'fluid_k', value: params.fluid_k },
        { name: 'nu', key: 'fluid_nu', value: params.fluid_nu },
        { name: 'Pr', key: 'fluid_Pr', value: params.fluid_Pr },
        { name: 'Re_cr', key: 'Re_cr', value: 5e5 }
    ];

    return makeNotebook('平板湍流强制对流', [
        md(`# 对流换热 · 平板湍流强制对流 (混合边界层)`),
        md(`## 1. 仿真问题说明
当雷诺数超过临界值时的长平板强制对流换热模拟。由于流速高或平板较长，流动在其前半段维持层流，在临界位置 x_cr 处过渡为湍流。本仿真构建了一个混合边界层模型，用于分析从层流向湍流边界层过渡时局部传热系数的跃升突变，以及估算总体的平均换热量。`),
        md(`## 2. 模型假设
- 忽略展向边际效应，简化为平面二维流动。
- 设定转捩突变的临界雷诺数恒定为 Re_cr = 5e5。
- 忽略过渡区的平滑变化，将层流区与湍流区进行阶跃切换。`),
        md(`## 3. 参数说明表
${makeParameterTable(paramItems)}`),
        md(`## 4. 数学模型与计算规则
### 混合边界层 Nusselt 数关联式：
- 局部 Nusselt 数：
  - 当 $Re_x < Re_{cr}$（层流）：$$Nu_x = 0.332 Re_x^{1/2} Pr^{1/3}$$
  - 当 $Re_x \\ge Re_{cr}$（湍流）：$$Nu_x = 0.0296 Re_x^{4/5} Pr^{1/3}$$
- 混合平均 Nusselt 数（对整个板长积分）：
  $$\\bar{Nu}_L = (0.037 Re_L^{4/5} - 871) Pr^{1/3}$$
  其中常数 \`-871\` 代表扣除前端层流段的流动换热贡献。`),
        md(`## 5. 参数层代码
设置长平板几何长度、高速来流、温差物性及临界过渡雷诺数。`),
        makeParamCell('L', 'plate_length', params.plate_length),
        makeParamCell('U_inf', 'velocity', params.velocity),
        makeParamCell('T_w', 'temp_wall', params.temp_wall),
        makeParamCell('T_inf', 'temp_fluid', params.temp_fluid),
        makeParamCell('k_f', 'fluid_k', params.fluid_k),
        makeParamCell('nu', 'fluid_nu', params.fluid_nu),
        makeParamCell('Pr', 'fluid_Pr', params.fluid_Pr),
        makeParamCell('Re_cr', 'Re_cr', 5e5),
        md(`## 6. 模型层代码
这里导入计算基础库，计算转捩位置并划分离散沿程网格。`),
        code(`${SETUP_IMPORTS_CODE}

Re_L = U_inf * L / nu
x_cr = Re_cr * nu / U_inf
x = np.linspace(L / 300, L, 300)
Re_x = U_inf * x / nu`),
        md(`## 7. 求解层代码
根据局部雷诺数执行条件分支判别，求解沿程局部对流换热系数及混合平均换热量。`),
        code(`h_x = np.zeros_like(x)

for i in range(len(x)):
    if Re_x[i] < Re_cr:
        Nu = 0.332 * Re_x[i]**0.5 * Pr**(1/3)
    else:
        Nu = 0.0296 * Re_x[i]**0.8 * Pr**(1/3)
    h_x[i] = Nu * k_f / x[i]

# 混合积分平均
Nu_mixed = (0.037 * Re_L**0.8 - 871) * Pr**(1/3)
h_mixed = Nu_mixed * k_f / L

# 纯湍流对比项
Nu_turb = 0.037 * Re_L**0.8 * Pr**(1/3)
h_turb = Nu_turb * k_f / L
Q_total = h_mixed * L * (T_w - T_inf)`),
        md(`## 8. 结果可视化代码
绘制局部对流换热系数沿程分布曲线，用虚线显式标明层流向湍流转捩的突变跃升点。`),
        code(`plt.figure(figsize=(10, 6))
plt.plot(x * 1000, h_x, 'b-', linewidth=2, label='局部 h_x')
plt.axvline(x=x_cr * 1000, color='red', linestyle=':', label=f'转捩点 x_cr={x_cr*1000:.0f}mm')
plt.axhline(y=h_mixed, color='green', linestyle='--', label=f'混合平均 h_avg={h_mixed:.3f}')
plt.xlabel('位置 x (mm)')
plt.ylabel('对流换热系数 h_x (W/(m²·K))')
plt.title('平板强制对流 — 混合边界层层流向湍流转捩')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`),
        md(`## 9. 关键结果输出
输出转捩位置所占百分比以及传热系数对比指标。`),
        code(`print(f"平板总雷诺数 Re_L = {Re_L:.2e} (转捩 Re_cr = {Re_cr:.2e})")
print(f"转捩位置距离前缘: {x_cr:.4f} m ({x_cr/L*100:.1f}% 处)")
print(f"混合平均 Nusselt 数 = {Nu_mixed:.2f}, 平均 h = {h_mixed:.4f} W/(m²·K)")
print(f"与假定全板湍流对比的散热比率 = {h_mixed / h_turb:.4f}")
print(f"单位宽度总传热速率 Q = {Q_total:.2f} W/m")`),
        md(`## 10. 可修改参数提示
- 调节风速 \`U_inf\`：流速增大会使转捩位置 \`x_cr\` 往前移，导致高传热率的湍流段占比大幅增加，总平均换热系数明显跃升。
- 改变平板长度 \`L\`：平板越长，末端越容易发生转捩，层流边界层的占比相对下降。`),
        md(`## 11. 结果分析提示
- 从曲线图中可以看出，局部传热系数在前缘由于层流增厚而持续下降，但一旦雷诺数大于5e5，流体开始剧烈无序扰动混掺，局部传热系数发生突越式增加，然后由于湍流边界层的增厚再次平缓下降。
- 前半段层流层依然存在，如果粗暴地直接采用全湍流公式计算，会明显高估整块平板的实际总散热量。`)
    ]);
}

// ============================================================
//  场景 9: 竖板自然对流
// ============================================================
function gen_convection_natural_vertical(params: Record<string, number>) {
    const paramItems = [
        { name: 'H', key: 'plate_height', value: params.plate_height },
        { name: 'T_w', key: 'temp_wall', value: params.temp_wall },
        { name: 'T_inf', key: 'temp_ambient', value: params.temp_ambient },
        { name: 'k_f', key: 'fluid_k', value: params.fluid_k },
        { name: 'nu', key: 'fluid_nu', value: params.fluid_nu },
        { name: 'Pr', key: 'fluid_Pr', value: params.fluid_Pr },
        { name: 'g', key: 'g', value: 9.81 }
    ];

    return makeNotebook('竖板自然对流', [
        md(`# 对流换热 · 竖板自然对流 (Churchill-Chu 关联式)`),
        md(`## 1. 仿真问题说明
在无风静止大气中，由于温度差引起的热空气上升密度浮力驱动的一维竖板自然对流换热模拟。板高度为 H，表面恒定壁温为 T_w，环境静止流体温度为 T_inf。本仿真用于求解系统雷诺浮力判据、局部换热系数并得到在垂直重力方向上换热效率的变化规律。`),
        md(`## 2. 模型假设
- 竖板宽度足够宽，流动为平面二维流动。
- 流体符合理想气体假说，采用 Boussinesq 密度浮力模型。
- 不考虑外部强迫流动，纯为浮力自驱动。`),
        md(`## 3. 参数说明表
${makeParameterTable(paramItems)}`),
        md(`## 4. 数学模型与计算规则
### 核心物理判据：
- 定性温度：$$T_{film} = \\frac{T_w + T_{\\infty}}{2}$$
- 气体膨胀系数：$$\\beta = \\frac{1}{T_{film} + 273.15}$$
- Grashof 数 (Gr)：$$Gr_H = \\frac{g \\beta (T_w - T_{\\infty}) H^3}{\\nu^2}$$
- Rayleigh 数 (Ra)：$$Ra_H = Gr_H \\cdot Pr$$

### Churchill-Chu 全域自然对流 Nusselt 关联式：
适用于整个层流与湍流区域的平均 Nusselt 数表达公式：
$$\\bar{Nu}_H = \\left\\{ 0.825 + \\frac{0.387 Ra_H^{1/6}}{[1+(0.492/Pr)^{9/16}]^{8/27}} \\right\\}^2$$

流动状态过渡临界条件通常为 $Ra_{cr} = 10^9$。`),
        md(`## 5. 参数层代码
输入板高、表面温度、环境温标、重力加速度常数及空气的定性热物理物性。`),
        makeParamCell('H', 'plate_height', params.plate_height),
        makeParamCell('T_w', 'temp_wall', params.temp_wall),
        makeParamCell('T_inf', 'temp_ambient', params.temp_ambient),
        makeParamCell('k_f', 'fluid_k', params.fluid_k),
        makeParamCell('nu', 'fluid_nu', params.fluid_nu),
        makeParamCell('Pr', 'fluid_Pr', params.fluid_Pr),
        makeParamCell('g', 'g', 9.81),
        md(`## 6. 模型层代码
这里导入计算基础库，根据定性温度算得气体体积热膨胀系数，并在空间划分沿板高度的坐标。`),
        code(`${SETUP_IMPORTS_CODE}

T_film = (T_w + T_inf) / 2
beta = 1.0 / (T_film + 273.15)
dT = abs(T_w - T_inf)
x = np.linspace(H / 100, H, 100)`),
        md(`## 7. 求解层代码
计算全局 Grashof 和 Rayleigh 数，根据关联式求解自然对流换热平均及沿高度的局部 Nusselt 数分布。`),
        code(`Gr_H = g * beta * dT * H**3 / nu**2
Ra_H = Gr_H * Pr

# 求解 Churchill-Chu 全域公式
f_Pr = (1 + (0.492 / Pr)**(9/16))**(8/27)
Nu_H = (0.825 + 0.387 * Ra_H**(1/6) / f_Pr)**2
h_avg = Nu_H * k_f / H

# 沿高度的局部换热参数求解
Ra_x = g * beta * dT * x**3 / nu**2 * Pr
Nu_x = (0.825 + 0.387 * Ra_x**(1/6) / f_Pr)**2
h_x = Nu_x * k_f / x
Q_total = h_avg * H * (T_w - T_inf)`),
        md(`## 8. 结果可视化代码
绘制自然对流局部换热系数沿竖板高度方向的演变曲线，显示其在前锋后衰减的规律。`),
        code(`plt.figure(figsize=(10, 6))
plt.plot(x * 1000, h_x, 'b-', linewidth=2, label='局部 h_x')
plt.axhline(y=h_avg, color='r', linestyle='--', label=f'平均 h_avg = {h_avg:.3f}')
plt.xlabel('板高位置 x (mm)')
plt.ylabel('对流换热系数 h_x (W/(m²·K))')
flow_regime = "层流" if Ra_H < 1e9 else "湍流"
plt.title(f'竖板自然对流换热系数分布 — {flow_regime} (Ra_H = {Ra_H:.2e})')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`),
        md(`## 9. 关键结果输出
输出 Rayleigh 浮力能量数及平均换热系数计算结果。`),
        code(`print(f"体积膨胀系数 beta = {beta:.6e} K^-1, 壁面温差 dT = {dT:.2f} °C")
print(f"Grashof 数 Gr_H = {Gr_H:.2e}, Rayleigh 数 Ra_H = {Ra_H:.2e}")
print(f"流动形态: {flow_regime} (过渡 Ra 阈值 = 10^9)")
print(f"平均 Nu_H = {Nu_H:.2f}, 平均 h = {h_avg:.4f} W/(m²·K)")
print(f"单位宽度竖板总散热换热功率 Q = {Q_total:.2f} W/m")`),
        md(`## 10. 可修改参数提示
- 调节温差 \`T_w - T_inf\`：温差增大会使流体局部浮力变大，流速增大，雷诺效应增强，自然对流换热系数 \`h\` 上升。
- 改变板高 \`H\`：板高增加将使流动逐渐从层流自发演化为湍流。`),
        md(`## 11. 结果分析提示
- 自然对流中，在靠近底部入口边缘处，热边界层极薄，因此换热极其猛烈；沿重力方向上升时，边界层增厚，局部换热系数 $h_x$ 逐渐衰减。
- 本问题完全不需要风扇等外力驱动，其传热机理完全建立在**定性密度随温度差发生改变**这一流体引力浮力机制上。`)
    ]);
}

// ============================================================
//  场景 10: 圆管内强迫对流
// ============================================================
function gen_convection_internal_tube(params: Record<string, number>) {
    const paramItems = [
        { name: 'L', key: 'tube_length', value: params.tube_length },
        { name: 'D', key: 'tube_diameter', value: params.tube_diameter },
        { name: 'u_m', key: 'velocity', value: params.velocity },
        { name: 'T_mi', key: 'temp_inlet', value: params.temp_inlet },
        { name: 'T_s', key: 'temp_wall', value: params.temp_wall },
        { name: 'k', key: 'fluid_k', value: params.fluid_k },
        { name: 'nu', key: 'fluid_nu', value: params.fluid_nu },
        { name: 'Pr', key: 'fluid_Pr', value: params.fluid_Pr },
        { name: 'rho', key: 'fluid_rho', value: params.fluid_rho },
        { name: 'cp', key: 'fluid_cp', value: params.fluid_cp }
    ];

    return makeNotebook('圆管内强迫对流', [
        md(`# 对流换热 · 圆管内强迫对流 (恒壁温)`),
        md(`## 1. 仿真问题说明
流体流经受热圆管内壁面的对流传热问题。流速为 u_m，入口流温为 T_mi。管壁温度维持恒定在 T_s，管内径为 D，管长为 L。仿真旨在通过雷诺数判据识别管内流体所处流态，选择 Dittus-Boelter 或层流公式求解对流传热系数，并模拟流体平均温度沿管长方向的指数上升分布，估算总换热功率及对数平均温差。`),
        md(`## 2. 模型假设
- 圆管截面是完全圆形且恒定的，忽略管口入射流动段效应，视为充分发展流。
- 定性温差下忽略流体物性（密度、比热、粘度）的变化。
- 圆筒管壁温度分布恒定均匀。
- 忽略轴向导热热阻。`),
        md(`## 3. 参数说明表
${makeParameterTable(paramItems)}`),
        md(`## 4. 数学模型与计算规则
### 控制微分方程（能量守恒积分）：
流体温度沿流动方向 $x$ 的递变满足：
$$\\frac{dT_m}{dx} = \\frac{P h}{\\dot{m} c_p} (T_s - T_m)$$

对上式自 $0$ 至 $x$ 积分得到沿程平均温度解析解：
$$T_m(x) = T_s - (T_s - T_{m,i}) \\exp\\left(-\\frac{P h}{\\dot{m} c_p} x\\right)$$

### 关联式及流态选择：
- 管内雷诺数：$$Re_D = \\frac{u_m D}{\\nu}$$
  - 若 $Re_D < 2300$（层流）：$$Nu_D = 3.66$$
  - 若 $Re_D \\ge 2300$（湍流，利用 Dittus-Boelter 公式）：
    $$Nu_D = 0.023 Re_D^{0.8} Pr^n$$
    加热流体（$T_s > T_{mi}$）时 $n = 0.4$，冷却流体时 $n = 0.3$。`),
        md("## 5. 参数层代码\n参数输入管径、管长、流速、入口及壁温物理常数、流体密度、粘度、Prandtl 数。"),
        makeParamCell('L', 'tube_length', params.tube_length),
        makeParamCell('D', 'tube_diameter', params.tube_diameter),
        makeParamCell('u_m', 'velocity', params.velocity),
        makeParamCell('T_mi', 'temp_inlet', params.temp_inlet),
        makeParamCell('T_s', 'temp_wall', params.temp_wall),
        makeParamCell('k', 'fluid_k', params.fluid_k),
        makeParamCell('nu', 'fluid_nu', params.fluid_nu),
        makeParamCell('Pr', 'fluid_Pr', params.fluid_Pr),
        makeParamCell('rho', 'fluid_rho', params.fluid_rho),
        makeParamCell('cp', 'fluid_cp', params.fluid_cp),
        md(`## 6. 模型层代码
这里导入计算基础库，并核算流态雷诺数确定对流 Nusselt 关联式的经验计算分支。`),
        code(`${SETUP_IMPORTS_CODE}

Re_D = u_m * D / nu
is_laminar = Re_D < 2300

if is_laminar:
    Nu_D = 3.66
    print(f"流态: 层流 (Re_D = {Re_D:.0f})")
else:
    n = 0.4 if T_s > T_mi else 0.3
    Nu_D = 0.023 * Re_D**0.8 * Pr**n
    print(f"流态: 湍流 (Re_D = {Re_D:.0f})")

h = Nu_D * k / D`),
        md(`## 7. 求解层代码
求解管内流体沿轴线方向的沿程平均温度分布曲线，计算质量流量及总散热量。`),
        code(`P = np.pi * D
A_c = np.pi * D**2 / 4
m_dot = rho * u_m * A_c

lam = (P * h) / (m_dot * cp)
x = np.linspace(0, L, 100)

# 计算流体平均温度剖面
T_m = T_s - (T_s - T_mi) * np.exp(-lam * x)
T_mo = T_m[-1]

# 对数平均温差 (LMTD)
lmtd = ((T_s - T_mi) - (T_s - T_mo)) / np.log((T_s - T_mi) / (T_s - T_mo)) if T_s != T_mo and T_s != T_mi else 0`),
        md(`## 8. 结果可视化代码
绘制流体在管内沿流动方向升/降温的对数指数演变曲线图，并与管壁恒温对比。`),
        code(`plt.figure(figsize=(10, 6))
plt.plot(x, T_m, 'b-', linewidth=2, label='流体平均温度 T_m(x)')
plt.axhline(y=T_s, color='r', linestyle='--', label=f'管壁温度 T_s={T_s}°C')
plt.xlabel('管长位置 x (m)')
plt.ylabel('温度 T (°C)')
plt.title('圆管内强迫对流沿程温度分布')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`),
        md(`## 9. 关键结果输出
输出对流换热系数、出口温度、对数平均温差及总换热量指标。`),
        code(`q_total = m_dot * cp * (T_mo - T_mi)
print(f"对流换热系数 h = {h:.2f} W/(m²·K) (Nu_D = {Nu_D:.2f})")
print(f"流体出口温度 T_mo = {T_mo:.2f} °C, 入口温度 T_mi = {T_mi:.2f} °C")
print(f"总换热量 q = {q_total:.2f} W")
print(f"对数平均温差 LMTD = {lmtd:.2f} °C")`),
        md(`## 10. 可修改参数提示
- 调节流速 \`u_m\`：流速增大会导致质量流量增加，流体在管内的停留时间变短，因此出口温度 \`T_mo\` 变低，但由于湍流换热系数 \`h\` 随流速成0.8次方增加，管道总的对流换热量 \`q\` 反而会大幅升高。
- 调节管径 \`D\`：减小管径是强化管内流体传热的极好手段，这会极大地增加局部传热系数 \`h\`。`),
        md(`## 11. 结果分析提示
- 流体平均温度随着流动并不是呈线性递增的，而是呈**指数衰减式逼近**管壁温度。
- 对数平均温差 (LMTD) 考虑了换热两侧温差沿程非线性变化的客观物理状态，用来评估管式换热效能比算术温差更加准确。`)
    ]);
}

// ============================================================
//  场景 11: 平行平板辐射换热
// ============================================================
function gen_radiation_parallel_plates(params: Record<string, number>) {
    const paramItems = [
        { name: 'T1_C', key: 'temp_plate1', value: params.temp_plate1 },
        { name: 'T2_C', key: 'temp_plate2', value: params.temp_plate2 },
        { name: 'eps1', key: 'emissivity1', value: params.emissivity1 },
        { name: 'eps2', key: 'emissivity2', value: params.emissivity2 },
        { name: 'n_shield', key: 'n_shield', value: params.n_shield },
        { name: 'eps_s', key: 'emissivity_shield', value: params.emissivity_shield },
        { name: 'sigma', key: 'sigma', value: 5.67e-8 }
    ];

    return makeNotebook('平行平板辐射换热', [
        md(`# 热辐射 · 两无限大平行平板间辐射换热`),
        md(`## 1. 仿真问题说明
两个间距极小且尺寸无限大的平行平面之间的辐射热交换。板1温度为 T1_C，板2温度为 T2_C，它们具有特定的辐射发射率 eps1、eps2。仿真分析了两板之间的等效净热流，并进一步引入遮热板结构（数量为 n_shield，遮热板发射率为 eps_s），定量评估遮热板的降热效率。`),
        md(`## 2. 模型假设
- 两块平板尺寸无限大，忽略边缘逸散辐射损失。
- 表面属于弥散-灰表面，反射与发射服从 Lambert 定律。
- 两平板中间填充真空介质，不考虑对流和导热换热贡献。`),
        md(`## 3. 参数说明表
${makeParameterTable(paramItems)}`),
        md(`## 4. 数学模型与计算规则
### 无遮热板辐射公式：
平行平面的净辐射热流密度为：
$$q_{12} = \\frac{\\sigma (T_1^4 - T_2^4)}{\\frac{1}{\\varepsilon_1} + \\frac{1}{\\varepsilon_2} - 1}$$
其中系统等效发射率为：
$$\\varepsilon_{eff} = \\frac{1}{\\frac{1}{\\varepsilon_1} + \\frac{1}{\\varepsilon_2} - 1}$$
等效辐射换热系数为：
$$h_r = \\sigma \\varepsilon_{eff} (T_1^2 + T_2^2)(T_1 + T_2)$$

### 引入 N 块灰体遮热板后的公式：
$$q = \\frac{\\sigma (T_1^4 - T_2^4)}{\\left(\\frac{1}{\\varepsilon_1} + \\frac{1}{\\varepsilon_2} - 1\\right) + N \\left( \\frac{2}{\\varepsilon_s} - 1 \\right)}$$`),
        md(`## 5. 参数层代码
设置两平板温度、辐射发射率属性以及遮热板的片数和遮射表面参数。`),
        makeParamCell('T1_C', 'temp_plate1', params.temp_plate1),
        makeParamCell('T2_C', 'temp_plate2', params.temp_plate2),
        makeParamCell('eps1', 'emissivity1', params.emissivity1),
        makeParamCell('eps2', 'emissivity2', params.emissivity2),
        makeParamCell('n_shield', 'n_shield', params.n_shield),
        makeParamCell('eps_s', 'emissivity_shield', params.emissivity_shield),
        makeParamCell('sigma', 'sigma', 5.67e-8),
        md(`## 6. 模型层代码
这里导入计算基础库，并将摄氏温标换算为热力学绝对温标。`),
        code(`${SETUP_IMPORTS_CODE}

T1 = T1_C + 273.15
T2 = T2_C + 273.15`),
        md(`## 7. 求解层代码
计算等效发射率、无遮热板和包含遮热板时的净辐射传热量以及黑体理论限值。`),
        code(`eps_eff = 1 / (1/eps1 + 1/eps2 - 1)
q_no_shield = sigma * eps_eff * (T1**4 - T2**4)
q_blackbody = sigma * (T1**4 - T2**4)
h_r = sigma * eps_eff * (T1**2 + T2**2) * (T1 + T2)

q_final = q_no_shield
reduction = 0.0

if n_shield > 0:
    denom = (1/eps1 + 1/eps2 - 1) + n_shield * (2/eps_s - 1)
    q_final = sigma * (T1**4 - T2**4) / denom
    reduction = (1 - q_final / q_no_shield) * 100`),
        md(`## 8. 结果可视化代码
针对发射率变化进行敏感性扫描测试，并绘制发射率与两板净辐射热流的敏感性分析对比图线。`),
        code(`eps_range = np.linspace(0.05, 1.0, 50)
q_vs_eps = np.array([sigma * (T1**4 - T2**4) / (1/e + 1/eps2 - 1) for e in eps_range])

plt.figure(figsize=(10, 6))
plt.plot(eps_range, q_vs_eps / 1000, 'b-', linewidth=2, label='辐射传热 q vs 发射率 ε₁')
plt.axvline(x=eps1, color='r', linestyle='--', label=f'当前设计值 ε₁={eps1}')
plt.xlabel('板1发射率 ε₁')
plt.ylabel('净辐射热流密度 q (kW/m^2)')
plt.title('发射率变化对平板辐射换热量的影响')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`),
        md(`## 9. 关键结果输出
输出平板等效发射率值及遮热板遮蔽后的净换热能量削减率。`),
        code(`print(f"等效发射率 ε_eff = {eps_eff:.4f}")
print(f"无遮热板时辐射热流 q_no_shield = {q_no_shield:.2f} W/m^2")
print(f"理想黑体换热上限 q_blackbody = {q_blackbody:.2f} W/m^2")
print(f"等效辐射传热系数 h_r = {h_r:.4f} W/(m²·K)")
if n_shield > 0:
    print(f"\\n加入 {n_shield} 块发射率为 {eps_s} 的遮热板后:")
    print(f"最终辐射热流密度 q = {q_final:.2f} W/m^2")
    print(f"系统辐射量阻削减比率 = {reduction:.2f}%")`),
        md(`## 10. 可修改参数提示
- 改变平板反射反射能，降低表面发射率 \`eps1\` / \`eps2\`：物体的发射率与其吸收率相等。减小发射率会使有效发射率大幅降低，迅速隔断辐射换热量。
- 增加遮热板数量 \`n_shield\`：由于增设遮热板相当于在中间增加了数个高反射表面屏障，传热削减效率极为惊人，是航天多层隔热服与低温容器的标配设计。`),
        md(`## 11. 结果分析提示
- 辐射换热量与温度的**四次方差**成正比，因而辐射换热对温差的敏感性远远高于传导和对流，在高温工况下将起主导传热地位。
- 中间插入遮热板时，若其发射率与平板相同（$\\varepsilon_s = \\varepsilon_1 = \\varepsilon_2$），加入1块遮热板就可以使辐射散热量减半；如果是高度打磨的抛光铝膜遮热板（低发射率，如0.05），防隔热效率可达到90%以上。`)
    ]);
}

// ============================================================
//  场景 12: 三表面封闭空腔辐射
// ============================================================
function gen_radiation_3surface(params: Record<string, number>) {
    const paramItems = [
        { name: 'T1_C', key: 'temp_1', value: params.temp_1 },
        { name: 'eps1', key: 'emissivity_1', value: params.emissivity_1 },
        { name: 'A1', key: 'area_1', value: params.area_1 },
        { name: 'T2_C', key: 'temp_2', value: params.temp_2 },
        { name: 'eps2', key: 'emissivity_2', value: params.emissivity_2 },
        { name: 'A2', key: 'area_2', value: params.area_2 },
        { name: 'F12', key: 'view_factor_12', value: params.view_factor_12 },
        { name: 'sigma', key: 'sigma', value: 5.67e-8 }
    ];

    return makeNotebook('三表面空腔辐射', [
        md(`# 热辐射 · 三表面封闭空腔辐射 (含重辐射面)`),
        md(`## 1. 仿真问题说明
三表面封闭系统内的辐射换热过程。其中表面1和表面2恒定维持在不同的温度 T1_C、T2_C 上，表面3为一个与外部绝热的重辐射面（Reradiating surface，表面净辐射换热为零，表面通过只发射与只接收达到能量自平衡）。仿真旨在通过辐射电网网络阻力法，计算该封闭空腔内部各节点的有效辐射能流分布以及重辐射面3的自平衡温度。`),
        md(`## 2. 模型假设
- 空腔由三个弥散-灰表面完全包围闭合，满足角系数封闭性。
- 表面为平面或凸面，自角系数为零 ($F_{11} = 0, F_{22} = 0$)。
- 表面3是理想重辐射面，即其背面绝热，没有对流等外部负荷，净辐射传热 $q_3 = 0$。`),
        md(`## 3. 参数说明表
${makeParameterTable(paramItems)}`),
        md(`## 4. 数学模型与计算规则
### 辐射电网法分析：
灰表面的辐射网络具有两种热阻：
1. **表面热阻**（由不透明材料反射造成）：
   $$R_{s1} = \\frac{1-\\varepsilon_1}{\\varepsilon_1 A_1}, \\quad R_{s2} = \\frac{1-\\varepsilon_2}{\\varepsilon_2 A_2}$$
2. **空间阻力**（由空间几何张角限制造成）：
   $$R_{12} = \\frac{1}{A_1 F_{12}}, \\quad R_{13} = \\frac{1}{A_1 F_{13}}, \\quad R_{23} = \\frac{1}{A_2 F_{23}}$$

由于表面3是重辐射面，其网络电势节点 $J_3$ 无表面电阻，且对地没有漏电流。因此从1至2的空间总等效阻力为 $R_{12}$ 与分路支路 $R_{13} + R_{23}$ 的并联值：
$$R_{space} = \\left( \\frac{1}{R_{12}} + \\frac{1}{R_{13} + R_{23}} \\right)^{-1}$$

总净换热量为：
$$q_1 = -q_2 = \\frac{E_{b1} - E_{b2}}{R_{s1} + R_{space} + R_{s2}}$$`),
        md(`## 5. 参数层代码
配置表面1、表面2的几何参数（面积、角系数）、温度、发射率物性属性。`),
        makeParamCell('T1_C', 'temp_1', params.temp_1),
        makeParamCell('eps1', 'emissivity_1', params.emissivity_1),
        makeParamCell('A1', 'area_1', params.area_1),
        makeParamCell('T2_C', 'temp_2', params.temp_2),
        makeParamCell('eps2', 'emissivity_2', params.emissivity_2),
        makeParamCell('A2', 'area_2', params.area_2),
        makeParamCell('F12', 'view_factor_12', params.view_factor_12),
        makeParamCell('sigma', 'sigma', 5.67e-8),
        md(`## 6. 模型层代码
这里导入计算基础库，并代数推导计算其余封闭角系数，例如封闭性要求下的 $F_{13}$ 和 $F_{23}$ 值。`),
        code(`${SETUP_IMPORTS_CODE}

T1 = T1_C + 273.15
T2 = T2_C + 273.15
Eb1 = sigma * T1**4
Eb2 = sigma * T2**4

# 依据角系数代数关系进行几何补充计算
F13 = 1.0 - F12
F21 = F12 * A1 / A2
if F21 > 1.0: F21 = 1.0
F23 = 1.0 - F21`),
        md(`## 7. 求解层代码
组装表面热阻、空间并联网络热阻，递推求出各个节点的有效辐射 $J_1$、$J_2$ 和 $J_3$，最终算得重辐射面3的温度。`),
        code(`Rs1 = (1 - eps1) / (eps1 * A1) if eps1 > 0 else 1e10
Rs2 = (1 - eps2) / (eps2 * A2) if eps2 > 0 else 1e10

R12 = 1.0 / (A1 * F12) if F12 > 0 else 1e10
R13 = 1.0 / (A1 * F13) if F13 > 0 else 1e10
R23 = 1.0 / (A2 * F23) if F23 > 0 else 1e10

# 网络并联化简
R_space = 1.0 / ( (1.0 / R12) + 1.0 / (R13 + R23) )
R_total = Rs1 + R_space + Rs2

q1 = (Eb1 - Eb2) / R_total
J1 = Eb1 - q1 * Rs1
J2 = Eb2 + q1 * Rs2

# 重辐射面电势平衡点计算
J3 = (J1 / R13 + J2 / R23) / (1/R13 + 1/R23)
T3 = (J3 / sigma)**0.25 - 273.15`),
        md(`## 8. 结果可视化代码
绘制三表面空腔内各级辐射能流节点（黑体辐射力与其对应有效辐射）的柱状对比图。`),
        code(`labels = ['面1 E_b1', '面1 J_1', '重辐射面 J_3(E_b3)', '面2 J_2', '面2 E_b2']
values = [Eb1, J1, J3, J2, Eb2]
colors = ['#ff9999', '#ffcc99', '#ffff99', '#99ccff', '#9999ff']

plt.figure(figsize=(10, 6))
bars = plt.bar(labels, values, color=colors, edgecolor='black', alpha=0.8)

for bar in bars:
    yval = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2, yval + (max(values)*0.01), 
             f'{yval:.0f}', ha='center', va='bottom', fontsize=10)

plt.ylabel('辐射能流率 (W/m^2)')
plt.title('三表面空腔内各电网节点辐射电势电位分布')
plt.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.show()`),
        md(`## 9. 关键结果输出
输出表面1、表面2的表面热阻和空间等效传热总功及重辐射表面3最终平衡达到的温度。`),
        code(`print(f"净换热量 q1 = -q2 = {q1:.2f} W")
print(f"节点电势: J1 = {J1:.2f} W/m^2, J2 = {J2:.2f} W/m^2, J3 = {J3:.2f} W/m^2")
print(f"重辐射表面 (面3) 平衡绝对温度 T3 = {T3:.2f} °C")`),
        md(`## 10. 可修改参数提示
- 调节表面发射率 \`eps1\` / \`eps2\`：其值增大时，由于表面反射减弱（表面热阻 \`Rs\` 减小），系统总热流 \`q1\` 会增大，表面有效辐射 \`J\` 亦随之改变。
- 调节角系数 \`F12\`：\`F12\` 变大表明面1与面2直接面对照射比例增大，空间并联电阻 \`R_space\` 减小，传热加剧，重辐射面3的平衡温度将发生位移。`),
        md(`## 11. 结果分析提示
- **重辐射面（表面3）** 虽然净传热量为零，但它扮演了“反光镜”的角色，它吸收来自热面的热辐射并等额反射/二次发射至冷面，实质上起到了强化两侧辐射换热空间连通的作用。
- 我们可以看出柱状图中重辐射面 $J_3$（也就是其辐射力 $E_{b3}$）正好处于 $J_1$ 和 $J_2$ 的电位之间。`)
    ]);
}

// ============================================================
//  场景 13: 内热源稳态导热 (解析解)
// ============================================================
function gen_steady_internal_heat(params: Record<string, number>) {
    const paramItems = [
        { name: 'L', key: 'thickness', value: params.thickness },
        { name: 'k', key: 'thermal_conductivity', value: params.thermal_conductivity },
        { name: 'qv', key: 'internal_heat_rate', value: params.internal_heat_rate },
        { name: 'T1', key: 'temp_left', value: params.temp_left },
        { name: 'T2', key: 'temp_right', value: params.temp_right },
        { name: 'N', key: 'n_nodes', value: params.n_nodes }
    ];

    return makeNotebook('内热源稳态导热', [
        md(`# 一维稳态导热 · 具有内热源的大平壁 (解析解)`),
        md(`## 1. 仿真问题说明
一维平壁稳态导热问题，但在平板材料内部存在均匀产热的内热源（产热率 qv，W/m³）。平板厚度为 L，导热系数为 k，两侧壁面维持恒温 T1 和 T2。由于内热源存在，温度曲线不再呈现纯线性分布，而是呈抛物线分布。本仿真用于求解系统极值温度发生的位置及大小、两侧边界的流出热阻与流出热流。`),
        md(`## 2. 模型假设
- 大平壁沿高、宽方向无限延伸，温度仅沿厚度轴（x方向）变化。
- 导热系数 k 和内热源强度 qv 均为各向均匀、不随温度位置改变的常数。
- 处于稳态导热阶段。`),
        md(`## 3. 参数说明表
${makeParameterTable(paramItems)}`),
        md(`## 4. 数学模型与计算规则
### 控制微分方程（含恒定源项的一维 Poisson 方程）：
$$k \\frac{d^2T}{dx^2} + q_v = 0$$

### 边界条件：
- 左侧壁温（x = 0）：$T(0) = T_1$
- 右侧壁温（x = L）：$T(L) = T_2$

### 理论解析解：
对此 Poisson 方程进行两次积分代入边界条件，可得抛物线型的温度场分布公式：
$$T(x) = -\\frac{q_v}{2k}x^2 + \\left(\\frac{T_2 - T_1}{L} + \\frac{q_v L}{2k}\\right)x + T_1$$

### 温度极值分析：
若极值点（微商为零处）落在平板内部（$0 \\le x_{ext} \\le L$），其极值位置坐标为：
$$x_{ext} = \\frac{C_1 k}{q_v} \\quad \\text{其中} \\quad C_1 = \\frac{T_2 - T_1}{L} + \\frac{q_v L}{2k}$$
极值处的峰值温度为 $T_{ext} = T(x_{ext})$。`),
        md(`## 5. 参数层代码
输入平板几何厚度、导热系数、产热率强标、边界表面恒温和网格采样点。`),
        makeParamCell('L', 'thickness', params.thickness),
        makeParamCell('k', 'thermal_conductivity', params.thermal_conductivity),
        makeParamCell('qv', 'internal_heat_rate', params.internal_heat_rate),
        makeParamCell('T1', 'temp_left', params.temp_left),
        makeParamCell('T2', 'temp_right', params.temp_right),
        makeParamCell('N', 'n_nodes', params.n_nodes),
        md(`## 6. 模型层代码
这里导入计算基础库，并生成一维平板空间轴坐标网格。`),
        code(`${SETUP_IMPORTS_CODE}

x = np.linspace(0, L, N)`),
        md(`## 7. 求解层代码
利用二次抛物线解析式求解板内温度空间分布、极值点物理位置及边界截面两侧的热流密度。`),
        code(`C1 = (T2 - T1) / L + (qv * L) / (2 * k)
T = (-qv / (2 * k)) * x**2 + C1 * x + T1

x_ext = C1 * k / qv if qv != 0 else 0
T_ext = (-qv / (2 * k)) * x_ext**2 + C1 * x_ext + T1 if qv != 0 else max(T1, T2)`),
        md(`## 8. 结果可视化代码
绘制带内热源平板一维稳态温度场的二次抛物线对比曲线图。`),
        code(`plt.figure(figsize=(10, 6))
plt.plot(x * 1000, T, 'ro-', markersize=3, label='内热源温度曲线')
if 0 <= x_ext <= L:
    plt.axvline(x=x_ext*1000, color='blue', linestyle=':', label=f'极值点 x={x_ext*1000:.1f}mm')
    plt.plot(x_ext*1000, T_ext, 'g*', markersize=12, label=f'T_max = {T_ext:.2f}°C')
plt.xlabel('位置 x (mm)')
plt.ylabel('温度 T (°C)')
plt.title('一维具有均匀内热源平板稳态温度分布')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`),
        md(`## 9. 关键结果输出
输出极值峰值信息及左右两侧流经壁面的热导流密度值。`),
        code(`if 0 <= x_ext <= L:
    print(f"抛物线极值出现在平板内部: x = {x_ext:.4f} m, 峰值温度 = {T_ext:.2f} °C")
else:
    print("抛物线峰值极值点落在平板外部。")

# 求解傅里叶定律导热密度量
q_left = k * C1
q_right = -k * ((-qv / k) * L + C1)
print(f"左侧壁面热流密度 (向右流为正): {q_left:.2f} W/m^2")
print(f"右侧壁面热流密度 (向外流为负): {q_right:.2f} W/m^2")`),
        md(`## 10. 可修改参数提示
- 调节内热源强度 \`qv\`：\`qv = 0\` 时，温度场完全退化成传统无源平板的线性分布。\`qv\` 增大时抛物线中间隆起更剧烈，表明内部热量越容易聚集。
- 改变导热系数 \`k\`：在内部恒定发热时，导热系数 \`k\` 越大，散热阻力越小，平板最高温度 \`T_ext\` 就会相应大幅度下降。`),
        md(`## 11. 结果分析提示
- 在本工况下，若内热源为正（材料自发热），且温差或厚度使得峰值出现在平板内部，最高温度便既不在左边界也不在右边界，而是在板内 $x_{ext}$ 处。
- 左右两侧表面处的热流密度大小不再相等，因为热源发出的热量需要分别向左、向右流出系统，满足整体能量收恒平衡。`)
    ]);
}

// ============================================================
//  场景 14: 二维矩形平板稳态导热
// ============================================================
function gen_steady_2d_plate(params: Record<string, number>) {
    const paramItems = [
        { name: 'L', key: 'length', value: params.length },
        { name: 'W', key: 'width', value: params.width },
        { name: 'T_top', key: 'temp_top', value: params.temp_top },
        { name: 'T_bottom', key: 'temp_bottom', value: params.temp_bottom },
        { name: 'T_left', key: 'temp_left', value: params.temp_left },
        { name: 'T_right', key: 'temp_right', value: params.temp_right },
        { name: 'nx', key: 'nx', value: params.nx },
        { name: 'ny', key: 'ny', value: params.ny }
    ];

    return makeNotebook('二维矩形平板稳态导热', [
        md(`# 二维稳态导热 · 矩形平板 (基于 FDM)`),
        md(`## 1. 仿真问题说明
二维空间下的稳态无源导热问题。一块长度为 L、宽度为 W 的矩形平板，上下左右四个边界分别维持恒定的壁温（T_top、T_bottom、T_left、T_right）。仿真旨在采用有限差分法 (FDM) 组装离散二维 Laplace 代数方程组并进行大型矩阵求解，最终绘制出平面二维彩图热力场与温度梯度等温线分布。`),
        md(`## 2. 模型假设
- 沿平板厚度方向尺寸极薄且表面绝热，简化为二维热传导。
- 导热系数 k 为常数（对二维稳态 Laplace 分布无求解影响，但材质均匀）。
- 导热达到稳态，无时间演化和内热源。`),
        md(`## 3. 参数说明表
${makeParameterTable(paramItems)}`),
        md(`## 4. 数学模型与计算规则
### 二维控制微分方程 (二维 Laplace 方程)：
$$\\frac{\\partial^2 T}{\\partial x^2} + \\frac{\\partial^2 T}{\\partial y^2} = 0$$

### 边界条件：
- 上侧（y = W）：$T(x, W) = T_{top}$
- 下侧（y = 0）：$T(x, 0) = T_{bottom}$
- 左侧（x = 0）：$T(0, y) = T_{left}$
- 右侧（x = L）：$T(L, y) = T_{right}$

### 五点有限差分格式：
对平面网格进行双向等距离散，内部节点 (i, j) 处的二阶导数采用五点差商离散：
$$\\frac{T_{i-1,j} - 2T_{i,j} + T_{i+1,j}}{\\Delta x^2} + \\frac{T_{i,j-1} - 2T_{i,j} + T_{i,j+1}}{\\Delta y^2} = 0$$
如果将二维平面坐标一维拉直展开，可将所有内部及边界方程组装为大型稀疏系数线性代数方程组，并统一求解。`),
        md(`## 5. 参数层代码
定义矩形二维平板长宽几何比例、四周边界温度以及双向离散空间网格点数。`),
        makeParamCell('L', 'length', params.length),
        makeParamCell('W', 'width', params.width),
        makeParamCell('T_top', 'temp_top', params.temp_top),
        makeParamCell('T_bottom', 'temp_bottom', params.temp_bottom),
        makeParamCell('T_left', 'temp_left', params.temp_left),
        makeParamCell('T_right', 'temp_right', params.temp_right),
        makeParamCell('nx', 'nx', params.nx),
        makeParamCell('ny', 'ny', params.ny),
        md(`## 6. 模型层代码
这里导入计算基础库，计算网格步长，并展开网格一维拉直索引映射辅助函数。`),
        code(`${SETUP_IMPORTS_CODE}

dx = L / (nx - 1)
dy = W / (ny - 1)
dx2, dy2 = dx**2, dy**2
denom = 2 * (dx2 + dy2)

n_total = nx * ny
A = np.zeros((n_total, n_total))
b = np.zeros(n_total)

def get_idx(i, j):
    return i + j * nx`),
        md(`## 7. 求解层代码
循环遍历二维空间节点，组装五点差分离散方程系数及四周第一类边界节点值，并统一求解拉直方程。`),
        code(`for j in range(ny):
    for i in range(nx):
        idx = get_idx(i, j)
        if j == 0:
            A[idx, idx] = 1.0; b[idx] = T_bottom
        elif j == ny - 1:
            A[idx, idx] = 1.0; b[idx] = T_top
        elif i == 0:
            A[idx, idx] = 1.0; b[idx] = T_left
        elif i == nx - 1:
            A[idx, idx] = 1.0; b[idx] = T_right
        else:
            A[idx, idx] = -denom
            A[idx, get_idx(i-1, j)] = dy2
            A[idx, get_idx(i+1, j)] = dy2
            A[idx, get_idx(i, j-1)] = dx2
            A[idx, get_idx(i, j+1)] = dx2
            b[idx] = 0.0

T_vec = np.linalg.solve(A, b)
T_mat = T_vec.reshape((ny, nx))

# 边界角点温度求和平均，使可视化过渡更平滑
T_mat[0, 0] = (T_bottom + T_left) / 2
T_mat[0, nx-1] = (T_bottom + T_right) / 2
T_mat[ny-1, 0] = (T_top + T_left) / 2
T_mat[ny-1, nx-1] = (T_top + T_right) / 2`),
        md(`## 8. 结果可视化代码
使用 Contourf 绘制平面二维温度热力云图（Heatmap），并叠加等温指示线。`),
        code(`x_coords = np.linspace(0, L, nx)
y_coords = np.linspace(0, W, ny)
X, Y = np.meshgrid(x_coords, y_coords)

plt.figure(figsize=(9, 7))
cp = plt.contourf(X, Y, T_mat, levels=50, cmap='inferno')
plt.colorbar(cp, label='温度 T (°C)')
plt.contour(X, Y, T_mat, levels=15, colors='black', linewidths=0.5, alpha=0.5)

plt.xlabel('X 位置 (m)')
plt.ylabel('Y 位置 (m)')
plt.title('二维矩形平板稳态温度场分布')
plt.tight_layout()
plt.show()`),
        md(`## 9. 关键结果输出
输出平板正中心节点的稳态温度以及全场极限数值。`),
        code(`print(f"平板中心点温度 T(L/2, W/2) = {T_mat[ny//2, nx//2]:.2f} °C")
print(f"全板最高温度 = {np.max(T_mat):.2f} °C, 最低温度 = {np.min(T_mat):.2f} °C")`),
        md(`## 10. 可修改参数提示
- 调节四个边界的壁温值：调节上下左右温差可以观察热流在二维空间流动的方向改道（等温线弯曲规律）。
- 改变网格分辨率 \`nx\` / \`ny\`：大网格下由于矩阵求解器负载（一维求解器开销为 $O(N^3)$），计算耗时会增加，但等温线会变得更加细腻圆润。`),
        md(`## 11. 结果分析提示
- 二维稳态导热的等温线总是垂直于热力梯度矢量，热量永远沿着**等温线法线方向**（温度降低最快的方向）发生传导。
- 在四边恒温边界下，四角节点的物理设定具有不连续突变（如左边界20℃而上边界100℃）。代码中在物理求解后对四个角节点进行了算术平均平滑美化，提高了图表呈现美感。`)
    ]);
}

// ============================================================
//  公共导出函数
// ============================================================
const GENERATORS: Record<string, (params: Record<string, number>) => any> = {
    steady_flat_plate: gen_steady_flat_plate,
    steady_multilayer_plate: gen_steady_multilayer_plate,
    steady_cylindrical_wall: gen_steady_cylindrical_wall,
    steady_straight_fin: gen_steady_straight_fin,
    transient_plate_const_temp: gen_transient_plate_const_temp,
    transient_plate_const_flux: gen_transient_plate_const_flux,
    convection_laminar_plate: gen_convection_laminar_plate,
    convection_turbulent_plate: gen_convection_turbulent_plate,
    convection_natural_vertical: gen_convection_natural_vertical,
    convection_internal_tube: gen_convection_internal_tube,
    radiation_parallel_plates: gen_radiation_parallel_plates,
    radiation_3surface: gen_radiation_3surface,
    steady_internal_heat: gen_steady_internal_heat,
    steady_2d_plate: gen_steady_2d_plate,
};

function normalizeGenerateInput(input: ThermalGenerateInput): ThermalNotebookInput {
    if (
        input &&
        typeof input === 'object' &&
        'values' in input &&
        typeof (input as ThermalNotebookInput).values === 'object'
    ) {
        return {
            values: (input as ThermalNotebookInput).values,
            controls: (input as ThermalNotebookInput).controls || {}
        };
    }

    return {
        values: input as Record<string, number>,
        controls: {}
    };
}

export function generateNotebook(scenarioId: string, input: ThermalGenerateInput): any {
    const gen = GENERATORS[scenarioId];
    if (!gen) {
        throw new Error(`未知场景 ID: ${scenarioId}`);
    }
    const normalized = normalizeGenerateInput(input);
    activeControlOverrides = normalized.controls || {};
    try {
        return gen(normalized.values);
    } finally {
        activeControlOverrides = {};
    }
}

export function getScenarioName(scenarioId: string): string {
    return SCENARIO_NAMES[scenarioId] || scenarioId;
}
