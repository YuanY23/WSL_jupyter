import {
    ILayoutRestorer,
    JupyterFrontEnd,
    JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget, WidgetTracker } from '@jupyterlab/apputils';
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
    optional: [ILayoutRestorer],
    activate: (
        app: JupyterFrontEnd,
        palette: ICommandPalette,
        mainMenu: IMainMenu,
        restorer: ILayoutRestorer | null
    ) => {
        console.log('JupyterLab extension jupyterlab-thermal-design is activated!');

        let widget: MainAreaWidget<Widget> | null = null;
        const tracker = new WidgetTracker<MainAreaWidget<Widget>>({
            namespace: 'thermal-design-workbench'
        });

        // Add command
        app.commands.addCommand(CommandIDs.openWorkbench, {
            label: '打开传热仿真平台',
            execute: () => {
                if (!widget || widget.isDisposed) {
                    const content = new ThermalDesignWorkbench(app);
                    content.id = 'thermal-design-workbench';
                    content.title.label = '传热仿真平台';
                    content.title.closable = true;

                    widget = new MainAreaWidget({ content });
                    widget.id = 'thermal-design-workbench-main';
                    widget.title.label = '传热仿真平台';
                    widget.title.closable = true;
                }

                if (!tracker.has(widget)) {
                    void tracker.add(widget);
                }

                if (!widget.isAttached) {
                    app.shell.add(widget, 'main', {
                        mode: 'tab-after',
                        activate: true
                    });
                }
                app.shell.activateById(widget.id);
            }
        });

        if (restorer) {
            void restorer.restore(tracker, {
                command: CommandIDs.openWorkbench,
                name: () => 'main'
            });
        }

        // Add to palette
        palette.addItem({ command: CommandIDs.openWorkbench, category: 'Thermal Design' });

        // Add to main menu
        const thermalMenu = new Menu({ commands: app.commands });
        thermalMenu.id = 'thermal-design-menu';
        thermalMenu.title.label = '传热仿真平台';
        thermalMenu.addItem({ command: CommandIDs.openWorkbench });

        mainMenu.addMenu(thermalMenu, true, { rank: 6 });

    }
};

export default plugin;
