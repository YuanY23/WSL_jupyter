import React, { useState, useEffect } from 'react';
// ============================================================
// 场景配置：4 大类别，共 10 个仿真场景
// ============================================================
export const SCENARIOS = {
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
const CATEGORY_LABELS = {
    steady_conduction: '稳态导热',
    transient_conduction: '瞬态导热',
    convection: '对流换热',
    radiation: '热辐射',
};
// ============================================================
// 每个场景的默认参数
// ============================================================
export const DEFAULT_PARAMS = {
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
export const PARAM_LABELS = {
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
export const ControlPanel = ({ onExecute }) => {
    const categoryKeys = Object.keys(SCENARIOS);
    const [activeTab, setActiveTab] = useState(categoryKeys[0]);
    const [activeScenario, setActiveScenario] = useState(SCENARIOS[categoryKeys[0]][0].id);
    const [params, setParams] = useState({});
    const [errors, setErrors] = useState({});
    useEffect(() => {
        handleReset();
    }, [activeScenario]);
    const handleReset = () => {
        setParams({ ...(DEFAULT_PARAMS[activeScenario] || {}) });
        setErrors({});
    };
    const handleChange = (key, value) => {
        const num = parseFloat(value);
        setParams(prev => ({ ...prev, [key]: num }));
        let error = '';
        const config = PARAM_LABELS[key];
        if (config) {
            if (isNaN(num))
                error = '请输入数字';
            else if (num < config.min)
                error = `不能小于 ${config.min}`;
            else if (num > config.max)
                error = `不能大于 ${config.max}`;
        }
        setErrors(prev => ({ ...prev, [key]: error }));
    };
    const hasErrors = Object.values(errors).some(err => err !== '');
    return (React.createElement("div", { className: "thermal-control-panel-inner", style: { padding: '15px', overflowY: 'auto', height: '100%' } },
        React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', borderBottom: '2px solid #1976d2', marginBottom: '12px' } }, categoryKeys.map(cat => (React.createElement("button", { key: cat, style: {
                flex: 1,
                minWidth: '70px',
                padding: '8px 4px',
                cursor: 'pointer',
                backgroundColor: activeTab === cat ? '#1976d2' : 'transparent',
                color: activeTab === cat ? 'white' : 'inherit',
                border: 'none',
                fontWeight: activeTab === cat ? 'bold' : 'normal',
                fontSize: '13px',
                transition: 'all 0.2s',
            }, onClick: () => {
                setActiveTab(cat);
                setActiveScenario(SCENARIOS[cat][0].id);
            } }, CATEGORY_LABELS[cat] || cat)))),
        React.createElement("div", { style: { marginBottom: '16px' } }, SCENARIOS[activeTab].map(s => (React.createElement("button", { key: s.id, onClick: () => setActiveScenario(s.id), style: {
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                marginBottom: '4px',
                textAlign: 'left',
                cursor: 'pointer',
                backgroundColor: activeScenario === s.id ? '#e3f2fd' : 'transparent',
                border: activeScenario === s.id ? '2px solid #1976d2' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: activeScenario === s.id ? 'bold' : 'normal',
                color: activeScenario === s.id ? '#1565c0' : 'inherit',
            } }, s.name)))),
        React.createElement("h4", { style: { borderBottom: '1px solid #eee', paddingBottom: '5px', margin: '0 0 10px 0' } }, "\u53C2\u6570\u914D\u7F6E"),
        React.createElement("div", { style: { marginBottom: '16px' } }, Object.keys(params).map(key => {
            const config = PARAM_LABELS[key] || { label: key, unit: '', min: -Infinity, max: Infinity };
            const err = errors[key];
            return (React.createElement("div", { key: key, style: { marginBottom: '8px' } },
                React.createElement("label", { style: { display: 'block', marginBottom: '2px', fontSize: '12px', color: '#555' } },
                    config.label,
                    " ",
                    config.unit && `(${config.unit})`),
                React.createElement("input", { type: "number", value: isNaN(params[key]) ? '' : params[key], onChange: e => handleChange(key, e.target.value), step: "any", style: {
                        width: '100%',
                        padding: '5px',
                        border: err ? '1px solid red' : '1px solid #ccc',
                        backgroundColor: err ? '#ffe6e6' : 'white',
                        boxSizing: 'border-box',
                        fontSize: '13px',
                    } }),
                err && React.createElement("div", { style: { color: 'red', fontSize: '11px', marginTop: '2px' } }, err)));
        })),
        React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            React.createElement("button", { onClick: handleReset, style: { padding: '8px', cursor: 'pointer', border: '1px solid #ccc', background: '#f5f5f5', borderRadius: '4px' } }, "\u4E00\u952E\u91CD\u7F6E"),
            React.createElement("button", { disabled: hasErrors, onClick: () => onExecute(activeScenario, params), style: {
                    padding: '12px',
                    cursor: hasErrors ? 'not-allowed' : 'pointer',
                    backgroundColor: hasErrors ? '#ccc' : '#1976d2',
                    color: 'white',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    borderRadius: '4px',
                } }, "\uD83D\uDE80 \u4EFF\u771F\u6267\u884C (\u751F\u6210 Notebook)"))));
};
//# sourceMappingURL=ControlPanel.js.map