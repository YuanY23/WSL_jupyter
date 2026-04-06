"use strict";
(self["webpackChunkjupyterlab_thermal_design"] = self["webpackChunkjupyterlab_thermal_design"] || []).push([["lib_index_js"],{

/***/ "./lib/MainWidget.js"
/*!***************************!*\
  !*** ./lib/MainWidget.js ***!
  \***************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ThermalDesignWorkbench: () => (/* binding */ ThermalDesignWorkbench)
/* harmony export */ });
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/widgets */ "webpack/sharing/consume/default/@lumino/widgets");
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_widgets__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _components_ControlPanel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./components/ControlPanel */ "./lib/components/ControlPanel.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _utils_NotebookGenerator__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils/NotebookGenerator */ "./lib/utils/NotebookGenerator.js");






class ControlPanelWidget extends _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.ReactWidget {
    constructor(app) {
        super();
        this.addClass('thermal-control-panel');
        this._app = app;
    }
    render() {
        return (react__WEBPACK_IMPORTED_MODULE_3___default().createElement(_components_ControlPanel__WEBPACK_IMPORTED_MODULE_2__.ControlPanel, { onExecute: async (scenarioId, params) => {
                try {
                    // 1. 生成自包含 notebook JSON
                    const nbJson = (0,_utils_NotebookGenerator__WEBPACK_IMPORTED_MODULE_4__.generateNotebook)(scenarioId, params);
                    // 2. 生成文件名
                    const name = (0,_utils_NotebookGenerator__WEBPACK_IMPORTED_MODULE_4__.getScenarioName)(scenarioId);
                    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
                    const filename = `热设计仿真_${name}_${timestamp}.ipynb`;
                    // 3. 确保目录存在
                    const dirName = '仿真结果归档';
                    const contentsManager = this._app.serviceManager.contents;
                    try {
                        await contentsManager.get(dirName);
                    }
                    catch (e) {
                        // 目录不存在，则创建一个新的文件夹并重命名
                        const newDir = await contentsManager.newUntitled({ type: 'directory', path: '' });
                        await contentsManager.rename(newDir.path, dirName);
                    }
                    // 4. 通过 ContentsManager 保存到指定工作区
                    const filePath = `${dirName}/${filename}`;
                    const fileModel = await contentsManager.save(filePath, {
                        type: 'notebook',
                        format: 'json',
                        content: nbJson
                    });
                    // 5. 在 JupyterLab 中打开该 notebook
                    await this._app.commands.execute('docmanager:open', {
                        path: fileModel.path
                    });
                }
                catch (e) {
                    (0,_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.showDialog)({
                        title: '生成 Notebook 失败',
                        body: e.message || '未知错误',
                        buttons: [_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.Dialog.okButton()]
                    });
                }
            } }));
    }
}
class ThermalDesignWorkbench extends _lumino_widgets__WEBPACK_IMPORTED_MODULE_0__.Widget {
    constructor(app) {
        super();
        this.addClass('thermal-design-workbench');
        const controlPanel = new ControlPanelWidget(app);
        controlPanel.node.style.height = '100%';
        controlPanel.node.style.overflow = 'auto';
        this.node.appendChild(controlPanel.node);
        // ReactWidget needs explicit attach for React rendering
        controlPanel.processMessage(_lumino_widgets__WEBPACK_IMPORTED_MODULE_0__.Widget.Msg.AfterAttach);
    }
}


/***/ },

/***/ "./lib/components/ControlPanel.js"
/*!****************************************!*\
  !*** ./lib/components/ControlPanel.js ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ControlPanel: () => (/* binding */ ControlPanel),
/* harmony export */   DEFAULT_PARAMS: () => (/* binding */ DEFAULT_PARAMS),
/* harmony export */   PARAM_LABELS: () => (/* binding */ PARAM_LABELS),
/* harmony export */   SCENARIOS: () => (/* binding */ SCENARIOS)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

// ============================================================
// 场景配置：4 大类别，共 10 个仿真场景
// ============================================================
const SCENARIOS = {
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
const DEFAULT_PARAMS = {
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
const PARAM_LABELS = {
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
const ControlPanel = ({ onExecute }) => {
    const categoryKeys = Object.keys(SCENARIOS);
    const [activeTab, setActiveTab] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(categoryKeys[0]);
    const [activeScenario, setActiveScenario] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(SCENARIOS[categoryKeys[0]][0].id);
    const [params, setParams] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({});
    const [errors, setErrors] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({});
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
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
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "thermal-control-panel-inner", style: { padding: '15px', overflowY: 'auto', height: '100%' } },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { style: { display: 'flex', flexWrap: 'wrap', borderBottom: '2px solid #1976d2', marginBottom: '12px' } }, categoryKeys.map(cat => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { key: cat, style: {
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
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { style: { marginBottom: '16px' } }, SCENARIOS[activeTab].map(s => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { key: s.id, onClick: () => setActiveScenario(s.id), style: {
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
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h4", { style: { borderBottom: '1px solid #eee', paddingBottom: '5px', margin: '0 0 10px 0' } }, "\u53C2\u6570\u914D\u7F6E"),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { style: { marginBottom: '16px' } }, Object.keys(params).map(key => {
            const config = PARAM_LABELS[key] || { label: key, unit: '', min: -Infinity, max: Infinity };
            const err = errors[key];
            return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { key: key, style: { marginBottom: '8px' } },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", { style: { display: 'block', marginBottom: '2px', fontSize: '12px', color: '#555' } },
                    config.label,
                    " ",
                    config.unit && `(${config.unit})`),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", { type: "number", value: isNaN(params[key]) ? '' : params[key], onChange: e => handleChange(key, e.target.value), step: "any", style: {
                        width: '100%',
                        padding: '5px',
                        border: err ? '1px solid red' : '1px solid #ccc',
                        backgroundColor: err ? '#ffe6e6' : 'white',
                        boxSizing: 'border-box',
                        fontSize: '13px',
                    } }),
                err && react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { style: { color: 'red', fontSize: '11px', marginTop: '2px' } }, err)));
        })),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { onClick: handleReset, style: { padding: '8px', cursor: 'pointer', border: '1px solid #ccc', background: '#f5f5f5', borderRadius: '4px' } }, "\u4E00\u952E\u91CD\u7F6E"),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { disabled: hasErrors, onClick: () => onExecute(activeScenario, params), style: {
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


/***/ },

/***/ "./lib/index.js"
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_mainmenu__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/mainmenu */ "webpack/sharing/consume/default/@jupyterlab/mainmenu");
/* harmony import */ var _jupyterlab_mainmenu__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_mainmenu__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @lumino/widgets */ "webpack/sharing/consume/default/@lumino/widgets");
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_lumino_widgets__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _MainWidget__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./MainWidget */ "./lib/MainWidget.js");




const CommandIDs = {
    openWorkbench: 'thermal-design:open-workbench'
};
/**
 * Initialization data for the jupyterlab-thermal-design extension.
 */
