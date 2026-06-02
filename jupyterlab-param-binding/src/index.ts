import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { LabIcon } from '@jupyterlab/ui-components';
import React from 'react';
import { ParamSidebar } from './components/ParamSidebar';

export const paramBindingIcon = new LabIcon({
  name: 'param-binding:sliders-icon',
  svgstr: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"/>
    <line x1="4" y1="10" x2="4" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12" y2="3"/>
    <line x1="20" y1="21" x2="20" y2="16"/>
    <line x1="20" y1="12" x2="20" y2="3"/>
    <line x1="1" y1="14" x2="7" y2="14"/>
    <line x1="9" y1="8" x2="15" y2="8"/>
    <line x1="17" y1="16" x2="23" y2="16"/>
  </svg>`
});

class ParamBindingSidebarWidget extends ReactWidget {
  constructor(private tracker: INotebookTracker) {
    super();
    this.id = 'jupyterlab-param-binding:sidebar';
    this.title.icon = paramBindingIcon;
    this.title.caption = '参数自动绑定';
    this.title.label = '';

    this.tracker.currentChanged.connect(() => {
      this.update();
    });
  }

  protected render(): React.ReactElement<any> {
    return React.createElement(ParamSidebar, {
      notebookPanel: this.tracker.currentWidget
    });
  }
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-param-binding:plugin',
  description: 'Generic parameter binding sidebar for Notebook simulation templates',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, tracker: INotebookTracker) => {
    const sidebarWidget = new ParamBindingSidebarWidget(tracker);
    app.shell.add(sidebarWidget, 'left', { rank: 1000 });
  }
};

export default plugin;
