const assert = require('node:assert/strict');
const path = require('node:path');

const libDir = process.env.THERMAL_TEST_LIB_DIR || path.join(__dirname, '..', 'lib');
const { generateNotebook } = require(path.join(libDir, 'utils', 'NotebookGenerator.js'));
const { THERMAL_RESULTS_DIR } = require(path.join(libDir, 'utils', 'resultsDirectory.js'));

function sourcesOf(notebook) {
  return notebook.cells.map(cell => Array.isArray(cell.source) ? cell.source.join('') : cell.source);
}

function testThermalGeneratorUsesEditableSliderRangesAndSingleParameterCell() {
  const notebook = generateNotebook('steady_flat_plate', {
    values: {
      thickness: 0.2,
      thermal_conductivity: 120,
      temp_left: 80,
      temp_right: 25
    },
    controls: {
      thickness: { min: 0.02, max: 0.8, step: 0.02 },
      thermal_conductivity: { min: 10, max: 300, step: 5 },
      temp_left: { min: 0, max: 200, step: 2 },
      temp_right: { min: 0, max: 200, step: 2 }
    }
  });

  const sources = sourcesOf(notebook);
  const parameterHeadingIndex = sources.findIndex(source => source.includes('参数层代码'));
  assert.notEqual(parameterHeadingIndex, -1);

  const parameterCodeCells = [];
  for (let index = parameterHeadingIndex + 1; index < notebook.cells.length; index += 1) {
    const cell = notebook.cells[index];
    const source = sources[index];
    if (cell.cell_type === 'markdown' && /^##\s+\d+\./.test(source.trim())) {
      break;
    }
    if (cell.cell_type === 'code') {
      parameterCodeCells.push(cell);
    }
  }

  assert.equal(parameterCodeCells.length, 1);
  const parameterSource = parameterCodeCells[0].source.join('');
  assert.ok(parameterSource.includes('L = 0.2'));
  assert.ok(parameterSource.includes('k = 120'));
  assert.ok(parameterSource.includes('T_left = 80'));
  assert.ok(parameterSource.includes('T_right = 25'));
  assert.ok(parameterSource.includes('N = 50'));

  const bindings = notebook.metadata.simulation_param_bindings.parameters;
  assert.equal(bindings.L.type, 'slider');
  assert.equal(bindings.L.min, 0.02);
  assert.equal(bindings.L.max, 0.8);
  assert.equal(bindings.L.step, 0.02);
  assert.equal(bindings.k.min, 10);
  assert.equal(bindings.k.max, 300);
  assert.equal(bindings.k.step, 5);
}

function testThermalResultsUseSharedSimulationResultsDirectory() {
  assert.equal(THERMAL_RESULTS_DIR, 'simulation-platform-results');
}

testThermalGeneratorUsesEditableSliderRangesAndSingleParameterCell();
testThermalResultsUseSharedSimulationResultsDirectory();

console.log('thermal notebook generator tests passed');
