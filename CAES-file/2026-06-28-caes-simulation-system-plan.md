# 压缩空气储能仿真 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 SimLab 官方热力建模示例插件中新增“压缩空气储能仿真”，生成一个基于 Python、CoolProp 变比热物性、多设备耦合的 AA-CAES 系统级 process Notebook。

**Architecture:** 新功能放在 `jupyterlab-official-thermal-examples` 插件下，与现有 CSP 官方示例并列。前端页面提供官方示例选择和关键参数输入，文件服务按示例类型生成 Notebook；CAES Notebook 内部按“参数层、物性层、设备模型层、状态机求解层、可视化层、结果分析层”展开，保证代码可见、参数可调、过程可解释。

**Tech Stack:** TypeScript + React + JupyterLab extension；Notebook 计算使用 Python、NumPy、SciPy、Matplotlib、CoolProp；测试使用现有 Node assert 测试方式和 TypeScript 编译。

---

## 1. Scope Decisions

本计划实现的 CAES 模型是“更真实但仍适合代码可视化”的系统级原理仿真，不做三维 CFD，不做工业压缩机全 map，不做商业电站经济性平台。

模型采用先进绝热压缩空气储能 AA-CAES 流程：

```text
环境空气
  -> 多级压缩机
  -> 级间冷却/压缩热回收
  -> 高压储气罐
  -> 热储能 TES 加热
  -> 多级膨胀机
  -> 发电机输出
```

核心模型深度：

- 空气物性：优先使用 CoolProp 获取 `cp(T,p)`、`h(T,p)`、`s(T,p)`、`rho(T,p)`，Notebook 中显式展示物性函数；若 CoolProp 不可用，抛出中文安装提示，而不是静默退化。
- 压缩机：2 到 4 级多级压缩，等压比分配，逐级计算出口温度、压缩功、压缩热。
- 换热器：采用有效度模型，显示级间冷却、后冷却和放电前加热的热量交换。
- 储气罐：0D 集中参数非稳态模型，质量守恒和能量守恒同时推进，压力、温度、质量随时间变化。
- TES：集中参数热储能模型，跟踪储热量、等效温度、充热和放热过程。
- 膨胀机：2 到 4 级多级膨胀，等压比分配，逐级计算输出功和出口温度。
- 运行状态机：充电、静置、放电三个阶段，展示 CAES 完整 process。
- 结果输出：压力、温度、质量、功率、储热量、效率、能量流和关键指标。

不纳入本次实现的内容：

- 三维储气库空间温度场。
- 管网瞬态流动 CFD。
- 真实压缩机/膨胀机厂商 map。
- 多目标优化器和经济性数据库。
- Julia 主实现。

## 2. File Structure

### Create

- `jupyterlab-official-thermal-examples/src/caes/caesNotebookGenerator.ts`
  - 定义 CAES 配置类型、默认配置、参数绑定元数据、Notebook 生成器和文件名生成函数。

- `jupyterlab-official-thermal-examples/tests/caes-example.test.js`
  - 验证生成的 CAES Notebook 包含完整 process、CoolProp 物性模型、参数绑定、阶段状态机、关键结果和安全文件名。

### Modify

- `Dockerfile-nbgrader`
  - 在 Python 科学计算依赖中加入 `CoolProp`，保证生成的 CAES Notebook 可直接运行。

- `jupyterlab-official-thermal-examples/src/components/OfficialThermalExamplesApp.tsx`
  - 将当前单一 CSP 页面改为官方示例选择页面，新增“压缩空气储能仿真”配置面板。

- `jupyterlab-official-thermal-examples/src/MainWidget.tsx`
  - 将 `onGenerate` 从只接收 CSP config 改为接收官方示例联合类型。

- `jupyterlab-official-thermal-examples/src/notebook/fileService.ts`
  - 新增 `saveAndOpenCaesNotebook`，保留现有 `saveAndOpenCspNotebook`。

