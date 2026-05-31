import { scanNotebookParams } from './CellCodeParser';
import { updateCellParamValue } from './CellCodeUpdater';

const mockNotebook = {
  widgets: [
    {
      model: {
        id: 'cell1',
        type: 'markdown',
        sharedModel: {
          getSource: () => '# 物理参数\n这里是物理参数说明。'
        }
      }
    },
    {
      model: {
        id: 'cell2',
        type: 'code',
        sharedModel: {
          source: 'k = 5.0  # @param {type:"slider", min:0.1, max:20.0, step:0.1, label:"热传导系数 (W/m·K)"}\nbc = "steady"  # @param {type:\'dropdown\', options:[\'steady\', \'transient\'], label:"边界条件"}\ngrid = True  # @param {type:"boolean", label:"网格背景"}\nsteps = 100  # @param {type:"number", min:10, max:1000, label:"迭代计算步数"}',
          getSource() { return this.source; },
          setSource(val: string) { this.source = val; }
        }
      }
    }
  ]
};

function runTests() {
  console.log('--- 1. Testing Scan Notebook ---');
  const params = scanNotebookParams(mockNotebook);
  console.log(`Parsed ${params.length} parameters:`);
  console.log(JSON.stringify(params, null, 2));

  // Assertions
  if (params.length !== 4) {
    throw new Error(`Expected 4 parameters, parsed ${params.length}`);
  }

  const kParam = params.find(p => p.variableName === 'k');
  if (!kParam || kParam.value !== 5.0 || kParam.metadata.type !== 'slider' || kParam.metadata.group !== '物理参数') {
    throw new Error('k parameter parsing verification failed');
  }

  const bcParam = params.find(p => p.variableName === 'bc');
  if (!bcParam || bcParam.value !== 'steady' || bcParam.metadata.type !== 'dropdown' || bcParam.metadata.options?.length !== 2) {
    throw new Error('bc parameter parsing verification failed');
  }

  const gridParam = params.find(p => p.variableName === 'grid');
  if (!gridParam || gridParam.value !== true || gridParam.metadata.type !== 'boolean') {
    throw new Error('grid parameter parsing verification failed');
  }

  console.log('Scan notebook test passed!');

  console.log('\n--- 2. Testing Update Cell Param Value ---');
  
  // Update slider variable
  const successK = updateCellParamValue(mockNotebook, kParam, 7.5);
  console.log('Update k to 7.5 success:', successK);
  console.log('Updated Cell Source:\n', mockNotebook.widgets[1].model.sharedModel.getSource());

  const updatedParams = scanNotebookParams(mockNotebook);
  const updatedK = updatedParams.find(p => p.variableName === 'k');
  if (!updatedK || updatedK.value !== 7.5) {
    throw new Error('Failed to update k parameter value or parse updated value');
  }

  // Update dropdown variable
  const successBc = updateCellParamValue(mockNotebook, bcParam, 'transient');
  console.log('Update bc to transient success:', successBc);
  console.log('Updated Cell Source:\n', mockNotebook.widgets[1].model.sharedModel.getSource());

  const updatedBc = scanNotebookParams(mockNotebook).find(p => p.variableName === 'bc');
  if (!updatedBc || updatedBc.value !== 'transient') {
    throw new Error('Failed to update bc parameter value or parse updated value');
  }

  // Update boolean variable
  const successGrid = updateCellParamValue(mockNotebook, gridParam, false);
  console.log('Update grid to false success:', successGrid);
  console.log('Updated Cell Source:\n', mockNotebook.widgets[1].model.sharedModel.getSource());

  const updatedGrid = scanNotebookParams(mockNotebook).find(p => p.variableName === 'grid');
  if (!updatedGrid || updatedGrid.value !== false) {
    throw new Error('Failed to update grid parameter value or parse updated value');
  }

  console.log('Update cell param value test passed!');
  console.log('\nALL TESTS PASSED SUCCESSFULLY!');
}

runTests();
