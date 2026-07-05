# 压缩空气储能官方示例集成 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 Python 版和 Julia 版“压缩空气储能仿真”Notebook 原型集成到 `jupyterlab-official-thermal-examples` 官方热力建模示例插件中，提供配置界面，一键生成 Python 或 Julia CAES 仿真 Notebook。

**Architecture:** 在官方热力建模示例插件中新增 CAES 示例，与现有 CSP 示例并列。CAES 生成器复用当前 `CAES-file` 中已验证的 Notebook 内容，前端提供“示例选择 + 语言选择 + 分组参数配置”界面；生成出的 Notebook 继续保留参数层 metadata，让左侧参数绑定插件按分组显示全部滑块。

**Tech Stack:** JupyterLab 4 extension, TypeScript, React, Notebook JSON generator, Python Notebook, Julia Notebook, existing param-binding metadata, Node assert tests.

---

## 1. Scope

本次只实现第一种工况：

```text
charge_hold_discharge = 充电 -> 静置 -> 放电
```

不实现第二种新能源富余充电/高峰放电工况。UI 中不暴露未实现的 `renewable_surplus_peak_discharge`，避免用户误以为已经有两套调度逻辑。

本次集成目标：

- 官方热力建模示例页面中新增“压缩空气储能仿真”。
- CAES 示例支持选择生成 Python 版或 Julia 版。
- CAES 参数配置界面按模块分组：
  - 运行策略与时间
  - 环境参数
  - 压缩机与电动机
  - 冷却器与换热器
  - 储气罐
  - 热储能 TES
  - 膨胀机与发电机
- 生成 Notebook 后，左侧参数自动绑定界面中所有数值参数均为 slider。
- 生成 Notebook 中“设备模型层代码”保留清晰模型标注。
- 保持现有 CSP 示例可用。

## 2. File Structure

### Create

- `jupyterlab-official-thermal-examples/src/caes/caesNotebookGenerator.ts`
  - 负责生成 Python/Julia 两种 CAES Notebook。
  - 导出 CAES 配置类型、默认参数、参数绑定 metadata、Notebook 生成函数、文件名生成函数。

- `jupyterlab-official-thermal-examples/tests/caes-example.test.js`
  - 验证 Python 和 Julia CAES Notebook 均可生成，且包含关键模型函数、参数绑定、分组 slider、模型层标注。

### Modify

- `jupyterlab-official-thermal-examples/src/components/OfficialThermalExamplesApp.tsx`
  - 从单一 CSP 示例页面改成“官方示例选择页面”。
  - 新增 CAES 配置界面。
  - CAES 默认作为优先展示示例。

- `jupyterlab-official-thermal-examples/src/MainWidget.tsx`
  - 根据示例类型调用 CSP 或 CAES 保存函数。

- `jupyterlab-official-thermal-examples/src/notebook/fileService.ts`
  - 新增 `saveAndOpenCaesNotebook`。
  - 保留 `saveAndOpenCspNotebook`。

- `jupyterlab-official-thermal-examples/package.json`
  - 测试脚本增加 CAES 测试。

- `jupyterlab-official-thermal-examples/style/base.css`
  - 增加官方示例切换、语言选择、CAES 参数分组面板样式。

## 3. Data Model

### CAES Language Type

```typescript
export type CaesNotebookLanguage = 'python' | 'julia';
```

### CAES Config

```typescript
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
```

### Default Config

默认值与当前原型 Notebook 保持一致：

```typescript
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
```

## 4. Parameter Binding Contract

生成 Notebook 的 metadata 必须包含：

```typescript
metadata.simulation_param_bindings = {
  version: 1,
  title: '参数层代码',
  parameters: CAES_PARAMETER_BINDINGS
}
```

所有数值参数必须为 `slider`，不得退回 `number`。

分组要求：

```text
01 运行策略与时间
02 环境参数
03 压缩机与电动机
04 冷却器与换热器
05 储气罐
06 热储能 TES
07 膨胀机与发电机
```