- `jupyterlab-official-thermal-examples/src/index.ts`
  - 菜单名称保持“官方热力建模示例”，不新增顶层菜单；CAES 放在插件页面内部。

- `jupyterlab-official-thermal-examples/tests/csp-example.test.js`
  - 保持 CSP 测试，同时确认官方示例插件仍能生成原有 CSP Notebook。

- `jupyterlab-official-thermal-examples/package.json`
  - 将 `test` 脚本扩展为同时运行 CSP 和 CAES 两个测试文件。

- `jupyterlab-official-thermal-examples/style/base.css`
  - 给官方示例选择 tabs、CAES 参数面板、process 链路和指标卡补充样式。

## 3. CAES Notebook Content Contract

生成的 Notebook 必须包含 12 个部分，保持当前平台“代码可视化”的结构一致：

```text
1. 工艺流程说明
2. 建模假设
3. 参数说明表
4. 数学模型与控制方程
5. 计算环境
6. 参数层代码
7. 物性层代码
8. 设备模型层代码
9. 系统状态机与求解层代码
10. 结果可视化代码
11. 关键结果输出
12. 结果分析提示
```

Notebook 中必须暴露以下 Python 函数名，方便论文和测试引用：

```python
air_props(T, p)
compressor_stage(T_in, p_in, p_out, eta_isentropic, mass_flow)
cooler(T_hot_in, T_cold_in, heat_capacity_hot, heat_capacity_cold, effectiveness)
storage_tank_step(state, m_in, h_in, m_out, dt)
tes_step(tes_state, heat_charge, heat_discharge, dt)
expander_stage(T_in, p_in, p_out, eta_isentropic, mass_flow)
run_caes_cycle()
```

Notebook 中必须暴露以下结果数组：

```python
pressure_bar
air_temperature_c
air_mass_kg
tes_temperature_c
compressor_power_mw
expander_power_mw
net_power_mw
mode_by_step
round_trip_efficiency
```

## 4. Implementation Tasks

### Task 1: Add CAES Notebook Generator Tests

**Files:**
- Create: `jupyterlab-official-thermal-examples/tests/caes-example.test.js`
- Modify: `jupyterlab-official-thermal-examples/package.json`

- [ ] **Step 1: Write the failing CAES generator test**

Create `jupyterlab-official-thermal-examples/tests/caes-example.test.js` with this structure:

