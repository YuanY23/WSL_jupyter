import React, { useState, useEffect } from 'react';

// ============================================================
// 场景配置：4 大类别，共 10 个仿真场景
// ============================================================
export const SCENARIOS: Record<string, { id: string; name: string }[]> = {
    steady_conduction: [
        { id: 'steady_flat_plate', name: '无限大平板导热' },
        { id: 'steady_multilayer_plate', name: '多层复合平板导热' },
        { id: 'steady_cylindrical_wall', name: '圆筒壁径向导热' },
        { id: 'steady_straight_fin', name: '等截面直肋导热' },
        { id: 'steady_internal_heat', name: '平壁内热源稳态导热' },
        { id: 'steady_2d_plate', name: '矩形平板二维稳态导热' },
    ],
    transient_conduction: [
        { id: 'transient_plate_const_temp', name: '两侧恒温加热/冷却' },
        { id: 'transient_plate_const_flux', name: '一侧恒定热流' },
    ],
    convection: [
        { id: 'convection_laminar_plate', name: '平板层流强制对流' },
        { id: 'convection_turbulent_plate', name: '平板湍流强制对流' },
        { id: 'convection_natural_vertical', name: '竖板自然对流' },
        { id: 'convection_internal_tube', name: '圆管内强迫对流' },
    ],
    radiation: [
        { id: 'radiation_parallel_plates', name: '平行平板辐射换热' },
        { id: 'radiation_3surface', name: '三表面封闭空腔辐射' },
    ],
};

// 类别显示名
const CATEGORY_LABELS: Record<string, string> = {
    steady_conduction: '稳态导热',
    transient_conduction: '瞬态导热',
    convection: '对流换热',
    radiation: '热辐射',
};

// ============================================================
// 每个场景的默认参数
// ============================================================
export const DEFAULT_PARAMS: Record<string, Record<string, number>> = {
    // ---- 稳态导热 ----
    steady_flat_plate: {
        thickness: 0.1,
        thermal_conductivity: 400,
        temp_left: 100,
        temp_right: 20,
    },
    steady_multilayer_plate: {
        L1: 0.01, k1: 50,
        L2: 0.05, k2: 0.04,
        L3: 0.01, k3: 200,
        temp_left: 200, temp_right: 20,
    },
    steady_cylindrical_wall: {
        r_inner: 0.05,
        r_outer: 0.10,
        thermal_conductivity: 50,
        temp_inner: 200,
        temp_outer: 50,
    },
    steady_straight_fin: {
        fin_length: 0.05,
        fin_thickness: 0.002,
        fin_width: 0.10,
        thermal_conductivity: 200,
        h_conv: 25,
        temp_base: 100,
        temp_ambient: 25,
    },
    steady_internal_heat: {
        thickness: 0.1,
        thermal_conductivity: 400,
        internal_heat_rate: 1000000,
        temp_left: 100,
        temp_right: 100,
        n_nodes: 100,
    },
    steady_2d_plate: {
        length: 1.0,
        width: 1.0,
        temp_top: 100,
        temp_bottom: 20,
        temp_left: 20,
        temp_right: 20,
        nx: 30,
        ny: 30,
    },
    // ---- 瞬态导热 ----
    transient_plate_const_temp: {
        thickness: 0.1,
        alpha: 1e-5,
        temp_init: 20,
        temp_surface: 200,
        time: 60,
    },
    transient_plate_const_flux: {
        thickness: 0.1,
        thermal_conductivity: 50,
        density: 7800,
        specific_heat: 500,
        heat_flux: 5000,
        temp_init: 20,
        time: 120,
    },
    // ---- 对流换热 ----
    convection_laminar_plate: {
        plate_length: 0.5,
        velocity: 2.0,
        temp_wall: 60,
        temp_fluid: 20,
        fluid_k: 0.026,
        fluid_nu: 1.6e-5,
        fluid_Pr: 0.71,
    },
    convection_turbulent_plate: {
        plate_length: 2.0,
        velocity: 10.0,
        temp_wall: 60,
        temp_fluid: 20,
        fluid_k: 0.026,
        fluid_nu: 1.6e-5,
        fluid_Pr: 0.71,
    },
    convection_natural_vertical: {
        plate_height: 0.3,
        temp_wall: 80,
        temp_ambient: 20,
        fluid_k: 0.028,
        fluid_nu: 1.8e-5,
        fluid_Pr: 0.71,
    },
    convection_internal_tube: {
        tube_length: 5.0,
        tube_diameter: 0.05,
        velocity: 2.0,
        temp_inlet: 20.0,
        temp_wall: 100.0,
        fluid_k: 0.6,
        fluid_nu: 1e-6,
        fluid_Pr: 7.0,
        fluid_rho: 1000.0,
        fluid_cp: 4180.0,
    },
    // ---- 热辐射 ----
    radiation_parallel_plates: {
        temp_plate1: 500,
        temp_plate2: 30,
        emissivity1: 0.8,
        emissivity2: 0.6,
        n_shield: 0,
        emissivity_shield: 0.05,
    },
    radiation_3surface: {
        temp_1: 500,
        emissivity_1: 0.8,
        area_1: 1.0,
        temp_2: 30,
        emissivity_2: 0.8,
        area_2: 1.0,
        view_factor_12: 0.2,
    },
};