const plugin = {
    id: 'jupyterlab-thermal-design:plugin',
    description: 'Thermal Design Simulation',
    autoStart: true,
    requires: [_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__.ICommandPalette, _jupyterlab_mainmenu__WEBPACK_IMPORTED_MODULE_1__.IMainMenu],
    activate: (app, palette, mainMenu) => {
        console.log('JupyterLab extension jupyterlab-thermal-design is activated!');
        let widget;
        // Add command
        app.commands.addCommand(CommandIDs.openWorkbench, {
            label: '打开仿真工作台',
            execute: () => {
                if (!widget || widget.isDisposed) {
                    const content = new _MainWidget__WEBPACK_IMPORTED_MODULE_3__.ThermalDesignWorkbench(app);
                    content.id = 'thermal-design-workbench';
                    content.title.label = '热设计原理仿真工作台';
                    content.title.closable = true;
                    widget = new _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__.MainAreaWidget({ content });
                    widget.id = 'thermal-design-workbench-main';
                    widget.title.label = '热设计原理仿真工作台';
                    widget.title.closable = true;
                }
                if (!widget.isAttached) {
                    app.shell.add(widget, 'main');
                }
                app.shell.activateById(widget.id);
            }
        });
        // Add to palette
        palette.addItem({ command: CommandIDs.openWorkbench, category: 'Thermal Design' });
        // Add to main menu
        const thermalMenu = new _lumino_widgets__WEBPACK_IMPORTED_MODULE_2__.Menu({ commands: app.commands });
        thermalMenu.id = 'thermal-design-menu';
        thermalMenu.title.label = '热设计仿真系统';
        thermalMenu.addItem({ command: CommandIDs.openWorkbench });
        mainMenu.addMenu(thermalMenu);
    }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugin);


/***/ },

/***/ "./lib/utils/NotebookGenerator.js"
/*!****************************************!*\
  !*** ./lib/utils/NotebookGenerator.js ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   generateNotebook: () => (/* binding */ generateNotebook),
/* harmony export */   getScenarioName: () => (/* binding */ getScenarioName)
/* harmony export */ });
/**
 * NotebookGenerator.ts
 * ===================================================
 * 为每个仿真场景生成自包含的 .ipynb JSON。
 * 每个 notebook 包含:
 *   1. Markdown: 标题 + 物理模型 + 控制方程
 *   2. Code: 参数定义 (用户可修改)
 *   3. Code: 完整求解算法
 *   4. Code: matplotlib 可视化
 */