```javascript
const assert = require('node:assert/strict');

const {
  CAES_PARAMETER_BINDINGS,
  DEFAULT_CAES_CONFIG,
  generateCaesNotebook,
  makeCaesNotebookFilename
} = require('../lib/caes/caesNotebookGenerator.js');

function sourcesOf(notebook) {
  return notebook.cells.map(cell => Array.isArray(cell.source) ? cell.source.join('') : cell.source);
}

function testNotebookContainsFullCaesProcess() {
  const notebook = generateCaesNotebook(DEFAULT_CAES_CONFIG);
  const allSource = sourcesOf(notebook).join('\n');

  assert.equal(notebook.nbformat, 4);
  assert.ok(allSource.includes('压缩空气储能仿真'));
  assert.ok(allSource.includes('AA-CAES'));
  assert.ok(allSource.includes('CoolProp.CoolProp'));
  assert.ok(allSource.includes('air_props'));
  assert.ok(allSource.includes('compressor_stage'));
  assert.ok(allSource.includes('storage_tank_step'));
  assert.ok(allSource.includes('tes_step'));
  assert.ok(allSource.includes('expander_stage'));
  assert.ok(allSource.includes('run_caes_cycle'));
  assert.ok(allSource.includes('mode_by_step.append(mode)'));
  assert.ok(allSource.includes('round_trip_efficiency'));
  assert.ok(!allSource.includes('CFD'));
  assert.ok(!allSource.includes('three_dimensional'));
}

function testNotebookIncludesParameterBindingMetadata() {
  const notebook = generateCaesNotebook(DEFAULT_CAES_CONFIG);
  const bindings = notebook.metadata.simulation_param_bindings;

  assert.equal(bindings.version, 1);
  assert.equal(bindings.title, '参数层代码');
  assert.deepEqual(Object.keys(bindings.parameters).sort(), Object.keys(CAES_PARAMETER_BINDINGS).sort());
  assert.equal(bindings.parameters.max_storage_pressure_bar.type, 'slider');
  assert.equal(bindings.parameters.storage_volume_m3.type, 'slider');
  assert.equal(bindings.parameters.compressor_stages.type, 'slider');
  assert.equal(bindings.parameters.expander_stages.type, 'slider');
  assert.equal(bindings.parameters.operation_profile.type, 'dropdown');
  assert.ok(bindings.parameters.operation_profile.options.includes('charge_hold_discharge'));
}

function testGeneratedNotebookUsesDynamicStateArrays() {
  const notebook = generateCaesNotebook(DEFAULT_CAES_CONFIG);
  const allSource = sourcesOf(notebook).join('\n');

  assert.ok(allSource.includes('time_hours = []'));
  assert.ok(allSource.includes('pressure_bar = []'));
  assert.ok(allSource.includes('air_temperature_c = []'));
  assert.ok(allSource.includes('tes_temperature_c = []'));
  assert.ok(allSource.includes('compressor_power_mw = []'));
  assert.ok(allSource.includes('expander_power_mw = []'));
  assert.ok(allSource.includes('for step in range(total_steps):'));
}

function testFilenameSanitization() {
  const filename = makeCaesNotebookFilename('CAES/压缩空气:储能*仿真?');

  assert.ok(filename.startsWith('official-thermal-caes_CAES_压缩空气_储能_仿真_'));
  assert.ok(filename.endsWith('.ipynb'));
  assert.equal(/[\\/:*?"<>|]/.test(filename), false);
}

testNotebookContainsFullCaesProcess();
testNotebookIncludesParameterBindingMetadata();
testGeneratedNotebookUsesDynamicStateArrays();
testFilenameSanitization();

console.log('official thermal CAES example tests passed');
```

- [ ] **Step 2: Extend the test script**

Modify `jupyterlab-official-thermal-examples/package.json`:

```json
"test": "npm run build:lib && node tests/csp-example.test.js && node tests/caes-example.test.js"
```

- [ ] **Step 3: Run the failing test**

Run:

```bash
cd /home/yuan/my_project/jupyterlab-official-thermal-examples
npm test
```

Expected:

```text
Cannot find module '../lib/caes/caesNotebookGenerator.js'
```

### Task 2: Create CAES Generator Types, Defaults, and Parameter Bindings

**Files:**
- Create: `jupyterlab-official-thermal-examples/src/caes/caesNotebookGenerator.ts`

- [ ] **Step 1: Add CAES TypeScript public API**

Create the file with these exported names:

```typescript
export type CaesOperationProfileId = 'charge_hold_discharge' | 'renewable_surplus_peak_discharge';

export interface CaesExampleConfig {
  exampleName: string;
  operationProfile: CaesOperationProfileId;
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
  chargeHours: number;
  holdHours: number;
  dischargeHours: number;
  timeStepMinutes: number;
}
```

- [ ] **Step 2: Add default config**

Use these default values:

```typescript
export const DEFAULT_CAES_CONFIG: CaesExampleConfig = {
  exampleName: '压缩空气储能仿真',
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
  chargeHours: 4,
  holdHours: 2,
  dischargeHours: 4,
  timeStepMinutes: 2
};
```

- [ ] **Step 3: Add parameter binding metadata**

Create `CAES_PARAMETER_BINDINGS` with slider/dropdown controls for:

