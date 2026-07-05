import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import {
  OfficialThermalExampleRequest,
  OfficialThermalExamplesApp
} from './components/OfficialThermalExamplesApp';
import { saveAndOpenCaesNotebook, saveAndOpenCspNotebook } from './notebook/fileService';

export class OfficialThermalExamplesWorkbench extends ReactWidget {
  private readonly app: JupyterFrontEnd;

  constructor(app: JupyterFrontEnd) {
    super();
    this.app = app;
    this.addClass('official-thermal-examples-workbench');
  }

  protected render(): React.ReactElement {
    const handleGenerate = async (request: OfficialThermalExampleRequest): Promise<void> => {
      if (request.kind === 'caes') {
        await saveAndOpenCaesNotebook(this.app, request.config);
        return;
      }
      await saveAndOpenCspNotebook(this.app, request.config);
    };

    return (
      <OfficialThermalExamplesApp
        onGenerate={handleGenerate}
      />
    );
  }
}