// ============================================================
// 参数中文标签
// ============================================================
export const PARAM_LABELS: Record<string, { label: string; unit: string; min: number; max: number }> = {
    thickness: { label: '厚度 (L)', unit: 'm', min: 0.001, max: 10 },
    L1: { label: '第1层厚度', unit: 'm', min: 0.001, max: 1 },
    k1: { label: '第1层导热系数', unit: 'W/(m·K)', min: 0.01, max: 5000 },
    L2: { label: '第2层厚度', unit: 'm', min: 0.001, max: 1 },
    k2: { label: '第2层导热系数', unit: 'W/(m·K)', min: 0.01, max: 5000 },
    L3: { label: '第3层厚度', unit: 'm', min: 0.001, max: 1 },
    k3: { label: '第3层导热系数', unit: 'W/(m·K)', min: 0.01, max: 5000 },
    r_inner: { label: '内半径', unit: 'm', min: 0.001, max: 10 },
    r_outer: { label: '外半径', unit: 'm', min: 0.002, max: 10 },
    fin_length: { label: '肋片长度', unit: 'm', min: 0.001, max: 1 },
    fin_thickness: { label: '肋片厚度', unit: 'm', min: 0.0001, max: 0.1 },
    fin_width: { label: '肋片宽度', unit: 'm', min: 0.001, max: 1 },
    plate_length: { label: '平板长度', unit: 'm', min: 0.01, max: 50 },
    plate_height: { label: '板高', unit: 'm', min: 0.01, max: 10 },
    length: { label: '长度 (L)', unit: 'm', min: 0.01, max: 10 },
    width: { label: '宽度 (W)', unit: 'm', min: 0.01, max: 10 },
    internal_heat_rate: { label: '内热源强度 (qv)', unit: 'W/m³', min: -1e8, max: 1e8 },
    n_nodes: { label: '节点数', unit: '个', min: 10, max: 1000 },
    nx: { label: 'x 分辨率', unit: '个', min: 3, max: 100 },
    ny: { label: 'y 分辨率', unit: '个', min: 3, max: 100 },
    thermal_conductivity: { label: '导热系数 (k)', unit: 'W/(m·K)', min: 0.01, max: 5000 },
    alpha: { label: '热扩散率 (α)', unit: 'm²/s', min: 1e-8, max: 1e-3 },
    density: { label: '密度 (ρ)', unit: 'kg/m³', min: 100, max: 20000 },
    specific_heat: { label: '比热 (c)', unit: 'J/(kg·K)', min: 100, max: 5000 },
    temp_left: { label: '左侧边界温度', unit: '°C', min: -273, max: 3000 },
    temp_right: { label: '右侧边界温度', unit: '°C', min: -273, max: 3000 },
    temp_top: { label: '上侧边界温度', unit: '°C', min: -273, max: 3000 },
    temp_bottom: { label: '下侧边界温度', unit: '°C', min: -273, max: 3000 },
    temp_inner: { label: '内壁温度', unit: '°C', min: -273, max: 3000 },
    temp_outer: { label: '外壁温度', unit: '°C', min: -273, max: 3000 },
    temp_base: { label: '肋根温度', unit: '°C', min: -273, max: 3000 },
    temp_ambient: { label: '环境温度', unit: '°C', min: -273, max: 3000 },
    temp_init: { label: '初始温度', unit: '°C', min: -273, max: 3000 },
    temp_surface: { label: '壁面温度', unit: '°C', min: -273, max: 3000 },
    temp_wall: { label: '壁面温度', unit: '°C', min: -273, max: 3000 },
    temp_fluid: { label: '流体温度', unit: '°C', min: -273, max: 3000 },
    temp_plate1: { label: '板1温度', unit: '°C', min: -273, max: 3000 },
    temp_plate2: { label: '板2温度', unit: '°C', min: -273, max: 3000 },
    h_conv: { label: '对流换热系数 (h)', unit: 'W/(m²·K)', min: 0.1, max: 50000 },
    heat_flux: { label: '热流密度 (q)', unit: 'W/m²', min: 0, max: 1e6 },
    velocity: { label: '来流速度 (U∞)', unit: 'm/s', min: 0.01, max: 100 },
    fluid_k: { label: '流体导热系数', unit: 'W/(m·K)', min: 0.001, max: 100 },
    fluid_nu: { label: '运动粘度 (ν)', unit: 'm²/s', min: 1e-7, max: 1e-3 },
    fluid_Pr: { label: 'Prandtl 数', unit: '', min: 0.001, max: 1000 },
    fluid_rho: { label: '流体密度', unit: 'kg/m³', min: 0.1, max: 20000 },
    fluid_cp: { label: '流体比热', unit: 'J/(kg·K)', min: 100, max: 5000 },
    tube_length: { label: '管长', unit: 'm', min: 0.01, max: 100 },
    tube_diameter: { label: '管径', unit: 'm', min: 0.001, max: 2 },
    temp_inlet: { label: '入口温度', unit: '°C', min: -273, max: 3000 },
    temp_1: { label: '表面1温度', unit: '°C', min: -273, max: 3000 },
    temp_2: { label: '表面2温度', unit: '°C', min: -273, max: 3000 },
    area_1: { label: '表面1面积', unit: 'm²', min: 0.01, max: 1000 },
    area_2: { label: '表面2面积', unit: 'm²', min: 0.01, max: 1000 },
    view_factor_12: { label: '角系数 F12', unit: '', min: 0, max: 1 },
    emissivity1: { label: '板1发射率 (ε₁)', unit: '', min: 0.01, max: 1 },
    emissivity2: { label: '板2发射率 (ε₂)', unit: '', min: 0.01, max: 1 },
    n_shield: { label: '遮热板数量', unit: '块', min: 0, max: 10 },
    emissivity_shield: { label: '遮热板发射率', unit: '', min: 0.01, max: 1 },
    time: { label: '仿真总时间', unit: 's', min: 0.1, max: 100000 },
};

