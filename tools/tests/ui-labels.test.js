const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const simulationIndex = read('jupyterlab-simulation-platform/src/index.ts');
const templateSelector = read('jupyterlab-simulation-platform/src/components/TemplateSelector.tsx');
const thermalIndex = read('jupyterlab-thermal-design/src/index.ts');
const thermalControlPanel = read('jupyterlab-thermal-design/src/components/ControlPanel.tsx');

assert.ok(simulationIndex.includes("category: '通用仿真平台'"));
assert.ok(simulationIndex.includes("label: '打开通用仿真平台'"));
assert.ok(simulationIndex.includes("content.title.label = '通用仿真平台'"));
assert.ok(simulationIndex.includes("widget.title.label = '通用仿真平台'"));
assert.ok(simulationIndex.includes("simulationMenu.title.label = '通用仿真平台'"));
assert.ok(templateSelector.includes('>通用仿真平台</h2>'));
assert.equal(simulationIndex.includes("category: '仿真平台'"), false);
assert.equal(simulationIndex.includes("label: '仿真模板生成器'"), false);
assert.equal(simulationIndex.includes("content.title.label = '仿真模板生成器'"), false);
assert.equal(simulationIndex.includes("widget.title.label = '仿真模板生成器'"), false);
assert.equal(simulationIndex.includes("simulationMenu.title.label = '仿真平台'"), false);
assert.equal(templateSelector.includes('>仿真平台</h2>'), false);

assert.ok(thermalIndex.includes("label: '打开传热仿真平台'"));
assert.ok(thermalIndex.includes("content.title.label = '传热仿真平台'"));
assert.ok(thermalIndex.includes("widget.title.label = '传热仿真平台'"));
assert.ok(thermalIndex.includes("thermalMenu.title.label = '传热仿真平台'"));
assert.ok(thermalControlPanel.includes('>传热仿真平台</p>'));
assert.ok(thermalControlPanel.includes('>传热仿真平台</h2>'));
assert.equal(thermalIndex.includes('热设计仿真系统'), false);
assert.equal(thermalIndex.includes('热设计原理仿真工作台'), false);
assert.equal(thermalControlPanel.includes('热设计平台'), false);
assert.equal(thermalControlPanel.includes('热设计原理仿真工作台'), false);

console.log('ui label tests passed');
