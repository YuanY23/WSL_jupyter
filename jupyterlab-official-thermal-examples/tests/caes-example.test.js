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

function assertRequiredSliders(bindings) {
  for (const name of requiredSliders) {
    assert.ok(bindings[name], `${name} should have binding metadata`);
    assert.equal(bindings[name].type, 'slider', `${name} should be a slider`);
    assert.equal(typeof bindings[name].min, 'number', `${name} should have numeric min`);
    assert.equal(typeof bindings[name].max, 'number', `${name} should have numeric max`);
    assert.equal(typeof bindings[name].step, 'number', `${name} should have numeric step`);
    assert.ok(bindings[name].group, `${name} should have a group`);
  }
}

function testPythonNotebookContainsFullCaesProcess() {
  const notebook = generateCaesNotebook({ ...DEFAULT_CAES_CONFIG, language: 'python' });
  const allSource = sourcesOf(notebook).join('\n');

  assert.equal(notebook.nbformat, 4);
  assert.equal(notebook.metadata.kernelspec.language, 'python');
  assert.ok(allSource.includes('压缩空气储能仿真'));
  assert.ok(allSource.includes('AA-CAES'));
  assert.ok(allSource.includes('模型 1：压缩机单级模型'));
  assert.ok(allSource.includes('模型 4：定容储气罐动态模型'));
  assert.ok(allSource.includes('def compressor_stage'));
  assert.ok(allSource.includes('def run_caes_cycle'));
  assert.ok(allSource.includes('round_trip_efficiency'));
  assert.ok(allSource.includes("operation_profile = 'charge_hold_discharge'"));
  assert.ok(!allSource.includes('renewable_surplus_peak_discharge'));
}

function testJuliaNotebookContainsFullCaesProcess() {
  const notebook = generateCaesNotebook({ ...DEFAULT_CAES_CONFIG, language: 'julia' });
  const allSource = sourcesOf(notebook).join('\n');

  assert.equal(notebook.nbformat, 4);
  assert.equal(notebook.metadata.kernelspec.language, 'julia');
  assert.ok(allSource.includes('压缩空气储能仿真 Julia 版'));
  assert.ok(allSource.includes('AA-CAES'));
  assert.ok(allSource.includes('模型 1：压缩机单级模型'));
  assert.ok(allSource.includes('模型 5：热储能 TES 动态模型'));
  assert.ok(allSource.includes('function compressor_stage'));
  assert.ok(allSource.includes('function run_caes_cycle'));
  assert.ok(allSource.includes('round_trip_efficiency'));
  assert.ok(allSource.includes('operation_profile = "charge_hold_discharge"'));
  assert.ok(!allSource.includes('renewable_surplus_peak_discharge'));
}

function testNotebookIncludesParameterBindingMetadata() {
  const notebook = generateCaesNotebook(DEFAULT_CAES_CONFIG);
  const bindings = notebook.metadata.simulation_param_bindings;

  assert.equal(bindings.version, 1);
  assert.equal(bindings.title, '参数层代码');
  assert.deepEqual(Object.keys(bindings.parameters).sort(), Object.keys(CAES_PARAMETER_BINDINGS).sort());
  assertRequiredSliders(bindings.parameters);
  assert.equal(bindings.parameters.operation_profile.type, 'dropdown');
  assert.deepEqual(bindings.parameters.operation_profile.options, ['charge_hold_discharge']);
  assert.equal(bindings.parameters.ambient_pressure_bar.group, '02 环境参数');
  assert.equal(bindings.parameters.compressor_efficiency.group, '03 压缩机与电动机');
  assert.equal(bindings.parameters.expander_efficiency.group, '07 膨胀机与发电机');
}

function testFilenameSanitization() {
  const pythonFilename = makeCaesNotebookFilename({
    ...DEFAULT_CAES_CONFIG,
    language: 'python',
    exampleName: 'CAES/压缩空气:储能*仿真?'
  });
  const juliaFilename = makeCaesNotebookFilename({
    ...DEFAULT_CAES_CONFIG,
    language: 'julia',
    exampleName: 'CAES/压缩空气:储能*仿真?'
  });

  assert.ok(pythonFilename.startsWith('official-thermal-caes-python_CAES_压缩空气_储能_仿真_'));
  assert.ok(juliaFilename.startsWith('official-thermal-caes-julia_CAES_压缩空气_储能_仿真_'));
  assert.ok(pythonFilename.endsWith('.ipynb'));
  assert.ok(juliaFilename.endsWith('.ipynb'));
  assert.equal(/[\\/:*?"<>|]/.test(pythonFilename), false);
  assert.equal(/[\\/:*?"<>|]/.test(juliaFilename), false);
}

testPythonNotebookContainsFullCaesProcess();
testJuliaNotebookContainsFullCaesProcess();
testNotebookIncludesParameterBindingMetadata();
testFilenameSanitization();

console.log('official thermal CAES example tests passed');