`operation_profile` 可以是 `dropdown`，但只包含：

```typescript
options: ['charge_hold_discharge']
```

因为第二工况暂不实现。

## 5. Notebook Generator Contract

生成的 CAES Notebook 必须包含 12 个部分：

```text
1. 工艺流程说明
2. 建模假设
3. 参数说明表
4. 数学模型
5. 计算环境
6. 参数层代码
7. 物性层代码
8. 设备模型层代码
9. 系统状态机与求解层代码
10. 结果可视化代码
11. 关键结果输出
12. 结果分析提示
```

设备模型层必须包含这些文字标注：

```text
模型 1：压缩机单级模型
模型 2：膨胀机单级模型
模型 3：冷却器 / 换热器有效度模型
模型 4：定容储气罐动态模型
模型 5：热储能 TES 动态模型
辅助函数：多级压缩/膨胀的压力序列
```

Python Notebook 必须暴露：

```python
air_props
compressor_stage
cooler
storage_tank_step
tes_step
expander_stage
run_caes_cycle
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

Julia Notebook 必须暴露同名或等价变量/函数：

```julia
air_props
compressor_stage
cooler
storage_tank_step
tes_step
expander_stage
run_caes_cycle
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

## 6. UI Design

官方热力建模示例页面调整为：

```text
顶部：官方热力建模示例
示例切换：
  - 压缩空气储能仿真
  - 槽式太阳能光热发电

当选择 CAES：
  左侧/主配置区：分组参数面板
  右侧：CAES process 模型链路
  顶部指标卡：储气压力范围、储气容积、TES 质量、默认循环时长
```

CAES 配置界面需要：

- 语言选择：Python / Julia。
- 参数分组展开显示。
- 每个数值参数使用 range + number 双输入，沿用当前 `NumberField` 交互。
- 生成按钮文字：

```text
生成压缩空气储能 Notebook
```

CSP 页面保持现状，但可以作为第二个 tab。

## 7. Implementation Tasks

### Task 1: Add CAES Generator Test

**Files:**
- Create: `jupyterlab-official-thermal-examples/tests/caes-example.test.js`
- Modify: `jupyterlab-official-thermal-examples/package.json`

Steps:

- [ ] Write a Node assert test that imports:

```javascript
const {
  CAES_PARAMETER_BINDINGS,
  DEFAULT_CAES_CONFIG,
  generateCaesNotebook,
  makeCaesNotebookFilename
} = require('../lib/caes/caesNotebookGenerator.js');
```

- [ ] Test Python generation:
  - `generateCaesNotebook({ ...DEFAULT_CAES_CONFIG, language: 'python' })`
  - contains `压缩空气储能仿真`
  - contains `模型 1：压缩机单级模型`
  - contains `def compressor_stage`
  - contains `def run_caes_cycle`
  - kernel language is `python`

- [ ] Test Julia generation:
  - `generateCaesNotebook({ ...DEFAULT_CAES_CONFIG, language: 'julia' })`
  - contains `压缩空气储能仿真 Julia 版`
  - contains `function compressor_stage`
  - contains `function run_caes_cycle`
  - kernel language is `julia`

- [ ] Test all numeric bindings:

```javascript
const requiredSliders = [
  'ambient_temperature_c',
  'ambient_pressure_bar',
  'compressor_stages',
  'expander_stages',
  'mass_flow_kg_s',
  'compressor_efficiency',
  'expander_efficiency',
  'motor_efficiency',
  'generator_efficiency',
  'heat_exchanger_effectiveness',
  'storage_volume_m3',
  'min_storage_pressure_bar',
  'max_storage_pressure_bar',
  'initial_storage_pressure_bar',
  'storage_heat_transfer_coefficient_wk',
  'tes_mass_kg',
  'tes_specific_heat_kj_kg_k',
  'tes_initial_temperature_c',
  'tes_ambient_loss_coefficient_wk',
  'max_turbine_inlet_temperature_c',
  'minimum_tes_approach_temperature_k',
  'charge_hours',
  'hold_hours',
  'discharge_hours',
  'time_step_minutes'
];
```