```typescript
export const CAES_PARAMETER_BINDINGS: Record<string, ParamControlConfig> = {
  operation_profile: {
    type: 'dropdown',
    label: '运行工况',
    options: ['charge_hold_discharge', 'renewable_surplus_peak_discharge'],
    group: '运行策略'
  },
  compressor_stages: {
    type: 'slider',
    label: '压缩机级数',
    min: 2,
    max: 4,
    step: 1,
    group: '压缩子系统'
  },
  expander_stages: {
    type: 'slider',
    label: '膨胀机级数',
    min: 2,
    max: 4,
    step: 1,
    group: '膨胀发电子系统'
  },
  mass_flow_kg_s: {
    type: 'slider',
    label: '空气质量流量 (kg/s)',
    min: 2,
    max: 40,
    step: 1,
    group: '系统规模'
  },
  max_storage_pressure_bar: {
    type: 'slider',
    label: '最高储气压力 (bar)',
    min: 60,
    max: 200,
    step: 5,
    group: '储气系统'
  },
  storage_volume_m3: {
    type: 'slider',
    label: '储气容积 (m^3)',
    min: 200,
    max: 5000,
    step: 100,
    group: '储气系统'
  },
  heat_exchanger_effectiveness: {
    type: 'slider',
    label: '换热器有效度 (-)',
    min: 0.65,
    max: 0.98,
    step: 0.01,
    group: '换热设备'
  },
  tes_mass_kg: {
    type: 'slider',
    label: 'TES 储热介质质量 (kg)',
    min: 50000,
    max: 1000000,
    step: 10000,
    group: '热储能系统'
  }
};
```

- [ ] **Step 4: Run TypeScript build and verify the expected partial failure**

Run:

```bash
cd /home/yuan/my_project/jupyterlab-official-thermal-examples
npm run build:lib
```

Expected:

```text
No TypeScript errors.
```

Run:

```bash
npm test
```

Expected:

```text
TypeError: generateCaesNotebook is not a function
```

### Task 3: Implement CAES Notebook Cells

**Files:**
- Modify: `jupyterlab-official-thermal-examples/src/caes/caesNotebookGenerator.ts`

- [ ] **Step 1: Add notebook cell helpers**

Implement local helpers matching the CSP generator style:

```typescript
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
```

- [ ] **Step 2: Add parameter layer code generator**

Generate Python parameter variables using snake_case names:

```python
# 参数层代码
operation_profile = 'charge_hold_discharge'
ambient_temperature_c = 25
ambient_pressure_bar = 1.01325
compressor_stages = 3
expander_stages = 2
mass_flow_kg_s = 12
compressor_efficiency = 0.82
expander_efficiency = 0.86
motor_efficiency = 0.96
generator_efficiency = 0.96
heat_exchanger_effectiveness = 0.88
storage_volume_m3 = 1200
min_storage_pressure_bar = 40
max_storage_pressure_bar = 120
initial_storage_pressure_bar = 45
storage_heat_transfer_coefficient_wk = 2800
tes_mass_kg = 420000
tes_specific_heat_kj_kg_k = 0.92
tes_initial_temperature_c = 120
tes_ambient_loss_coefficient_wk = 1800
charge_hours = 4
hold_hours = 2
discharge_hours = 4
time_step_minutes = 2
```

- [ ] **Step 3: Add CoolProp-based property layer**

The generated Notebook must contain this import and visible wrapper:

```python
try:
    import CoolProp.CoolProp as CP
except ImportError as exc:
    raise ImportError(
        "压缩空气储能仿真需要 CoolProp。请在当前环境安装: pip install CoolProp"
    ) from exc

AIR = 'Air'

def air_props(T, p):
    """Return air properties at temperature T [K] and pressure p [Pa]."""
    return {
        'T': T,
        'p': p,
        'cp': CP.PropsSI('Cpmass', 'T', T, 'P', p, AIR),
        'cv': CP.PropsSI('Cvmass', 'T', T, 'P', p, AIR),
        'h': CP.PropsSI('Hmass', 'T', T, 'P', p, AIR),
        's': CP.PropsSI('Smass', 'T', T, 'P', p, AIR),
        'rho': CP.PropsSI('Dmass', 'T', T, 'P', p, AIR)
    }
```

