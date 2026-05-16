import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import { SimulationPlatformApp } from './components/SimulationPlatformApp';
import { saveAndOpenNotebook } from './notebook/fileService';

export class SimulationPlatformWorkbench extends ReactWidget {
  private readonly app: JupyterFrontEnd;

  constructor(app: JupyterFrontEnd) {
    super();
    this.app = app;
    this.addClass('simulation-platform-workbench');
  }

  protected render(): React.ReactElement {
    return (
      <SimulationPlatformApp
        onGenerate={async config => {
          await saveAndOpenNotebook(this.app, config);
        }}
      />
    );
  }
}