Each required slider must have:

```javascript
type === 'slider'
typeof min === 'number'
typeof max === 'number'
typeof step === 'number'
group is non-empty
```

- [ ] Update `package.json`:

```json
"test": "npm run build:lib && node tests/csp-example.test.js && node tests/caes-example.test.js"
```

- [ ] Run:

```bash
cd /home/yuan/my_project/jupyterlab-official-thermal-examples
npm test
```

Expected first failure:

```text
Cannot find module '../lib/caes/caesNotebookGenerator.js'
```

### Task 2: Create CAES Notebook Generator

**Files:**
- Create: `jupyterlab-official-thermal-examples/src/caes/caesNotebookGenerator.ts`

Steps:

- [ ] Define `CaesNotebookLanguage`, `CaesExampleConfig`, `DEFAULT_CAES_CONFIG`.
- [ ] Define `CAES_PARAMETER_BINDINGS` with 26 metadata entries from the current prototype.
- [ ] Implement helpers:

```typescript
function lineArray(source: string): string[]
function markdownCell(source: string): NotebookCell
function codeCell(source: string): NotebookCell
function pythonString(value: string): string
```

- [ ] Implement:

```typescript
export function generateCaesNotebook(config: CaesExampleConfig = DEFAULT_CAES_CONFIG): NotebookModel
```

Behavior:

```typescript
if (config.language === 'julia') {
  return generateJuliaCaesNotebook(config);
}
return generatePythonCaesNotebook(config);
```

- [ ] Implement:

```typescript
export function makeCaesNotebookFilename(config: CaesExampleConfig): string
```

Expected filename prefix:

```text
official-thermal-caes-python_
official-thermal-caes-julia_
```

- [ ] Run:

```bash
cd /home/yuan/my_project/jupyterlab-official-thermal-examples
npm test
```

Expected:

```text
official thermal CSP example tests passed
official thermal CAES example tests passed
```

### Task 3: Add CAES File Service

**Files:**
- Modify: `jupyterlab-official-thermal-examples/src/notebook/fileService.ts`

Steps:

- [ ] Import CAES types and generator.
- [ ] Add:

```typescript
export async function saveAndOpenCaesNotebook(app: JupyterFrontEnd, config: CaesExampleConfig): Promise<string>
```

- [ ] Reuse existing `ensureDirectory`.
- [ ] Save into existing:

```text
official-thermal-examples-results
```

- [ ] Open with Notebook factory:

```typescript
await app.commands.execute('docmanager:open', {
  path: fileModel.path,
  factory: 'Notebook',
  options: { mode: 'tab-after', activate: true }
});
```

- [ ] Run:

```bash
cd /home/yuan/my_project/jupyterlab-official-thermal-examples
npm run build:lib
```

Expected:

```text
No TypeScript errors.
```

### Task 4: Update Official Example UI

**Files:**
- Modify: `jupyterlab-official-thermal-examples/src/components/OfficialThermalExamplesApp.tsx`

Steps:

- [ ] Add union request type:

```typescript
type OfficialExampleRequest =
  | { kind: 'csp'; config: CspExampleConfig }
  | { kind: 'caes'; config: CaesExampleConfig };
```

- [ ] Change props:

```typescript
interface OfficialThermalExamplesAppProps {
  onGenerate: (request: OfficialExampleRequest) => Promise<void>;
}
```

- [ ] Add state:

```typescript
const [activeExample, setActiveExample] = useState<'caes' | 'csp'>('caes');
const [cspConfig, setCspConfig] = useState<CspExampleConfig>(DEFAULT_CSP_CONFIG);
const [caesConfig, setCaesConfig] = useState<CaesExampleConfig>(DEFAULT_CAES_CONFIG);
```