- [ ] **Step 4: Add equipment model layer**

Generate Python code containing:

```python
def compressor_stage(T_in, p_in, p_out, eta_isentropic, mass_flow):
    s_in = CP.PropsSI('Smass', 'T', T_in, 'P', p_in, AIR)
    h_in = CP.PropsSI('Hmass', 'T', T_in, 'P', p_in, AIR)
    h_out_s = CP.PropsSI('Hmass', 'P', p_out, 'Smass', s_in, AIR)
    h_out = h_in + (h_out_s - h_in) / eta_isentropic
    T_out = CP.PropsSI('T', 'P', p_out, 'Hmass', h_out, AIR)
    power_w = mass_flow * (h_out - h_in)
    return T_out, h_out, power_w

def expander_stage(T_in, p_in, p_out, eta_isentropic, mass_flow):
    s_in = CP.PropsSI('Smass', 'T', T_in, 'P', p_in, AIR)
    h_in = CP.PropsSI('Hmass', 'T', T_in, 'P', p_in, AIR)
    h_out_s = CP.PropsSI('Hmass', 'P', p_out, 'Smass', s_in, AIR)
    h_out = h_in - eta_isentropic * (h_in - h_out_s)
    T_out = CP.PropsSI('T', 'P', p_out, 'Hmass', h_out, AIR)
    power_w = mass_flow * (h_in - h_out)
    return T_out, h_out, power_w

def storage_tank_step(state, m_in, h_in, m_out, dt):
    m_old = state['mass']
    T_old = state['temperature']
    p_old = state['pressure']
    u_old = CP.PropsSI('Umass', 'T', T_old, 'P', p_old, AIR)
    h_out = CP.PropsSI('Hmass', 'T', T_old, 'P', p_old, AIR)
    heat_loss_w = storage_heat_transfer_coefficient_wk * (T_old - ambient_temperature_k)
    internal_energy = m_old * u_old + m_in * h_in * dt - m_out * h_out * dt - heat_loss_w * dt
    m_new = max(m_old + (m_in - m_out) * dt, 1e-6)
    u_new = internal_energy / m_new
    rho_new = m_new / storage_volume_m3
    T_new = CP.PropsSI('T', 'Umass', u_new, 'Dmass', rho_new, AIR)
    p_new = CP.PropsSI('P', 'T', T_new, 'Dmass', rho_new, AIR)
    return {'mass': m_new, 'temperature': T_new, 'pressure': p_new}

def tes_step(tes_state, heat_charge, heat_discharge, dt):
    energy_old = tes_state['energy_j']
    loss_w = tes_ambient_loss_coefficient_wk * (tes_state['temperature_k'] - ambient_temperature_k)
    energy_new = max(energy_old + heat_charge * dt - heat_discharge * dt - loss_w * dt, 0.0)
    temperature_k = ambient_temperature_k + energy_new / (tes_mass_kg * tes_specific_heat_j_kg_k)
    return {'energy_j': energy_new, 'temperature_k': temperature_k}
```

- [ ] **Step 5: Add solver layer with three operating modes**

The generated code must contain:

```python
for step in range(total_steps):
    current_hour = step * dt / 3600
    if current_hour < charge_hours:
        mode = 'charge'
    elif current_hour < charge_hours + hold_hours:
        mode = 'hold'
    else:
        mode = 'discharge'
    mode_by_step.append(mode)
```

Mode behavior:

