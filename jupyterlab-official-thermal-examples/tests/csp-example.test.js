const assert = require('node:assert/strict');

const {
  CSP_PARAMETER_BINDINGS,
  DEFAULT_CSP_CONFIG,
  generateCspNotebook,
  makeCspNotebookFilename
} = require('../lib/csp/cspNotebookGenerator.js');

function sourcesOf(notebook) {
  return notebook.cells.map(cell => Array.isArray(cell.source) ? cell.source.join('') : cell.source);
}

function testNotebookContainsFullCspProcess() {
  const notebook = generateCspNotebook(DEFAULT_CSP_CONFIG);
  const sources = sourcesOf(notebook);
  const allSource = sources.join('\n');

  assert.equal(notebook.nbformat, 4);
  assert.ok(allSource.includes('槽式太阳能光热发电'));
  assert.ok(allSource.includes('24 小时动态过程'));
  assert.ok(allSource.includes('solar_generation_and_charge'));
  assert.ok(allSource.includes('storage_discharge'));
  assert.ok(allSource.includes('curtailment'));
  assert.ok(allSource.includes('hot_tank_level_percent'));
  assert.ok(allSource.includes('daily_solar_to_electric_efficiency'));
  assert.ok(allSource.includes('运行模式时间轴'));
  assert.ok(!allSource.includes('run_simulation(params)'), 'the official example should expose process code directly');
}

function testNotebookIncludesParameterBindingMetadata() {
  const notebook = generateCspNotebook(DEFAULT_CSP_CONFIG);
  const bindings = notebook.metadata.simulation_param_bindings;

  assert.equal(bindings.version, 1);
  assert.equal(bindings.title, '参数层代码');
  assert.deepEqual(Object.keys(bindings.parameters).sort(), Object.keys(CSP_PARAMETER_BINDINGS).sort());
  assert.equal(bindings.parameters.collector_area.type, 'slider');
  assert.equal(bindings.parameters.storage_tank_volume.type, 'slider');
  assert.equal(bindings.parameters.solar_profile.type, 'dropdown');
  assert.ok(bindings.parameters.solar_profile.options.includes('summer_clear'));
}

function testGeneratedNotebookUsesTwentyFourHourSeries() {
  const notebook = generateCspNotebook(DEFAULT_CSP_CONFIG);
  const allSource = sourcesOf(notebook).join('\n');

  assert.ok(allSource.includes('hours = list(range(24))'));
  assert.ok(allSource.includes('dni_profiles'));
  assert.ok(allSource.includes('for hour, dni in enumerate(dni_series):'));
  assert.ok(allSource.includes('mode_by_hour.append(mode)'));
}

function testFilenameSanitization() {
  const filename = makeCspNotebookFilename('CSP/双罐:熔盐*示例?');

  assert.ok(filename.startsWith('official-thermal-csp_CSP_双罐_熔盐_示例_'));
  assert.ok(filename.endsWith('.ipynb'));
  assert.equal(/[\\/:*?"<>|]/.test(filename), false);
}

testNotebookContainsFullCspProcess();
testNotebookIncludesParameterBindingMetadata();
testGeneratedNotebookUsesTwentyFourHourSeries();
testFilenameSanitization();

console.log('official thermal CSP example tests passed');
