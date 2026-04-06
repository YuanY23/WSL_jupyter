import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Widget, Menu } from '@lumino/widgets';
import { ThermalDesignWorkbench } from './MainWidget';

const CommandIDs = {
    openWorkbench: 'thermal-design:open-workbench'
};

/**
 * Initialization data for the jupyterlab-thermal-design extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
    id: 'jupyterlab-thermal-design:plugin',
    description: 'Thermal Design Simulation',
    autoStart: true,
    requires: [ICommandPalette, IMainMenu],
    activate: (
        app: JupyterFrontEnd,
        palette: ICommandPalette,
        mainMenu: IMainMenu
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
    }
};

export default plugin;