- `charge`: `m_in = mass_flow_kg_s` until `pressure >= max_storage_pressure_bar`; compressor power is positive, expander power is zero, TES receives recovered compression heat.
- `hold`: `m_in = 0`, `m_out = 0`; storage tank and TES only lose heat to ambient.
- `discharge`: `m_out = mass_flow_kg_s` until `pressure <= min_storage_pressure_bar`; expander power is positive, compressor power is zero, TES releases heat for preheating.

- [ ] **Step 6: Add visualization and results cells**

Notebook visualization must include:

```python
fig, axes = plt.subplots(3, 2, figsize=(16, 12), constrained_layout=True)
```

Plots:

- storage pressure versus time.
- storage air temperature versus time.
- storage air mass versus time.
- TES temperature versus time.
- compressor, expander, and net power versus time.
- operating mode timeline.

Results must include:

```python
round_trip_efficiency = electric_output_j / electric_input_j if electric_input_j > 0 else 0
```

and print/display:

- total electric input in MWh.
- total electric output in MWh.
- round-trip efficiency.
- maximum storage pressure.
- minimum storage pressure.
- final TES temperature.
- charge, hold, discharge duration.

- [ ] **Step 7: Run CAES generator tests**

Run:

```bash
cd /home/yuan/my_project/jupyterlab-official-thermal-examples
npm test
```

Expected:

```text
official thermal CSP example tests passed
official thermal CAES example tests passed
```

### Task 4: Add CAES File Service

**Files:**
- Modify: `jupyterlab-official-thermal-examples/src/notebook/fileService.ts`

- [ ] **Step 1: Import CAES generator**

Add:

```typescript
import {
  CaesExampleConfig,
  generateCaesNotebook,
  makeCaesNotebookFilename
} from '../caes/caesNotebookGenerator';
```

- [ ] **Step 2: Add CAES save function**

Add:

```typescript
export async function saveAndOpenCaesNotebook(app: JupyterFrontEnd, config: CaesExampleConfig): Promise<string> {
  const contents = app.serviceManager.contents;
  await ensureDirectory(app, RESULTS_DIR);

  const notebook = generateCaesNotebook(config);
  const filename = makeCaesNotebookFilename(config.exampleName);
  const filePath = `${RESULTS_DIR}/${filename}`;

  const fileModel = await contents.save(filePath, {
    type: 'notebook',
    format: 'json',
    content: notebook
  });

  const openedWidget = await app.commands.execute('docmanager:open', {
    path: fileModel.path,
    factory: 'Notebook',
    options: {
      mode: 'tab-after',
      activate: true
    }
  });

  if (openedWidget && typeof openedWidget === 'object' && 'title' in openedWidget) {
    const title = (openedWidget as { title: { label: string; caption: string; closable: boolean } }).title;
    title.label = filename;
    title.caption = fileModel.path;
    title.closable = true;
  }

  return fileModel.path;
}
```

- [ ] **Step 3: Run TypeScript build**

Run:

```bash
cd /home/yuan/my_project/jupyterlab-official-thermal-examples
npm run build:lib
```

Expected:

```text
No TypeScript errors.
```

### Task 5: Update Official Examples UI to Include CAES

**Files:**
- Modify: `jupyterlab-official-thermal-examples/src/components/OfficialThermalExamplesApp.tsx`
- Modify: `jupyterlab-official-thermal-examples/src/MainWidget.tsx`

- [ ] **Step 1: Add official example selection state**

Use:

```typescript
type OfficialExampleId = 'csp' | 'caes';
```

In `OfficialThermalExamplesApp`, maintain:

```typescript
const [activeExample, setActiveExample] = useState<OfficialExampleId>('caes');
const [cspConfig, setCspConfig] = useState<CspExampleConfig>(DEFAULT_CSP_CONFIG);
const [caesConfig, setCaesConfig] = useState<CaesExampleConfig>(DEFAULT_CAES_CONFIG);
```

- [ ] **Step 2: Change props to a discriminated union**

Use:

