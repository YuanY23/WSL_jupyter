const assert = require('node:assert/strict');

const { TEMPLATE_REGISTRY, getDefaultConfig } = require('../lib/templates/registry.js');
const { generateSimulationNotebook } = require('../lib/notebook/notebookFactory.js');
const { validateFormulaExpression } = require('../lib/validators/formula.js');
const { makeNotebookFilename } = require('../lib/notebook/filename.js');

function sourcesOf(notebook) {
  return notebook.cells.map(cell => Array.isArray(cell.source) ? cell.source.join('') : cell.source);
}

function testAllTemplatesGenerateVisibleCodeNotebooks() {
  assert.equal(TEMPLATE_REGISTRY.length, 7, 'the platform should expose exactly seven first-version templates');

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
testFormulaValidationRejectsUnknownVariables();
testFilenameSanitization();

console.log('notebook generator tests passed');
