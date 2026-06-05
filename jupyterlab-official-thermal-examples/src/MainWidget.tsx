import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import { OfficialThermalExamplesApp } from './components/OfficialThermalExamplesApp';
import { saveAndOpenCspNotebook } from './notebook/fileService';

export class OfficialThermalExamplesWorkbench extends ReactWidget {
  private readonly app: JupyterFrontEnd;

  constructor(app: JupyterFrontEnd) {
    super();
    this.app = app;
    this.addClass('official-thermal-examples-workbench');
  }

  protected render(): React.ReactElement {
    return (
      <OfficialThermalExamplesApp
        onGenerate={async config => {
          await saveAndOpenCspNotebook(this.app, config);
        }}
      />
    );
  }
}
