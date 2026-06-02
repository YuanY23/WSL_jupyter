const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  resolveNumericControlAttributes,
  scanParameterRegion,
  updateAssignmentSource
} = require('../lib/utils/parameterBinding.js');
const {
  updateNotebookBindingConfig
} = require('../lib/utils/notebookBinding.js');

function testScansPlainAssignmentsInsideParameterLayer() {
  const cells = [
    {
      cell_type: 'markdown',
      metadata: {},
      source: ['# Demo\n']
    },
    {
      cell_type: 'markdown',
      metadata: {},
      source: ['## 6. 参数层代码\n']
    },
    {
      cell_type: 'code',
      metadata: {},
      source: [
        'H = 0.01\n',
        'T_w = 3000\n',
        'enabled = True\n',
        'label = "case-a"\n',
        'profile = np.array([1, 2, 3])\n'
      ]
    },
    {
      cell_type: 'markdown',
      metadata: {},
      source: ['## 7. 模型层代码\n']
    },
    {
      cell_type: 'code',
      metadata: {},
      source: ['not_a_parameter = 5\n']
    }
  ];

  const params = scanParameterRegion(cells);

  assert.deepEqual(
    params.map(param => [param.variableName, param.value, param.valueType]),
    [
      ['H', 0.01, 'number'],
      ['T_w', 3000, 'number'],
      ['enabled', true, 'boolean'],
      ['label', 'case-a', 'string']
    ]
  );
  assert.equal(params.find(param => param.variableName === 'H').metadata.type, 'number');
  assert.equal(params.find(param => param.variableName === 'T_w').metadata.type, 'number');
}

function testUpdatesPlainAssignmentWithoutAddingParamComment() {
  const source = 'H = 0.01\nT_w = 3000';
  const updated = updateAssignmentSource(source, {
    lineIndex: 0,
    variableName: 'H',
    valueType: 'number'
  }, 0.05);

  assert.equal(updated, 'H = 0.05\nT_w = 3000');
  assert.equal(updated.includes('@param'), false);
}

function testBindingConfigRemovesUndefinedFields() {
  let savedMetadata = null;
  const notebookModel = {
    getMetadata() {
      return {
        version: 1,
        title: '参数层代码',
        parameters: {
          H: {
            type: 'slider',
            label: '板高',
            min: 0.01,
            max: 10,
            step: 0.01
          }
        }
      };
    },
    setMetadata(key, value) {
      savedMetadata = value;
    }
  };

  updateNotebookBindingConfig(notebookModel, 'H', { min: undefined, step: undefined });

  assert.equal(Object.prototype.hasOwnProperty.call(savedMetadata.parameters.H, 'min'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(savedMetadata.parameters.H, 'step'), false);
  assert.equal(savedMetadata.parameters.H.max, 10);
}

function testNumericControlAttributesStayValidForBadRangeConfig() {
  const attributes = resolveNumericControlAttributes(
    { min: 20, max: 10, step: 0 },
    11,
    '15'
  );

  assert.equal(attributes.min, 20);
  assert.equal(attributes.max > attributes.min, true);
  assert.equal(attributes.step > 0, true);
  assert.equal(attributes.rangeValue >= attributes.min, true);
  assert.equal(attributes.rangeValue <= attributes.max, true);
  assert.equal(attributes.inputValue, '15');
}

function testNumericControlAttributesClampFiniteValueToRange() {
  const attributes = resolveNumericControlAttributes(
    { min: 0, max: 10, step: 0.5 },
    15,
    15
  );

  assert.deepEqual(attributes, {
    min: 0,
    max: 10,
    step: 0.5,
    rangeValue: 10,
    inputValue: 15
  });
}

function testNumericControlAttributesLimitRangeSteps() {
  const attributes = resolveNumericControlAttributes(
    { min: 0, max: 100000000, step: 0.000001 },
    10,
    10
  );

  assert.equal((attributes.max - attributes.min) / attributes.step <= 10000, true);
  assert.equal(attributes.rangeValue, 10);
  assert.equal(attributes.inputValue, 10);
}

function testNumericControlAttributesSafeguardStepValues() {
  // Test case 1: Very small source value underflows during step inference
  const attrs1 = resolveNumericControlAttributes(
    undefined,
    1e-323
  );
  assert.ok(Number.isFinite(attrs1.step) && attrs1.step > 0);

  // Test case 2: Very small range and underflowing step
  const attrs2 = resolveNumericControlAttributes(
    { min: 0, max: 1e-320 },
    1e-323
  );
  assert.ok(Number.isFinite(attrs2.step) && attrs2.step > 0);

  // Test case 3: General positive check
  const attrs3 = resolveNumericControlAttributes(
    { min: 10, max: 20 },
    11
  );
  assert.ok(Number.isFinite(attrs3.step) && attrs3.step > 0);
}

function testConfigDetailsDoNotForceCloseAfterFirstSave() {
  const source = fs.readFileSync(
    path.join(__dirname, '../src/components/ParamSidebar.tsx'),
    'utf8'
  );

  assert.equal(source.includes('open={!param.configured}'), false);
  assert.equal(source.includes('expandedConfigDetails'), true);
  assert.equal(source.includes('open={isConfigDetailsOpen}'), true);
}

testScansPlainAssignmentsInsideParameterLayer();
testUpdatesPlainAssignmentWithoutAddingParamComment();
testBindingConfigRemovesUndefinedFields();
testNumericControlAttributesStayValidForBadRangeConfig();
testNumericControlAttributesClampFiniteValueToRange();
testNumericControlAttributesLimitRangeSteps();
testNumericControlAttributesSafeguardStepValues();
testConfigDetailsDoNotForceCloseAfterFirstSave();

console.log('param binding tests passed');