- [ ] Create reusable `SelectField` for CAES language selection.
- [ ] Create grouped CAES sections:
  - `renderOperationGroup`
  - `renderEnvironmentGroup`
  - `renderCompressorGroup`
  - `renderHeatExchangerGroup`
  - `renderStorageGroup`
  - `renderTesGroup`
  - `renderExpanderGroup`

- [ ] Keep CSP rendering path intact.
- [ ] CAES generate button calls:

```typescript
await props.onGenerate({ kind: 'caes', config: caesConfig });
```

- [ ] CSP generate button calls:

```typescript
await props.onGenerate({ kind: 'csp', config: cspConfig });
```

### Task 5: Update MainWidget Dispatch

**Files:**
- Modify: `jupyterlab-official-thermal-examples/src/MainWidget.tsx`

Steps:

- [ ] Import `saveAndOpenCaesNotebook`.
- [ ] Dispatch by request kind:

```tsx
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

- [ ] Run:

```bash
cd /home/yuan/my_project/jupyterlab-official-thermal-examples
npm run build:lib
```

Expected:

```text
No TypeScript errors.
```

### Task 6: Add Styles

**Files:**
- Modify: `jupyterlab-official-thermal-examples/style/base.css`

Steps:

- [ ] Add tab styles:

```css
.official-thermal-tabs
.official-thermal-tab
.official-thermal-tab.is-active
```

- [ ] Add parameter group styles:

```css
.official-thermal-param-section
.official-thermal-param-section h4
.official-thermal-param-grid
```

- [ ] Keep existing CSP classes working.

- [ ] Run:

```bash
cd /home/yuan/my_project/jupyterlab-official-thermal-examples
npm run build
```

Expected:

```text
Build completes without TypeScript or labextension errors.
```

### Task 7: Verify Generated Notebooks

**Files:**
- Verify generated output only.

Steps:

- [ ] Run:

```bash
cd /home/yuan/my_project/jupyterlab-official-thermal-examples
npm test
```

Expected:

```text
official thermal CSP example tests passed
official thermal CAES example tests passed
```

- [ ] Manually open SimLab after your image build.
- [ ] Open “官方热力建模示例”.
- [ ] Select “压缩空气储能仿真”.
- [ ] Generate Python Notebook.
- [ ] Confirm left parameter sidebar groups and sliders:
  - `ambient_pressure_bar` is slider under `02 环境参数`
  - `compressor_efficiency` is slider under `03 压缩机与电动机`
  - `expander_efficiency` is slider under `07 膨胀机与发电机`
- [ ] Run all Python cells.
- [ ] Generate Julia Notebook.
- [ ] Confirm Julia notebook opens with Julia kernel metadata.
- [ ] Generate CSP Notebook and confirm original CSP example still works.

## 8. Acceptance Criteria

- Official thermal examples plugin shows “压缩空气储能仿真”.
- CAES UI supports Python / Julia language selection.
- CAES UI parameters are grouped by subsystem.
- Generated Python and Julia notebooks include all 26 parameter binding entries.
- All numeric bound parameters are sliders.
- Generated notebooks include clearly labeled device model sections.
- Only `charge_hold_discharge` is exposed as operation profile.
- Existing CSP example still passes tests and generates notebooks.
- No Docker image build is performed by the agent; the user will build the image.

## 9. Execution Order Recommendation

1. Implement generator and tests first.
2. Add file service.
3. Update UI.
4. Add styles.
5. Run tests/build.
6. Stop and let user build image.

This avoids touching the running SimLab container until the extension code is internally consistent.

## 10. Self-Review

Spec coverage:

- Python and Julia CAES integration are both covered.
- First工况 only is explicitly enforced.
- Parameter slider issue is covered by CAES tests.
- Model-layer annotation issue is covered by generator contract and tests.
- Existing CSP regression is included.

Placeholder scan:

- No unimplemented second工况 is exposed.
- No task depends on an undefined file path.
- No required test is described without expected behavior.

Type consistency:

- TypeScript config fields use camelCase.
- Generated Notebook variables use snake_case.
- Parameter metadata keys match Notebook parameter-layer variable names.