// ============================================================
// 组件
// ============================================================
interface IControlPanelProps {
    onExecute: (
        scenarioId: string,
        params: Record<string, number>,
        controls: Record<string, IParamControlSettings>
    ) => void;
}

export interface IParamControlSettings {
    min?: number;
    max?: number;
    step?: number;
}

type CategoryKey = keyof typeof SCENARIOS;

interface IScenarioOption {
    id: string;
    name: string;
    category: CategoryKey;
}

const SCENARIO_DETAILS: Record<string, { description: string; assumptions: string[] }> = {
    steady_flat_plate: {
        description: '研究一维稳态无内热源平板导热，生成温度分布、热流密度和有限差分求解过程。',
        assumptions: ['温度只沿厚度方向变化', '材料均匀且导热系数为常数', '左右两侧为恒定温度边界']
    },
    steady_multilayer_plate: {
        description: '计算三层复合平板的一维稳态导热过程，分析各层热阻、界面温度和总热流密度。',
        assumptions: ['各层材料均匀且完全贴合', '忽略接触热阻', '传热过程处于稳态且无内热源']
    },
    steady_cylindrical_wall: {
        description: '模拟空心圆筒壁的径向稳态导热，展示柱坐标下的对数温度分布。',
        assumptions: ['圆筒长度足够长，忽略轴向传热', '材料导热系数恒定', '内外壁温度保持恒定']
    },
    steady_straight_fin: {
        description: '计算等截面直肋的温度衰减、散热量和肋片效率，用于分析扩展表面换热效果。',
        assumptions: ['肋片沿长度方向一维导热', '表面对流换热系数恒定', '肋端按绝热边界处理']
    },
    steady_internal_heat: {
        description: '分析带均匀内热源的平壁稳态导热，得到板内抛物线温度分布和最高温度。',
        assumptions: ['内热源均匀分布', '两侧边界温度已知', '导热系数不随温度变化']
    },
    steady_2d_plate: {
        description: '用二维有限差分方法求解矩形平板稳态温度场，输出等温线和热力云图。',
        assumptions: ['平板厚度方向温差忽略', '四边为恒定温度边界', '内部无热源且材料均匀']
    },
    transient_plate_const_temp: {
        description: '模拟平板两侧突然恒温加热或冷却后的瞬态温度演化过程。',
        assumptions: ['初始温度均匀', '两侧壁面温度突变后保持恒定', '使用稳定的显式时间推进格式']
    },
    transient_plate_const_flux: {
        description: '模拟一侧恒定热流输入、另一侧绝热条件下的平板瞬态升温过程。',
        assumptions: ['材料热物性为常数', '右侧边界绝热', '使用全隐式有限体积格式保证稳定性']
    },
    convection_laminar_plate: {
        description: '基于平板层流边界层关联式计算局部和平均对流换热系数。',
        assumptions: ['流动保持层流', '壁温均匀', '流体物性按定性温度取常数']
    },
    convection_turbulent_plate: {
        description: '计算长平板强制对流的层流-湍流混合边界层换热特性。',
        assumptions: ['转捩雷诺数取固定阈值', '忽略过渡区平滑变化', '壁温和来流物性保持恒定']
    },
    convection_natural_vertical: {
        description: '使用 Churchill-Chu 关联式估算竖板自然对流换热和 Rayleigh 数判据。',
        assumptions: ['无外部强迫流动', '采用 Boussinesq 浮力近似', '流体物性按膜温取值']
    },
    convection_internal_tube: {
        description: '计算圆管内强迫对流的沿程流体温度、努塞尔数和总换热量。',
        assumptions: ['管壁温度恒定', '管内平均流速已知', '根据雷诺数判断层流或湍流关联式']
    },
    radiation_parallel_plates: {
        description: '计算两块平行灰体平板之间的净辐射换热，并分析遮热板减热效果。',
        assumptions: ['两板视为无限大平行表面', '中间介质不参与辐射', '表面按灰体处理']
    },
    radiation_3surface: {
        description: '用辐射网络方法估算三表面封闭空腔中的辐射换热关系。',
        assumptions: ['表面为漫灰体', '角系数满足封闭性约束', '空腔内介质透明不吸收辐射']
    }
};