// 场景中文名称
const SCENARIO_NAMES = {
    steady_flat_plate: '一维稳态导热 · 无限大平板 (FDM)',
    steady_multilayer_plate: '一维稳态导热 · 多层复合平板 (FVM)',
    steady_cylindrical_wall: '一维稳态导热 · 圆筒壁径向导热 (FDM)',
    steady_straight_fin: '一维稳态导热 · 等截面直肋 (FVM)',
    transient_plate_const_temp: '一维瞬态导热 · 两侧恒温加热 (显式FDM)',
    transient_plate_const_flux: '一维瞬态导热 · 一侧恒定热流 (隐式FVM)',
    convection_laminar_plate: '对流换热 · 平板层流强制对流',
    convection_turbulent_plate: '对流换热 · 平板湍流强制对流',
    convection_natural_vertical: '对流换热 · 竖板自然 vertical',
    convection_internal_tube: '对流换热 · 圆管内强迫对流',
    radiation_parallel_plates: '热辐射 · 平行平板辐射换热',
    radiation_3surface: '热辐射 · 三表面空腔辐射',
    steady_internal_heat: '一维稳态导热 · 内热源平壁 (解析解)',
    steady_2d_plate: '二维稳态导热 · 矩形平板 (FDM)',
};
// ============================================================
//  每个场景的 Notebook 模板工厂
// ============================================================
function makeNotebook(title, cells) {
    // 在所有 cell 最前面插入 %matplotlib inline 和中文字体加载配置
    const setupCell = code(`%matplotlib inline
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import os

# 加载项目中自带的中文字体
font_path = os.path.join(os.getcwd(), 'SimHei.ttf')
if os.path.exists(font_path):
    fm.fontManager.addfont(font_path)
    plt.rcParams['font.sans-serif'] = ['SimHei']
    plt.rcParams['axes.unicode_minus'] = False`);
    return {
        cells: [setupCell, ...cells],
        metadata: {
            kernelspec: { display_name: 'Python 3 (ipykernel)', language: 'python', name: 'python3' },
            language_info: { name: 'python', version: '3.10.0', file_extension: '.py' }
        },
        nbformat: 4,
        nbformat_minor: 5
    };
}
function md(source) {
    return { cell_type: 'markdown', metadata: {}, source: source.split('\n').map(l => l + '\n') };
}
function code(source) {
    return { cell_type: 'code', execution_count: null, metadata: {}, outputs: [], source: source.split('\n').map(l => l + '\n') };
}
// ============================================================
//  场景 1: 无限大平板导热 (FDM)
// ============================================================
function gen_steady_flat_plate(params) {
    return makeNotebook('无限大平板导热', [
        md(`# 一维稳态导热 · 无限大平板 (有限差分法 FDM)

## 物理模型
一块厚度为 L 的无限大平板，左侧温度 $T_h$，右侧温度 $T_c$，导热系数 $k$ 为常数。

$$\\frac{d^2T}{dx^2} = 0 \\quad (0 < x < L)$$

## 解析解
$$T(x) = T_h + (T_c - T_h) \\cdot \\frac{x}{L}$$

## 数值方法
有限差分法 (FDM)：对内部节点 $i=1,...,N-2$，中心差分离散为三对角方程组 $A \\cdot T = b$。`),
        code(`import numpy as np
import matplotlib.pyplot as plt

# =============================
# 参数定义（可自由修改）
# =============================
L = ${params.thickness}          # 平板厚度 (m)
k = ${params.thermal_conductivity}        # 导热系数 (W/(m·K))
T_left = ${params.temp_left}     # 左侧温度 (°C)
T_right = ${params.temp_right}   # 右侧温度 (°C)
N = 50                           # 节点数`),
        code(`# =============================
# FDM 求解
# =============================
dx = L / (N - 1)
x = np.linspace(0, L, N)

# 组装三对角系数矩阵
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
T_analytical = T_left + (T_right - T_left) * x / L

# 误差
max_error = np.max(np.abs(T_numerical - T_analytical))
print(f"最大误差: {max_error:.2e} °C")
print(f"热流密度 q = k·ΔT/L = {k * (T_left - T_right) / L:.2f} W/m^2")`),
        code(`# =============================
# 可视化
# =============================
plt.figure(figsize=(10, 6))
plt.plot(x * 1000, T_numerical, 'bo-', markersize=4, label='FDM 数值解')
plt.plot(x * 1000, T_analytical, 'r--', linewidth=2, label='解析解')
plt.xlabel('位置 x (mm)')
plt.ylabel('温度 T (°C)')
plt.title('无限大平板一维稳态导热 — FDM 求解')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`)
    ]);
}
// ============================================================
//  场景 2: 多层复合平板导热 (FVM)
// ============================================================
function gen_steady_multilayer_plate(params) {
    return makeNotebook('多层复合平板导热', [
        md(`# 一维稳态导热 · 多层复合平板 (有限体积法 FVM)

## 物理模型
三层不同材料组成的复合平板，左侧温度 $T_h$，右侧温度 $T_c$。

## 关键处理
界面处导热系数取**调和平均**：
$$k_f = \\frac{2 k_L k_R}{k_L + k_R}$$

## 数值方法
FVM：将整体划分为控制体积，节点位于 CV 中心，组装 $[A]\\{T\\} = \\{b\\}$。`),
        code(`import numpy as np
import matplotlib.pyplot as plt

# =============================
# 参数定义（可自由修改）
# =============================
L1 = ${params.L1};  k1 = ${params.k1}     # 第1层: 厚度(m), 导热系数(W/(m·K))
L2 = ${params.L2};  k2 = ${params.k2}     # 第2层
L3 = ${params.L3};  k3 = ${params.k3}     # 第3层
T_left = ${params.temp_left}               # 左侧温度 (°C)
T_right = ${params.temp_right}             # 右侧温度 (°C)
n_per_layer = 20                           # 每层节点数`),
        code(`# =============================
# FVM 求解
# =============================
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
# 最后一个节点可能越界
k_nodes[k_nodes == 0] = layers[-1][1]

# 组装系数矩阵
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

T = np.linalg.solve(A, b)

# 热阻串联解析解
R_total = sum(L_l / k_l for L_l, k_l in layers)
q = (T_left - T_right) / R_total
print(f"热流密度 q = {q:.2f} W/m^2")
print(f"总热阻 R = {R_total:.6f} m²·K/W")`),
        code(`# =============================
# 可视化
# =============================
fig, ax = plt.subplots(figsize=(10, 6))
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
plt.show()`)
    ]);
}
// ============================================================
//  场景 3: 圆筒壁径向导热 (FDM)
// ============================================================
function gen_steady_cylindrical_wall(params) {
    return makeNotebook('圆筒壁径向导热', [
        md(`# 一维稳态导热 · 圆筒壁径向导热 (FDM)

## 物理模型
内半径 $r_i$, 外半径 $r_o$ 的圆筒壁，内壁温度 $T_i$, 外壁温度 $T_o$。

## 控制方程（柱坐标）
$$\\frac{d^2T}{dr^2} + \\frac{1}{r}\\frac{dT}{dr} = 0$$

## 解析解
$$T(r) = T_i + (T_o - T_i) \\cdot \\frac{\\ln(r/r_i)}{\\ln(r_o/r_i)}$$`),
        code(`import numpy as np
import matplotlib.pyplot as plt

# =============================
# 参数定义（可自由修改）
# =============================
r_inner = ${params.r_inner}      # 内半径 (m)
r_outer = ${params.r_outer}      # 外半径 (m)
k = ${params.thermal_conductivity}  # 导热系数 (W/(m·K))
T_inner = ${params.temp_inner}   # 内壁温度 (°C)
T_outer = ${params.temp_outer}   # 外壁温度 (°C)
N = 50                           # 节点数`),
        code(`# =============================
# FDM 求解（柱坐标差分）
# =============================
dr = (r_outer - r_inner) / (N - 1)
r = np.linspace(r_inner, r_outer, N)

A = np.zeros((N, N))
b = np.zeros(N)

# 边界条件
A[0, 0] = 1.0;    b[0] = T_inner
A[-1, -1] = 1.0;  b[-1] = T_outer

# 内部节点: d²T/dr² + (1/r)dT/dr = 0
for i in range(1, N - 1):
    ri = r[i]
    A[i, i - 1] = 1.0 / dr**2 - 1.0 / (2.0 * ri * dr)   # 西系数
    A[i, i]     = -2.0 / dr**2                              # 中心系数
    A[i, i + 1] = 1.0 / dr**2 + 1.0 / (2.0 * ri * dr)    # 东系数

T_numerical = np.linalg.solve(A, b)

# 解析解
T_analytical = T_inner + (T_outer - T_inner) * np.log(r / r_inner) / np.log(r_outer / r_inner)
max_error = np.max(np.abs(T_numerical - T_analytical))

# 单位长度热流
q_line = 2 * np.pi * k * (T_inner - T_outer) / np.log(r_outer / r_inner)
print(f"最大误差: {max_error:.4e} °C")
print(f"单位长度热流: {q_line:.2f} W/m")`),
        code(`# =============================
# 可视化
# =============================
plt.figure(figsize=(10, 6))
plt.plot(r * 1000, T_numerical, 'bo-', markersize=4, label='FDM 数值解')
plt.plot(r * 1000, T_analytical, 'r--', linewidth=2, label='解析解 (对数分布)')
plt.xlabel('半径 r (mm)')
plt.ylabel('温度 T (°C)')
plt.title('圆筒壁径向稳态导热 — FDM 求解')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`)
    ]);
}
// ============================================================
//  场景 4: 等截面直肋导热 (FVM)
// ============================================================
function gen_steady_straight_fin(params) {
    return makeNotebook('等截面直肋导热', [
        md(`# 一维稳态导热 · 等截面直肋 (FVM + 对流源项)

## 物理模型
长度 $L$、厚度 $t$、宽度 $w$ 的矩形截面直肋。肋根温度 $T_b$，环境温度 $T_\\infty$，对流换热系数 $h$。

## 控制方程
$$k A_c \\frac{d^2T}{dx^2} - h P (T - T_\\infty) = 0$$

## 肋片效率解析解
$$\\eta = \\frac{\\tanh(mL)}{mL}, \\quad m = \\sqrt{\\frac{hP}{kA_c}}$$`),
        code(`import numpy as np
import matplotlib.pyplot as plt

# =============================
# 参数定义（可自由修改）
# =============================
fin_L = ${params.fin_length}        # 肋片长度 (m)
fin_t = ${params.fin_thickness}     # 肋片厚度 (m)
fin_w = ${params.fin_width}         # 肋片宽度 (m)
k = ${params.thermal_conductivity}  # 导热系数 (W/(m·K))
h = ${params.h_conv}                # 对流换热系数 (W/(m²·K))
T_base = ${params.temp_base}        # 肋根温度 (°C)
T_inf = ${params.temp_ambient}      # 环境温度 (°C)
N = 50                              # 节点数`),
        code(`# =============================
# FVM 求解（含线性化源项）
# =============================
Ac = fin_t * fin_w           # 截面积
P = 2 * (fin_t + fin_w)     # 周长
dx = fin_L / N
x_nodes = np.array([(i + 0.5) * dx for i in range(N)])

A = np.zeros((N, N))
b = np.zeros(N)

for i in range(N):
    S_P = -h * P * dx / (k * Ac)  # 源项线性化系数
    S_u = h * P * dx * T_inf / (k * Ac)

    if i == 0:
        a_E = 1.0 / dx
        a_W_b = 1.0 / (dx / 2)
        A[i, i] = a_E + a_W_b - S_P
        A[i, i + 1] = -a_E
        b[i] = a_W_b * T_base + S_u
    elif i == N - 1:
        a_W = 1.0 / dx
        A[i, i] = a_W - S_P   # 绝热尖端: a_E = 0
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

# 解析解与肋片效率
m = np.sqrt(h * P / (k * Ac))
theta_b = T_base - T_inf
T_analytical = T_inf + theta_b * np.cosh(m * (fin_L - x_nodes)) / np.cosh(m * fin_L)
eta_analytical = np.tanh(m * fin_L) / (m * fin_L)

Q_actual = k * Ac * (T_base - T[0]) / (dx / 2)
Q_max = h * P * fin_L * theta_b
eta_numerical = Q_actual / Q_max if Q_max > 0 else 0

print(f"肋片效率 η (数值): {eta_numerical:.4f}")
print(f"肋片效率 η (解析): {eta_analytical:.4f}")
print(f"肋片散热量 Q = {Q_actual:.4f} W")`),
        code(`# =============================
# 可视化
# =============================
plt.figure(figsize=(10, 6))
plt.plot(x_nodes * 1000, T, 'bo-', markersize=4, label='FVM 数值解')
plt.plot(x_nodes * 1000, T_analytical, 'r--', linewidth=2, label='解析解')
plt.axhline(y=T_inf, color='gray', linestyle=':', label=f'环境温度 T∞={T_inf}°C')
plt.xlabel('沿肋片方向 x (mm)')
plt.ylabel('温度 T (°C)')
plt.title(f'等截面直肋温度分布 (η={eta_numerical:.4f})')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`)
    ]);
}
// ============================================================
//  场景 13: 圆管内强迫对流
// ============================================================
function gen_convection_internal_tube(params) {
    return makeNotebook('圆管内强迫对流', [
        md(`# 对流换热 · 圆管内强迫对流 (恒壁温)

## 物理模型
流体以流速 $u_m$ 进入直径 $D$、长度 $L$ 的圆管。管壁维持恒定温度 $T_s$。

## 控制方程
$$\\frac{dT_m}{dx} = \\frac{P h}{\\dot{m} c_p} (T_s - T_m)$$

## 沿程温度解析解
$$T_m(x) = T_s - (T_s - T_{m,i}) \\exp\\left(-\\frac{P h}{\\dot{m} c_p} x\\right)$$`),
        code(`import numpy as np
import matplotlib.pyplot as plt

# =============================
# 参数定义（可自由修改）
# =============================
L = ${params.tube_length}               # 管长 (m)
D = ${params.tube_diameter}              # 管径 (m)
u_m = ${params.velocity}             # 流速 (m/s)
T_mi = ${params.temp_inlet}            # 入口温度 (°C)
T_s = ${params.temp_wall}             # 管壁恒温 (°C)
k = ${params.fluid_k}               # 流体导热率 (W/(m·K))
nu = ${params.fluid_nu}              # 运动粘度 (m²/s)
Pr = ${params.fluid_Pr}              # Prandtl 数
rho = ${params.fluid_rho}             # 密度 (kg/m³)
cp = ${params.fluid_cp}              # 比热 (J/(kg·K))`),
        code(`# =============================
# 换热系数计算
# =============================
Re_D = u_m * D / nu
is_laminar = Re_D < 2300

if is_laminar:
    Nu_D = 3.66  # 圆管层流充分发展
    print(f"流态: 层流 (Re_D = {Re_D:.0f})")
else:
    # 采用 Dittus-Boelter 关联式
    n = 0.4 if T_s > T_mi else 0.3
    Nu_D = 0.023 * Re_D**0.8 * Pr**n
    print(f"流态: 湍流 (Re_D = {Re_D:.0f})")

h = Nu_D * k / D
print(f"Nu_D = {Nu_D:.2f}, h = {h:.2f} W/(m²·K)")`),
        code(`# =============================
# 沿程温度与换热量计算
# =============================
P = np.pi * D
A_c = np.pi * D**2 / 4
m_dot = rho * u_m * A_c

lam = (P * h) / (m_dot * cp)
x = np.linspace(0, L, 100)

T_m = T_s - (T_s - T_mi) * np.exp(-lam * x)
T_mo = T_m[-1]

q_total = m_dot * cp * (T_mo - T_mi)
lmtd = ((T_s - T_mi) - (T_s - T_mo)) / np.log((T_s - T_mi) / (T_s - T_mo)) if T_s != T_mo and T_s != T_mi else 0

print(f"出口温度 T_mo = {T_mo:.2f} °C")
print(f"总换热量 q = {q_total:.2f} W")
print(f"对数平均温差 LMTD = {lmtd:.2f} °C")`),
        code(`# =============================
# 可视化
# =============================
plt.figure(figsize=(10, 6))
plt.plot(x, T_m, 'b-', linewidth=2, label='流体平均温度 T_m(x)')
plt.axhline(y=T_s, color='r', linestyle='--', label=f'管壁温度 T_s={T_s}°C')
plt.xlabel('管长位置 x (m)')
plt.ylabel('温度 T (°C)')
plt.title('圆管内强迫对流沿程温度分布')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`)
    ]);
}
// ============================================================
//  场景 14: 三表面封闭空腔辐射
// ============================================================
function gen_radiation_3surface(params) {
    return makeNotebook('三表面空腔辐射', [
        md(`# 热辐射 · 三表面封闭空腔辐射 (含重辐射面)

## 物理模型
由三个表面组成的封闭系统，面1和面2具有恒定的温度 $T_1$, $T_2$ 和发射率 $\\varepsilon_1$, $\\varepsilon_2$。
面3为完全绝热的**重辐射面** (Reradiating surface, $q_3=0$)。

## 辐射网络阻力
系统净辐射传热量 $q$ 受三个阻力环节控制：
1. 面1的表面热阻: $R_{s1} = \\frac{1-\\varepsilon_1}{\\varepsilon_1 A_1}$
2. 面2的表面热阻: $R_{s2} = \\frac{1-\\varepsilon_2}{\\varepsilon_2 A_2}$
3. 空间阻力 $R_{space}$: 面1和面2直接辐射阻力 $1/(A_1 F_{12})$ 与经过面3的间接辐射阻力 $1/(A_1 F_{13}) + 1/(A_2 F_{23})$ 并联。

$$q = \\frac{E_{b1} - E_{b2}}{R_{s1} + R_{space} + R_{s2}}$$`),
        code(`import numpy as np
import matplotlib.pyplot as plt

# =============================
# 参数定义（可自由修改）
# =============================
T1_C = ${params.temp_1}
eps1 = ${params.emissivity_1}
A1 = ${params.area_1}

T2_C = ${params.temp_2}
eps2 = ${params.emissivity_2}
A2 = ${params.area_2}

F12 = ${params.view_factor_12}
sigma = 5.67e-8`),
        code(`# =============================
# 辐射网络计算
# =============================
T1 = T1_C + 273.15
T2 = T2_C + 273.15
Eb1 = sigma * T1**4
Eb2 = sigma * T2**4

# 角系数代数推导 (假设面为平面或凸面 F11=0, F22=0)
F13 = 1.0 - F12
F21 = F12 * A1 / A2
if F21 > 1.0: F21 = 1.0 # 强制修正防止非法几何
F23 = 1.0 - F21

# 网络热阻
Rs1 = (1 - eps1) / (eps1 * A1) if eps1 > 0 else 1e10
Rs2 = (1 - eps2) / (eps2 * A2) if eps2 > 0 else 1e10

R12 = 1.0 / (A1 * F12) if F12 > 0 else 1e10
R13 = 1.0 / (A1 * F13) if F13 > 0 else 1e10
R23 = 1.0 / (A2 * F23) if F23 > 0 else 1e10

R_space = 1.0 / ( (1.0 / R12) + 1.0 / (R13 + R23) )
R_total = Rs1 + R_space + Rs2

q1 = (Eb1 - Eb2) / R_total
J1 = Eb1 - q1 * Rs1
J2 = Eb2 + q1 * Rs2

# 面3有效辐射通过并联中点得出
J3 = (J1 / R13 + J2 / R23) / (1/R13 + 1/R23)
T3 = (J3 / sigma)**0.25 - 273.15

print(f"净换热量 q = {q1:.2f} W")
print(f"面1 有效辐射 J1 = {J1:.2f} W/m^2")
print(f"面2 有效辐射 J2 = {J2:.2f} W/m^2")
print(f"重辐射面 (面3) 平衡温度 T3 = {T3:.2f} °C")`),
        code(`# =============================
# 可视化：辐射力与节点电势(有效辐射)柱状图
# =============================
labels = ['面1 E_b', '面1 J_1', '重辐射面 J_3(E_b3)', '面2 J_2', '面2 E_b']
values = [Eb1, J1, J3, J2, Eb2]
colors = ['#ff9999', '#ffcc99', '#ffff99', '#99ccff', '#9999ff']

plt.figure(figsize=(10, 6))
bars = plt.bar(labels, values, color=colors, edgecolor='black', alpha=0.8)

for bar in bars:
    yval = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2, yval + (max(values)*0.01), 
             f'{yval:.0f}', ha='center', va='bottom', fontsize=10)

plt.ylabel('辐射能流率 (W/m^2)')
plt.title('三表面空腔内各节点辐射电势分布')
plt.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.show()`)
    ]);
}
// ============================================================
//  场景 5: 两侧恒温加热 (显式 FTCS)
// ============================================================
function gen_transient_plate_const_temp(params) {
    return makeNotebook('两侧恒温加热', [
        md(`# 一维瞬态导热 · 两侧恒温加热 (显式有限差分 FTCS)

## 物理模型
厚度 $L$ 的平板，初始匀温 $T_{init}$。$t=0$ 时两侧突然施加恒温 $T_s$。

$$\\frac{\\partial T}{\\partial t} = \\alpha \\frac{\\partial^2 T}{\\partial x^2}$$

## 显式格式 (FTCS)
$$T_i^{n+1} = T_i^n + Fo \\cdot (T_{i-1}^n - 2T_i^n + T_{i+1}^n)$$

**稳定性条件**: $Fo = \\alpha \\Delta t / \\Delta x^2 \\leq 0.5$`),
        code(`import numpy as np
import matplotlib.pyplot as plt

# =============================
# 参数定义（可自由修改）
# =============================
L = ${params.thickness}          # 平板厚度 (m)
alpha = ${params.alpha}          # 热扩散率 (m²/s)
T_init = ${params.temp_init}     # 初始温度 (°C)
T_s = ${params.temp_surface}     # 壁面温度 (°C)
time_total = ${params.time}      # 仿真总时间 (s)
N = 50                           # 空间节点数
n_snapshots = 5                  # 快照数`),
        code(`# =============================
# 显式 FTCS 时间推进
# =============================
dx = L / (N - 1)
x = np.linspace(0, L, N)

# 稳定性控制
Fo_target = 0.4
dt = Fo_target * dx**2 / alpha
Fo = alpha * dt / dx**2
n_steps = int(np.ceil(time_total / dt))
dt = time_total / n_steps
Fo = alpha * dt / dx**2

print(f"网格 Fourier 数 Fo = {Fo:.4f} (< 0.5 ✓)")
print(f"时间步长 Δt = {dt:.6f} s, 总步数 = {n_steps}")

# 初始化
T = np.full(N, T_init)
T[0] = T_s; T[-1] = T_s

snap_indices = [int(round(i * n_steps / n_snapshots)) for i in range(1, n_snapshots + 1)]
snapshots = []

for step in range(1, n_steps + 1):
    T_new = T.copy()
    for i in range(1, N - 1):
        T_new[i] = T[i] + Fo * (T[i-1] - 2*T[i] + T[i+1])
    T = T_new
    if step in snap_indices:
        snapshots.append((round(step * dt, 4), T.copy()))

print(f"中心温度 T_center = {T[N//2]:.2f} °C")
print(f"全局 Fo = α·t/L² = {alpha * time_total / L**2:.4f}")`),
        code(`# =============================
# 可视化 — 多时刻温度分布
# =============================
plt.figure(figsize=(10, 6))
for t_snap, T_snap in snapshots:
    plt.plot(x * 1000, T_snap, '-o', markersize=2, label=f't = {t_snap:.1f} s')
plt.xlabel('位置 x (mm)')
plt.ylabel('温度 T (°C)')
plt.title('平板两侧恒温加热 — 温度随时间演化')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`)
    ]);
}
// ============================================================
//  场景 6: 一侧恒定热流 (隐式 FVM)
// ============================================================
function gen_transient_plate_const_flux(params) {
    return makeNotebook('一侧恒定热流', [
        md(`# 一维瞬态导热 · 一侧恒定热流 (全隐式有限体积法)

## 物理模型
平板左侧施加恒热流 $q_s$，右侧绝热。初始匀温 $T_{init}$。

## 为什么用隐式格式？
隐式格式**无条件稳定**（$Fo$ 可超过 0.5），适合大步长计算。

## 每个时间步求解
$$[A]\\{T\\}^{n+1} = \\{b\\}$$`),
        code(`import numpy as np
import matplotlib.pyplot as plt

# =============================
# 参数定义（可自由修改）
# =============================
L = ${params.thickness}                     # 平板厚度 (m)
k = ${params.thermal_conductivity}          # 导热系数 (W/(m·K))
rho = ${params.density}                     # 密度 (kg/m³)
cp = ${params.specific_heat}                # 比热 (J/(kg·K))
q_s = ${params.heat_flux}                   # 左侧热流密度 (W/m^2)
T_init = ${params.temp_init}                # 初始温度 (°C)
time_total = ${params.time}                 # 仿真总时间 (s)
N = 50; n_steps = 200`),
        code(`# =============================
# 隐式 FVM 求解
# =============================
alpha = k / (rho * cp)
dx = L / N
dt = time_total / n_steps
Fo = alpha * dt / dx**2
x_nodes = np.array([(i + 0.5) * dx for i in range(N)])

print(f"网格 Fo = {Fo:.4f} {'(> 0.5, 显式会发散!)' if Fo > 0.5 else ''}")
print(f"隐式格式: 无条件稳定 ✓")

# 组装系数矩阵 (每步不变)
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

# 时间推进
T = np.full(N, T_init)
snapshots = []
snap_indices = set(int(round(i * n_steps / 5)) for i in range(1, 6))

for step in range(1, n_steps + 1):
    b_vec = a_P0 * T.copy()
    b_vec[0] += q_s
    T = np.linalg.solve(A, b_vec)
    if step in snap_indices:
        snapshots.append((round(step * dt, 2), T.copy()))

# 能量守恒验证
Q_in = q_s * time_total
Q_stored = rho * cp * L * (np.mean(T) - T_init)
print(f"热面温度: {T[0]:.2f} °C, 绝热面温度: {T[-1]:.2f} °C")
print(f"能量守恒误差: {abs(Q_in - Q_stored)/Q_in*100:.4f}%")`),
        code(`# =============================
# 可视化
# =============================
plt.figure(figsize=(10, 6))
for t_snap, T_snap in snapshots:
    plt.plot(x_nodes * 1000, T_snap, '-o', markersize=2, label=f't = {t_snap} s')
plt.xlabel('位置 x (mm)')
plt.ylabel('温度 T (°C)')
plt.title('一侧恒定热流加热 — 温度随时间演化 (隐式FVM)')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`)
    ]);
}
// ============================================================
//  场景 7: 平板层流强制对流
// ============================================================
function gen_convection_laminar_plate(params) {
    return makeNotebook('平板层流强制对流', [
        md(`# 对流换热 · 平板层流强制对流

## 物理模型
均匀来流 ($U_\\infty$, $T_\\infty$) 沿等温平板流动，$Re_L < 5 \\times 10^5$（层流）。

## 经验关联式 (Blasius / Pohlhausen)
$$Nu_x = 0.332 \\cdot Re_x^{1/2} \\cdot Pr^{1/3}$$
$$\\bar{Nu}_L = 0.664 \\cdot Re_L^{1/2} \\cdot Pr^{1/3}$$

**重要关系**: $\\bar{h} = 2 \\cdot h_x|_{x=L}$`),
        code(`import numpy as np
import matplotlib.pyplot as plt

# =============================
# 参数定义（可自由修改）
# =============================
L = ${params.plate_length}           # 平板长度 (m)
U_inf = ${params.velocity}           # 来流速度 (m/s)
T_w = ${params.temp_wall}            # 壁面温度 (°C)
T_inf = ${params.temp_fluid}         # 来流温度 (°C)
k_f = ${params.fluid_k}             # 流体导热系数 (W/(m·K))
nu = ${params.fluid_nu}             # 运动粘度 (m²/s)
Pr = ${params.fluid_Pr}             # Prandtl 数`),
        code(`# =============================
# 计算
# =============================
Re_L = U_inf * L / nu
print(f"Re_L = {Re_L:.0f} {'✓ 层流' if Re_L < 5e5 else '✗ 请用湍流模型'}")

x = np.linspace(L / 200, L, 200)
Re_x = U_inf * x / nu
Nu_x = 0.332 * Re_x**0.5 * Pr**(1/3)
h_x = Nu_x * k_f / x
delta = 5.0 * x / Re_x**0.5           # 速度边界层
delta_t = delta / Pr**(1/3)           # 热边界层

# 平均值
Nu_L = 0.664 * Re_L**0.5 * Pr**(1/3)
h_avg = Nu_L * k_f / L
Q_total = h_avg * L * (T_w - T_inf)

print(f"平均 Nu_L = {Nu_L:.2f}")
print(f"平均 h = {h_avg:.4f} W/(m²·K)")
print(f"h_avg / h_x(L) = {h_avg / h_x[-1]:.4f} (理论值=2)")
print(f"单位宽度换热量 Q = {Q_total:.4f} W/m")`),
        code(`# =============================
# 可视化
# =============================
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

ax1.plot(x * 1000, h_x, 'b-', linewidth=2)
ax1.axhline(y=h_avg, color='r', linestyle='--', label=f'h_avg = {h_avg:.3f}')
ax1.set_xlabel('x (mm)')
ax1.set_ylabel('h_x (W/(m²·K))')
ax1.set_title('局部换热系数分布')
ax1.legend()
ax1.grid(True, alpha=0.3)

ax2.plot(x * 1000, delta * 1000, 'b-', label='速度边界层 δ')
ax2.plot(x * 1000, delta_t * 1000, 'r--', label='热边界层 δ_t')
ax2.set_xlabel('x (mm)')
ax2.set_ylabel('厚度 (mm)')
ax2.set_title('边界层厚度')
ax2.legend()
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()`)
    ]);
}
// ============================================================
//  场景 8: 平板湍流强制对流
// ============================================================
function gen_convection_turbulent_plate(params) {
    return makeNotebook('平板湍流强制对流', [
        md(`# 对流换热 · 平板湍流强制对流 (混合边界层)

## 物理模型
$Re_L > 5 \\times 10^5$，前段层流 + 后段湍流的混合边界层。

## 关联式
- 层流区: $Nu_x = 0.332 Re_x^{1/2} Pr^{1/3}$
- 湍流区: $Nu_x = 0.0296 Re_x^{4/5} Pr^{1/3}$
- 混合平均: $\\bar{Nu}_L = (0.037 Re_L^{4/5} - 871) Pr^{1/3}$`),
        code(`import numpy as np
import matplotlib.pyplot as plt

# =============================
# 参数定义（可自由修改）
# =============================
L = ${params.plate_length}           # 平板长度 (m)
U_inf = ${params.velocity}           # 来流速度 (m/s)
T_w = ${params.temp_wall}            # 壁面温度 (°C)
T_inf = ${params.temp_fluid}         # 来流温度 (°C)
k_f = ${params.fluid_k}             # 流体导热系数 (W/(m·K))
nu = ${params.fluid_nu}             # 运动粘度 (m²/s)
Pr = ${params.fluid_Pr}             # Prandtl 数
Re_cr = 5e5                          # 临界 Reynolds 数`),
        code(`# =============================
# 计算
# =============================
Re_L = U_inf * L / nu
x_cr = Re_cr * nu / U_inf
print(f"Re_L = {Re_L:.0f}")
print(f"转捩位置 x_cr = {x_cr:.4f} m ({x_cr/L*100:.1f}% 板长)")

x = np.linspace(L / 300, L, 300)
Re_x = U_inf * x / nu
h_x = np.zeros_like(x)

for i in range(len(x)):
    if Re_x[i] < Re_cr:
        Nu = 0.332 * Re_x[i]**0.5 * Pr**(1/3)
    else:
        Nu = 0.0296 * Re_x[i]**0.8 * Pr**(1/3)
    h_x[i] = Nu * k_f / x[i]

# 混合平均
Nu_mixed = (0.037 * Re_L**0.8 - 871) * Pr**(1/3)
h_mixed = Nu_mixed * k_f / L
Nu_turb = 0.037 * Re_L**0.8 * Pr**(1/3)
h_turb = Nu_turb * k_f / L

print(f"混合 Nu = {Nu_mixed:.2f},  h = {h_mixed:.4f} W/(m²·K)")
print(f"纯湍流 Nu = {Nu_turb:.2f}, h = {h_turb:.4f} W/(m²·K)")
print(f"混合/纯湍流 比率 = {h_mixed/h_turb:.4f}")`),
        code(`# =============================
# 可视化
# =============================
plt.figure(figsize=(10, 6))
plt.plot(x * 1000, h_x, 'b-', linewidth=2)
plt.axvline(x=x_cr * 1000, color='red', linestyle=':', label=f'转捩点 x_cr={x_cr*1000:.0f}mm')
plt.axhline(y=h_mixed, color='green', linestyle='--', label=f'混合平均 h={h_mixed:.3f}')
plt.xlabel('位置 x (mm)')
plt.ylabel('局部换热系数 h_x (W/(m²·K))')
plt.title('平板混合边界层 — 层流→湍流转捩')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`)
    ]);
}
// ============================================================
//  场景 9: 竖板自然对流
// ============================================================
function gen_convection_natural_vertical(params) {
    return makeNotebook('竖板自然对流', [
        md(`# 对流换热 · 竖板自然对流 (Churchill-Chu 关联式)

## 物理模型
高度 $H$ 的垂直等温平板，壁面温度 $T_w$，置于温度 $T_\\infty$ 的静止流体中。

## 关键参数
- $Gr_H = g \\beta \\Delta T H^3 / \\nu^2$  (Grashof 数)
- $Ra_H = Gr_H \\cdot Pr$  (Rayleigh 数)

## Churchill-Chu 全域公式
$$\\bar{Nu}_H = \\left\\{ 0.825 + \\frac{0.387 Ra_H^{1/6}}{[1+(0.492/Pr)^{9/16}]^{8/27}} \\right\\}^2$$

流动判据: $Ra < 10^9$ 为层流, $Ra > 10^9$ 为湍流。`),
        code(`import numpy as np
import matplotlib.pyplot as plt

# =============================
# 参数定义（可自由修改）
# =============================
H = ${params.plate_height}       # 板高 (m)
T_w = ${params.temp_wall}        # 壁面温度 (°C)
T_inf = ${params.temp_ambient}   # 环境温度 (°C)
k_f = ${params.fluid_k}         # 流体导热系数 (W/(m·K))
nu = ${params.fluid_nu}         # 运动粘度 (m²/s)
Pr = ${params.fluid_Pr}         # Prandtl 数
g = 9.81                         # 重力加速度 (m/s²)`),
        code(`# =============================
# 计算
# =============================
T_film = (T_w + T_inf) / 2
beta = 1.0 / (T_film + 273.15)  # 理想气体体积膨胀系数
dT = abs(T_w - T_inf)

Gr_H = g * beta * dT * H**3 / nu**2
Ra_H = Gr_H * Pr

f_Pr = (1 + (0.492 / Pr)**(9/16))**(8/27)
Nu_H = (0.825 + 0.387 * Ra_H**(1/6) / f_Pr)**2
h_avg = Nu_H * k_f / H

flow = "层流" if Ra_H < 1e9 else "湍流"
print(f"Ra_H = {Ra_H:.4e} → {flow}")
print(f"Nu_H = {Nu_H:.2f}")
print(f"h_avg = {h_avg:.4f} W/(m²·K)")

# 沿板高分布
x = np.linspace(H / 100, H, 100)
Ra_x = g * beta * dT * x**3 / nu**2 * Pr
Nu_x = (0.825 + 0.387 * Ra_x**(1/6) / f_Pr)**2
h_x = Nu_x * k_f / x`),
        code(`# =============================
# 可视化
# =============================
plt.figure(figsize=(10, 6))
plt.plot(x * 1000, h_x, 'b-', linewidth=2)
plt.axhline(y=h_avg, color='r', linestyle='--', label=f'平均 h = {h_avg:.3f}')
plt.xlabel('沿板高位置 x (mm)')
plt.ylabel('局部换热系数 h_x (W/(m²·K))')
plt.title(f'竖板自然对流 — {flow} (Ra = {Ra_H:.2e})')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`)
    ]);
}
// ============================================================
//  场景 10: 平行平板辐射换热
// ============================================================
function gen_radiation_parallel_plates(params) {
    return makeNotebook('平行平板辐射换热', [
        md(`# 热辐射 · 两无限大平行平板间辐射换热

## 物理模型
两块无限大平行平板，温度 $T_1$, $T_2$，发射率 $\\varepsilon_1$, $\\varepsilon_2$。

## 净辐射换热
$$q_{12} = \\frac{\\sigma (T_1^4 - T_2^4)}{1/\\varepsilon_1 + 1/\\varepsilon_2 - 1}$$

## 遮热板效果
插入 $N$ 块遮热板（发射率 $\\varepsilon_s$）后：
$$q = \\frac{\\sigma (T_1^4 - T_2^4)}{(1/\\varepsilon_1 + 1/\\varepsilon_2 - 1) + N(2/\\varepsilon_s - 1)}$$`),
        code(`import numpy as np
import matplotlib.pyplot as plt

# =============================
# 参数定义（可自由修改）
# =============================
T1_C = ${params.temp_plate1}               # 板1温度 (°C)
T2_C = ${params.temp_plate2}               # 板2温度 (°C)
eps1 = ${params.emissivity1}               # 板1发射率
eps2 = ${params.emissivity2}               # 板2发射率
n_shield = ${params.n_shield}              # 遮热板数量
eps_s = ${params.emissivity_shield}        # 遮热板发射率
sigma = 5.67e-8                            # Stefan-Boltzmann 常数`),
        code(`# =============================
# 计算
# =============================
T1 = T1_C + 273.15
T2 = T2_C + 273.15

eps_eff = 1 / (1/eps1 + 1/eps2 - 1)
q_no_shield = sigma * eps_eff * (T1**4 - T2**4)
q_blackbody = sigma * (T1**4 - T2**4)
h_r = sigma * eps_eff * (T1**2 + T2**2) * (T1 + T2)

print(f"等效发射率 ε_eff = {eps_eff:.4f}")
print(f"净辐射热流 q = {q_no_shield:.2f} W/m^2")
print(f"黑体极限 q_bb = {q_blackbody:.2f} W/m^2")
print(f"等效辐射换热系数 h_r = {h_r:.4f} W/(m²·K)")

if n_shield > 0:
    denom = (1/eps1 + 1/eps2 - 1) + n_shield * (2/eps_s - 1)
    q_shield = sigma * (T1**4 - T2**4) / denom
    reduction = (1 - q_shield / q_no_shield) * 100
    print(f"\\n{n_shield}块遮热板后 q = {q_shield:.2f} W/m^2")
    print(f"减热率 = {reduction:.2f}%")`),
        code(`# =============================
# 可视化 — 发射率敏感性分析
# =============================
eps_range = np.linspace(0.05, 1.0, 50)
q_vs_eps = np.array([sigma * (T1**4 - T2**4) / (1/e + 1/eps2 - 1) for e in eps_range])

plt.figure(figsize=(10, 6))
plt.plot(eps_range, q_vs_eps / 1000, 'b-', linewidth=2)
plt.axvline(x=eps1, color='r', linestyle='--', label=f'当前 ε₁={eps1}')
plt.xlabel('板1发射率 ε₁')
plt.ylabel('净辐射热流 q (kW/m^2)')
plt.title('发射率对辐射换热的影响')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`)
    ]);
}
// ============================================================
//  场景 11: 平壁内热源稳态导热
// ============================================================
function gen_steady_internal_heat(params) {
    return makeNotebook('内热源稳态导热', [
        md(`# 一维稳态导热 · 具有内热源的大平壁 (解析解)

## 物理模型
一块厚度为 L 的无限大平板，导热系数 $k$，内部存在均匀内热源 $q_v$ ($W/m^3$)。
两侧边界温度为 $T_1$ 和 $T_2$。

## 控制方程
$$k \\frac{d^2T}{dx^2} + q_v = 0$$

## 解析解
$$T(x) = -\\frac{q_v}{2k}x^2 + \\left(\\frac{T_2 - T_1}{L} + \\frac{q_v L}{2k}\\right)x + T_1$$`),
        code(`import numpy as np
import matplotlib.pyplot as plt

# =============================
# 参数定义（可自由修改）
# =============================
L = ${params.thickness}          # 平板厚度 (m)
k = ${params.thermal_conductivity}        # 导热系数 (W/(m·K))
qv = ${params.internal_heat_rate}      # 内热源强度 (W/m^3)
T1 = ${params.temp_left}     # 左侧温度 (°C)
T2 = ${params.temp_right}   # 右侧温度 (°C)
N = ${params.n_nodes}                           # 节点数`),
        code(`# =============================
# 解析解计算
# =============================
x = np.linspace(0, L, N)

C1 = (T2 - T1) / L + (qv * L) / (2 * k)
T = (-qv / (2 * k)) * x**2 + C1 * x + T1

x_ext = C1 * k / qv if qv != 0 else 0
T_ext = (-qv / (2 * k)) * x_ext**2 + C1 * x_ext + T1 if qv != 0 else max(T1, T2)

if 0 <= x_ext <= L:
    print(f"极值温度出现在 x = {x_ext:.4f} m, 为 {T_ext:.2f} °C")
else:
    print("抛物线极值点落在平板外部。")

print(f"左侧热流密度(向右为正): {k * C1:.2f} W/m^2")
print(f"右侧热流密度(向外为负): {-k * ((-qv / k) * L + C1):.2f} W/m^2")`),
        code(`# =============================
# 可视化
# =============================
plt.figure(figsize=(10, 6))
plt.plot(x * 1000, T, 'ro-', markersize=3, label='内热源温度分布')
plt.xlabel('位置 x (mm)')
plt.ylabel('温度 T (°C)')
plt.title('一维具有均匀内热源平壁稳态导热')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`)
    ]);
}
// ============================================================
//  场景 12: 二维矩形平板稳态导热
// ============================================================
function gen_steady_2d_plate(params) {
    return makeNotebook('二维矩形平板稳态导热', [
        md(`# 二维稳态导热 · 矩形平板 (基于 FDM)

## 物理模型
一块长为 L，宽为 W 的矩形平板。四周分别维持恒定的边界温度：上 ($T_{top}$)、下 ($T_{bottom}$)、左 ($T_{left}$)、右 ($T_{right}$)。

## 控制方程 (无内热源稳态 Laplace 方程)
$$\\frac{\\partial^2 T}{\\partial x^2} + \\frac{\\partial^2 T}{\\partial y^2} = 0$$

## 数值方法 (五点差分格式)
用中心差分解出离散方程组成线性方程组求解。`),
        code(`import numpy as np
import matplotlib.pyplot as plt

# =============================
# 参数定义（可自由修改）
# =============================
L = ${params.length}          # 平板长度 (m)
W = ${params.width}          # 平板宽度 (m)
T_top = ${params.temp_top}     # 上侧温度 (°C)
T_bottom = ${params.temp_bottom}   # 下侧温度 (°C)
T_left = ${params.temp_left}     # 左侧温度 (°C)
T_right = ${params.temp_right}   # 右侧温度 (°C)
nx = ${params.nx}                # x 方向节点数
ny = ${params.ny}                # y 方向节点数`),
        code(`# =============================
# FDM 数值求解
# =============================
dx = L / (nx - 1)
dy = W / (ny - 1)
dx2, dy2 = dx**2, dy**2
denom = 2 * (dx2 + dy2)

# 网格展开为一维向量求解
n_total = nx * ny
A = np.zeros((n_total, n_total))
b = np.zeros(n_total)

def get_idx(i, j):
    return i + j * nx

for j in range(ny):
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

# 角点美化平滑
T_mat[0, 0] = (T_bottom + T_left) / 2
T_mat[0, nx-1] = (T_bottom + T_right) / 2
T_mat[ny-1, 0] = (T_top + T_left) / 2
T_mat[ny-1, nx-1] = (T_top + T_right) / 2

print(f"平板中心点温度: {T_mat[ny//2, nx//2]:.2f} °C")
print(f"四面边界对中心的交汇影响，最大温度 {np.max(T_mat):.2f}°C, 最小 {np.min(T_mat):.2f}°C")`),
        code(`# =============================
# 可视化 (2D 热力图 Heatmap)
# =============================
x_coords = np.linspace(0, L, nx)
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
plt.show()`)
    ]);
}
// ============================================================
//  公共导出函数
// ============================================================
const GENERATORS = {
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
function generateNotebook(scenarioId, params) {
    const gen = GENERATORS[scenarioId];
    if (!gen) {
        throw new Error(`未知场景 ID: ${scenarioId}`);
    }
    return gen(params);
}
function getScenarioName(scenarioId) {
    return SCENARIO_NAMES[scenarioId] || scenarioId;
}


/***/ }

}]);
//# sourceMappingURL=lib_index_js.f650acbc008dd95039ef.js.map