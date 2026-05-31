import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget, ReactWidget } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Widget, Menu } from '@lumino/widgets';
import { INotebookTracker } from '@jupyterlab/notebook';
import { LabIcon } from '@jupyterlab/ui-components';
import React from 'react';

import { ThermalDesignWorkbench } from './MainWidget';
import { ParamSidebar } from './components/ParamSidebar';

const CommandIDs = {
    openWorkbench: 'thermal-design:open-workbench'
};

// Define custom sliders icon using SVG for absolute compatibility across JupyterLab versions
export const customSlidersIcon = new LabIcon({
    name: 'thermal-design:sliders-icon',
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

export class ParamSidebarWidget extends ReactWidget {
    private _tracker: INotebookTracker;

    constructor(tracker: INotebookTracker) {
        super();
        this.id = 'jupyterlab-thermal-design:param-sidebar';
        this.title.icon = customSlidersIcon;
        this.title.caption = '参数自动双向绑定';
        this.title.label = '';
        this._tracker = tracker;

        // Update widget when active notebook changes
        this._tracker.currentChanged.connect(() => {
            this.update();
        });
    }

    protected render(): React.ReactElement<any> {
        const currentNotebookPanel = this._tracker.currentWidget;
        // Use React.createElement directly inside .ts file to avoid JSX compiler errors
        return React.createElement(ParamSidebar, { notebookPanel: currentNotebookPanel });
    }
}

/**
 * Initialization data for the jupyterlab-thermal-design extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
    id: 'jupyterlab-thermal-design:plugin',
    description: 'Thermal Design Simulation',
    autoStart: true,
    requires: [ICommandPalette, IMainMenu, INotebookTracker],
    activate: (
        app: JupyterFrontEnd,
        palette: ICommandPalette,
        mainMenu: IMainMenu,
        tracker: INotebookTracker
    ) => {
        console.log('JupyterLab extension jupyterlab-thermal-design is activated!');

        let widget: MainAreaWidget<Widget>;

        // Add command
        app.commands.addCommand(CommandIDs.openWorkbench, {
            label: '打开仿真工作台',
            execute: () => {
                if (!widget || widget.isDisposed) {
                    const content = new ThermalDesignWorkbench(app);
                    content.id = 'thermal-design-workbench';
                    content.title.label = '热设计原理仿真工作台';
                    content.title.closable = true;

                    widget = new MainAreaWidget({ content });
                    widget.id = 'thermal-design-workbench-main';
                    widget.title.label = '热设计原理仿真工作台';
                    widget.title.closable = true;
                }

                if (!widget.isAttached) {
                    app.shell.add(widget, 'main');
                }
                app.shell.activateById(widget.id);
            }
        });

        // Add to palette
        palette.addItem({ command: CommandIDs.openWorkbench, category: 'Thermal Design' });

        // Add to main menu
        const thermalMenu = new Menu({ commands: app.commands });
        thermalMenu.id = 'thermal-design-menu';
        thermalMenu.title.label = '热设计仿真系统';
        thermalMenu.addItem({ command: CommandIDs.openWorkbench });

        mainMenu.addMenu(thermalMenu);

        // Add parameter sidebar to left shell panel
        const sidebarWidget = new ParamSidebarWidget(tracker);
        app.shell.add(sidebarWidget, 'left', { rank: 1000 });
    }
};

export default plugin;

