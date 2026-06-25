const assert = require('node:assert/strict');

const { TEMPLATE_REGISTRY, getDefaultConfig } = require('../lib/templates/registry.js');
const { generateSimulationNotebook } = require('../lib/notebook/notebookFactory.js');
const { validateFormulaExpression } = require('../lib/validators/formula.js');
const { makeNotebookFilename } = require('../lib/notebook/filename.js');

function sourcesOf(notebook) {
  return notebook.cells.map(cell => Array.isArray(cell.source) ? cell.source.join('') : cell.source);
}

function testAllTemplatesGenerateVisibleCodeNotebooks() {
  assert.equal(TEMPLATE_REGISTRY.length, 8, 'the platform should expose seven concrete templates plus one generic template');

  for (const template of TEMPLATE_REGISTRY) {
    const config = getDefaultConfig(template.id);
    const notebook = generateSimulationNotebook(template.id, config);
    const sources = sourcesOf(notebook);

    assert.equal(notebook.nbformat, 4);
    assert.ok(sources.some(source => source.includes('参数层代码')), `${template.id} should include a parameter layer`);
    assert.ok(sources.some(source => source.includes('模型层代码')), `${template.id} should include a model layer`);
    assert.ok(sources.some(source => source.includes('求解层代码')), `${template.id} should include a solver layer`);
    assert.ok(sources.some(source => source.includes('可视化层代码')), `${template.id} should include a visualization layer`);
    assert.ok(sources.some(source => source.includes('结果分析提示')), `${template.id} should include analysis guidance`);
    assert.ok(
      !sources.join('\n').includes('run_simulation(params)'),
      `${template.id} should not hide the core calculation behind run_simulation(params)`
    );
  }
}

function testGenericTemplateAppearsFirstAndGeneratesEditableSkeleton() {
  assert.equal(TEMPLATE_REGISTRY[0].id, 'generic-simulation');
  assert.equal(TEMPLATE_REGISTRY[0].name, '通用仿真模板');

  const config = getDefaultConfig('generic-simulation');
  const notebook = generateSimulationNotebook('generic-simulation', config);
  const sources = sourcesOf(notebook);
  const expectedTitles = [
    '## 1. 仿真问题说明',
    '## 2. 模型假设',
    '## 3. 参数说明表',
    '## 4. 数学模型或计算规则',
    '## 5. 计算环境',
    '## 6. 参数层代码',
    '## 7. 模型层代码',
    '## 8. 求解层代码',
    '## 9. 可视化层代码',
    '## 10. 关键结果输出',
    '## 11. 可修改参数提示',
    '## 12. 结果分析提示'
  ];

  assert.equal(config.simulationName, '通用仿真模板');
  assert.deepEqual(config.parameters, []);
  assert.deepEqual(config.outputs, []);

  for (const title of expectedTitles) {
    const markdownIndex = sources.findIndex(source => source.includes(title));
    assert.notEqual(markdownIndex, -1, `${title} should be present`);
    assert.equal(notebook.cells[markdownIndex + 1].cell_type, 'code', `${title} should be followed by a code cell`);
  }
}

function testGenericTemplateCanGenerateJuliaKernelNotebook() {
  const config = getDefaultConfig('generic-simulation');
  config.programmingKernel = 'julia';

  const notebook = generateSimulationNotebook('generic-simulation', config);

  assert.equal(notebook.metadata.kernelspec.name, 'julia-1.12');
  assert.equal(notebook.metadata.kernelspec.display_name, 'Julia 1.12');
  assert.equal(notebook.metadata.kernelspec.language, 'julia');
  assert.equal(notebook.metadata.language_info.name, 'julia');
  assert.equal(notebook.metadata.language_info.file_extension, '.jl');
}

function testConcreteTemplatesRemainPythonKernelNotebooks() {
  const concreteTemplates = TEMPLATE_REGISTRY.filter(template => template.id !== 'generic-simulation');

  for (const template of concreteTemplates) {
    const config = getDefaultConfig(template.id);
    const notebook = generateSimulationNotebook(template.id, config);

    assert.equal(notebook.metadata.kernelspec.name, 'python3', `${template.id} should keep the Python kernel`);
    assert.equal(notebook.metadata.kernelspec.language, 'python', `${template.id} should keep Python language metadata`);
    assert.equal(notebook.metadata.language_info.name, 'python', `${template.id} should keep Python language info`);
  }
}

function testGeneratedNotebooksIncludeParamBindingMetadata() {
  const config = getDefaultConfig('algebraic-formula');
  config.parameters = config.parameters.map(parameter => ({
    ...parameter,
    controlType: 'slider',
    min: 0,
    max: parameter.name === 'efficiency' ? 1 : 1000,
    step: parameter.name === 'efficiency' ? 0.01 : 1
  }));

  const notebook = generateSimulationNotebook('algebraic-formula', config);
  const bindings = notebook.metadata.simulation_param_bindings;

  assert.equal(bindings.version, 1);
  assert.equal(bindings.title, '参数层代码');
  assert.equal(bindings.parameters.pv_area.type, 'slider');
  assert.equal(bindings.parameters.pv_area.label, '组件面积 (m^2)');
  assert.equal(bindings.parameters.pv_area.min, 0);
  assert.equal(bindings.parameters.pv_area.max, 1000);
  assert.equal(bindings.parameters.pv_area.step, 1);
}

function testGeneratedNumericParametersDefaultToSliderBindings() {
  const config = getDefaultConfig('first-order-dynamic');
  const notebook = generateSimulationNotebook('first-order-dynamic', config);
  const bindings = notebook.metadata.simulation_param_bindings;

  assert.equal(bindings.parameters.charge_power.type, 'slider');
  assert.equal(bindings.parameters.capacity.type, 'slider');
  assert.equal(bindings.parameters.eta.type, 'slider');
}

function testFormulaValidationRejectsUnknownVariables() {
  const result = validateFormulaExpression('pv_area * irradiance * unknown_eta', ['pv_area', 'irradiance']);
  assert.equal(result.valid, false);
  assert.ok(result.messages.some(message => message.includes('unknown_eta')));
}

function testFilenameSanitization() {
  const filename = makeNotebookFilename('time-series-energy-balance', '光伏/储能:测试*案例?');
  assert.ok(filename.startsWith('time-series-energy-balance_光伏_储能_测试_案例_'));
  assert.ok(filename.endsWith('.ipynb'));
  assert.equal(/[\\/:*?"<>|]/.test(filename), false);
}

testAllTemplatesGenerateVisibleCodeNotebooks();
testGenericTemplateAppearsFirstAndGeneratesEditableSkeleton();
testGenericTemplateCanGenerateJuliaKernelNotebook();
testConcreteTemplatesRemainPythonKernelNotebooks();
testGeneratedNotebooksIncludeParamBindingMetadata();
testGeneratedNumericParametersDefaultToSliderBindings();
testFormulaValidationRejectsUnknownVariables();
testFilenameSanitization();

console.log('notebook generator tests passed');