function getScenarioOptions(categoryKeys: CategoryKey[]): IScenarioOption[] {
    return categoryKeys.reduce<IScenarioOption[]>((options, category) => {
        SCENARIOS[category].forEach(scenario => {
            options.push({
                ...scenario,
                category
            });
        });
        return options;
    }, []);
}

function inferStep(value: number): number {
    const absValue = Math.abs(value);
    if (!Number.isFinite(absValue) || absValue === 0) {
        return 1;
    }
    if (Number.isInteger(value) && absValue >= 10) {
        return 1;
    }
    if (absValue < 0.001) {
        return absValue / 10;
    }
    if (absValue < 1) {
        return 0.01;
    }
    if (absValue < 10) {
        return 0.1;
    }
    return 1;
}

function defaultControlForParam(key: string, value: number): IParamControlSettings {
    const labelConfig = PARAM_LABELS[key];
    return {
        min: labelConfig?.min,
        max: labelConfig?.max,
        step: inferStep(value)
    };
}

function parseOptionalNumber(value: string): number | undefined {
    if (value.trim() === '') {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export const ControlPanel: React.FC<IControlPanelProps> = ({ onExecute }) => {
    const categoryKeys = Object.keys(SCENARIOS) as CategoryKey[];
    const scenarioOptions = getScenarioOptions(categoryKeys);
    const [activeScenario, setActiveScenario] = useState<string>(SCENARIOS[categoryKeys[0]][0].id);
    const [params, setParams] = useState<Record<string, number>>({});
    const [paramControls, setParamControls] = useState<Record<string, IParamControlSettings>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const activeOption = scenarioOptions.find(scenario => scenario.id === activeScenario) || scenarioOptions[0];
    const activeDetails = SCENARIO_DETAILS[activeScenario] || {
        description: '根据当前热设计场景参数生成包含计算代码、图表和分析提示的 Notebook。',
        assumptions: ['参数由当前场景定义', 'Notebook 保留完整计算代码', '用户可在生成后继续修改和运行']
    };

    useEffect(() => {
        handleReset();
    }, [activeScenario]);

    const handleReset = () => {
        const nextParams = { ...(DEFAULT_PARAMS[activeScenario] || {}) };
        const nextControls = Object.entries(nextParams).reduce<Record<string, IParamControlSettings>>(
            (controls, [key, value]) => {
                controls[key] = defaultControlForParam(key, value);
                return controls;
            },
            {}
        );
        setParams(nextParams);
        setParamControls(nextControls);
        setErrors({});
    };

    const validateParam = (key: string, value: number, controls: IParamControlSettings): string => {
        const messages: string[] = [];
        const config = PARAM_LABELS[key];

        if (isNaN(value)) {
            messages.push('请输入数字');
        }
        if (
            controls.min !== undefined &&
            controls.max !== undefined &&
            controls.min >= controls.max
        ) {
            messages.push('最小值必须小于最大值');
        }
        if (controls.step !== undefined && controls.step <= 0) {
            messages.push('步长必须大于 0');
        }
        if (!isNaN(value)) {
            const min = controls.min ?? config?.min;
            const max = controls.max ?? config?.max;
            if (min !== undefined && value < min) {
                messages.push(`不能小于 ${min}`);
            }
            if (max !== undefined && value > max) {
                messages.push(`不能大于 ${max}`);
            }
        }

        return messages.join('；');
    };

    const handleChange = (key: string, value: string) => {
        const num = parseFloat(value);
        const controls = paramControls[key] || {};
        setParams(prev => ({ ...prev, [key]: num }));
        setErrors(prev => ({ ...prev, [key]: validateParam(key, num, controls) }));
    };

    const handleControlChange = (key: string, field: keyof IParamControlSettings, value: string) => {
        const nextValue = parseOptionalNumber(value);
        const nextControls = {
            ...paramControls[key],
            [field]: nextValue
        };
        const nextAllControls = {
            ...paramControls,
            [key]: nextControls
        };
        setParamControls(nextAllControls);
        setErrors(prev => ({ ...prev, [key]: validateParam(key, params[key], nextControls) }));
    };

    const hasErrors = Object.values(errors).some(err => err !== '');

    return (
        <div className="thermal-workbench-panel">
            <div className="thermal-workbench-shell">
                <aside className="thermal-workbench-sidebar">
                    <h2 className="thermal-workbench-title">传热仿真平台</h2>
                    <p className="thermal-workbench-subtitle">传热仿真平台</p>

                    <div className="thermal-scenario-list">
                        {scenarioOptions.map(scenario => (
                            <button
                                key={scenario.id}
                                className={`thermal-scenario-button ${activeScenario === scenario.id ? 'is-active' : ''}`}
                                onClick={() => setActiveScenario(scenario.id)}
                            >
                                <span className="thermal-scenario-name">{scenario.name}</span>
                                <span className="thermal-scenario-summary">{CATEGORY_LABELS[scenario.category]}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                <section className="thermal-workbench-editor">
                    <h2 className="thermal-workbench-title">传热仿真平台</h2>
                    <p className="thermal-workbench-subtitle">
                        选择热设计场景，填写几何、物性和边界参数，然后生成可运行、可修改、代码可见的 Notebook。
                    </p>

                    <div className="thermal-workbench-grid">
                        <div className="thermal-workbench-field">
                            <label>仿真名称</label>
                            <input type="text" value={activeOption.name} readOnly />
                        </div>
                        <div className="thermal-workbench-field">
                            <label>仿真类别</label>
                            <input type="text" value={CATEGORY_LABELS[activeOption.category]} readOnly />
                        </div>
                    </div>

                    <div className="thermal-workbench-field">
                        <label>仿真问题说明</label>
                        <textarea value={activeDetails.description} readOnly />
                    </div>

                    <div className="thermal-workbench-field">
                        <label>模型假设</label>
                        <textarea value={activeDetails.assumptions.join('\n')} readOnly />
                    </div>

                    <h3 className="thermal-workbench-section-title">参数和变量</h3>
                    <div className="thermal-param-table-wrap">
                        <table className="thermal-param-table">
                            <thead>
                                <tr>
                                    <th>变量名</th>
                                    <th>显示名</th>
                                    <th>数值</th>
                                    <th>单位</th>
                                    <th>最小值</th>
                                    <th>最大值</th>
                                    <th>步长</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(params).map(key => {
                                    const config = PARAM_LABELS[key] || { label: key, unit: '', min: -Infinity, max: Infinity };
                                    const controls = paramControls[key] || {};
                                    const err = errors[key];
                                    return (
                                        <tr key={key}>
                                            <td>
                                                <code className="thermal-param-code">{key}</code>
                                            </td>
                                            <td>
                                                <input type="text" value={config.label} readOnly />
                                            </td>
                                            <td>
                                                <input
                                                    className={err ? 'has-error' : ''}
                                                    type="number"
                                                    value={isNaN(params[key]) ? '' : params[key]}
                                                    onChange={e => handleChange(key, e.target.value)}
                                                    step="any"
                                                />
                                                {err && <div className="thermal-param-error">{err}</div>}
                                            </td>
                                            <td>
                                                <input type="text" value={config.unit || '-'} readOnly />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={controls.min ?? ''}
                                                    onChange={e => handleControlChange(key, 'min', e.target.value)}
                                                    step="any"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={controls.max ?? ''}
                                                    onChange={e => handleControlChange(key, 'max', e.target.value)}
                                                    step="any"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={controls.step ?? ''}
                                                    onChange={e => handleControlChange(key, 'step', e.target.value)}
                                                    step="any"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="thermal-workbench-actions">
                        <button className="thermal-workbench-button primary" disabled={hasErrors} onClick={() => onExecute(activeScenario, params, paramControls)}>
                            生成 Notebook
                        </button>
                        <button className="thermal-workbench-button" onClick={handleReset}>
                            重置参数
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};