```typescript
type OfficialExampleRequest =
  | { kind: 'csp'; config: CspExampleConfig }
  | { kind: 'caes'; config: CaesExampleConfig };

interface OfficialThermalExamplesAppProps {
  onGenerate: (request: OfficialExampleRequest) => Promise<void>;
}
```

- [ ] **Step 3: Add CAES tab button**

Render two buttons:

```tsx
<button
  className={activeExample === 'caes' ? 'official-thermal-tab is-active' : 'official-thermal-tab'}
  onClick={() => setActiveExample('caes')}
>
  压缩空气储能仿真
</button>
<button
  className={activeExample === 'csp' ? 'official-thermal-tab is-active' : 'official-thermal-tab'}
  onClick={() => setActiveExample('csp')}
>
  槽式太阳能光热发电
</button>
```

- [ ] **Step 4: Add CAES parameter panel**

CAES panel fields:

- 运行工况 `operationProfile`
- 压缩机级数 `compressorStages`
- 膨胀机级数 `expanderStages`
- 空气质量流量 `massFlowKgS`
- 最高储气压力 `maxStoragePressureBar`
- 储气容积 `storageVolumeM3`
- 换热器有效度 `heatExchangerEffectiveness`
- TES 储热介质质量 `tesMassKg`
- 充电时长 `chargeHours`
- 静置时长 `holdHours`
- 放电时长 `dischargeHours`

Button text:

```text
生成压缩空气储能 Notebook
```

- [ ] **Step 5: Update MainWidget dispatch**

Modify `jupyterlab-official-thermal-examples/src/MainWidget.tsx`:

```typescript
<OfficialThermalExamplesApp
  onGenerate={async request => {
    if (request.kind === 'caes') {
      await saveAndOpenCaesNotebook(this.app, request.config);
      return;
    }
    await saveAndOpenCspNotebook(this.app, request.config);
  }}
/>
```

- [ ] **Step 6: Run build**

Run:

```bash
cd /home/yuan/my_project/jupyterlab-official-thermal-examples
npm run build:lib
```

Expected:

```text
No TypeScript errors.
```

### Task 6: Add CoolProp to the Runtime Image

**Files:**
- Modify: `Dockerfile-nbgrader`

- [ ] **Step 1: Add CoolProp to the main Python dependency layer**

In the existing pip install block containing `matplotlib`, `numpy`, `scipy`, and `numba`, add:

```dockerfile
    'CoolProp'
```

Keep it next to the scientific computing packages:

```dockerfile
    'matplotlib' \
    'numpy' \
    'scipy' \
    'numba' \
    'CoolProp'
```

- [ ] **Step 2: Full image build verification**

Run the project’s normal image build command used for SimLab deployment. If no wrapper script exists, run:

```bash
cd /home/yuan/my_project
docker build -f Dockerfile-nbgrader -t simlab-nbgrader-caes .
```

Expected:

```text
Successfully tagged simlab-nbgrader-caes:latest
```

### Task 7: Add Styles for Official Example Selection and CAES Panel

**Files:**
- Modify: `jupyterlab-official-thermal-examples/style/base.css`

- [ ] **Step 1: Add tab layout styles**

Add:

```css
.official-thermal-tabs {
  display: flex;
  gap: 8px;
  margin: 0 0 16px;
}

.official-thermal-tab {
  border: 1px solid var(--jp-border-color2);
  background: var(--jp-layout-color1);
  color: var(--jp-ui-font-color1);
  padding: 7px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.official-thermal-tab.is-active {
  background: var(--jp-brand-color1);
  border-color: var(--jp-brand-color1);
  color: white;
}
```

- [ ] **Step 2: Add CAES metric styles**

Add:

```css
.official-thermal-metrics.caes strong {
  font-variant-numeric: tabular-nums;
}

.official-thermal-process.caes li b {
  overflow-wrap: anywhere;
}
```

- [ ] **Step 3: Run style/build check**

Run:

```bash
cd /home/yuan/my_project/jupyterlab-official-thermal-examples
npm run build
```

Expected:

```text
No TypeScript or labextension build errors.
```

### Task 8: End-to-End Verification

**Files:**
- Verify only, no file edits.

- [ ] **Step 1: Run official examples tests**

Run:

```bash
cd /home/yuan/my_project/jupyterlab-official-thermal-examples
npm test
```

Expected:

```text
official thermal CSP example tests passed
official thermal CAES example tests passed
```

- [ ] **Step 2: Verify generated Notebook executes**

Open JupyterLab, enter “官方热力建模示例”, select “压缩空气储能仿真”, generate Notebook, and run all cells.

Expected visible outputs:

- six-panel Matplotlib result figure.
- key results table containing round-trip efficiency.
- no Python exception from CoolProp.
- parameter binding sidebar shows CAES parameters grouped by subsystem.

- [ ] **Step 3: Verify code visualization behavior**

Change these parameters from the parameter binding sidebar:

- `max_storage_pressure_bar`
- `storage_volume_m3`
- `heat_exchanger_effectiveness`
- `tes_mass_kg`

Expected:

- the parameter layer code changes visibly.
- downstream cells rerun.
- pressure, TES temperature, and net power curves change.
- round-trip efficiency updates.

- [ ] **Step 4: Verify CSP regression**

In the same official examples page, select “槽式太阳能光热发电”, generate Notebook, and run all cells.

Expected:

- CSP Notebook still contains DNI, storage, power block, and operation mode plots.
- CSP tests still pass.

## 5. Thesis Mapping

This implementation supports the thesis title “基于代码可视化的压缩空气储能原理仿真系统设计与实现” in three linked layers:

- 仿真模型层：AA-CAES 多设备耦合动态 process，包含 CoolProp 变比热物性、多级压缩/膨胀、储气罐非稳态模型和 TES 动态模型。
- 代码可视化层：Notebook 分层展示参数、物性、设备模型、求解、可视化和结果分析，用户能看到公式如何变成代码。
- 系统实现层：CAES 作为官方热力建模示例插件中的正式示例，与现有参数绑定和 Notebook 自动生成机制集成。

## 6. Acceptance Criteria

Implementation is complete when all of the following are true:

- `npm test` in `jupyterlab-official-thermal-examples` passes both CSP and CAES tests.
- TypeScript build passes.
- Docker image includes CoolProp and generated CAES Notebook can import it.
- Official thermal examples page contains “压缩空气储能仿真”.
- Generated CAES Notebook runs all cells successfully.
- Generated CAES Notebook exposes parameter binding metadata for CAES controls.
- Generated CAES Notebook plots storage pressure, air temperature, air mass, TES temperature, compressor power, expander power, net power, and operating mode.
- Generated CAES Notebook calculates round-trip efficiency from electric input and output.
- No three-dimensional model or CFD dependency is introduced.

## 7. Self-Review

Spec coverage:

- CoolProp and variable heat capacity are covered by Tasks 2, 3, and 6.
- No 3D modeling is enforced by Scope Decisions, Task 1 tests, and Acceptance Criteria.
- Placement under the official thermal examples plugin is covered by Tasks 4 and 5.
- The system name “压缩空气储能仿真” is used in the default CAES config, UI tab, generated Notebook, and tests.
- The plan is stored under `/home/yuan/my_project/CAES-file`.

Placeholder scan:

- This plan contains concrete file paths, commands, function names, default values, and expected outputs.
- No ambiguous implementation placeholder is required to execute the plan.

Type consistency:

- Frontend config uses camelCase TypeScript fields.
- Generated Notebook parameters use snake_case Python variables.
- Test names and exported generator names match: `DEFAULT_CAES_CONFIG`, `CAES_PARAMETER_BINDINGS`, `generateCaesNotebook`, and `makeCaesNotebookFilename`.
