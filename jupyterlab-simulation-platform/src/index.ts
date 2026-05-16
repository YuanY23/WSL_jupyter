import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu, Widget } from '@lumino/widgets';
import { SimulationPlatformWorkbench } from './MainWidget';

const CommandIDs = {
  openGenerator: 'simulation-platform:open-generator'
};

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-simulation-platform:plugin',
  description: 'Template-based visible-code simulation Notebook generator',
  autoStart: true,
  requires: [ICommandPalette, IMainMenu],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    mainMenu: IMainMenu
  ) => {
    let widget: MainAreaWidget<Widget> | null = null;

    app.commands.addCommand(CommandIDs.openGenerator, {
      label: '仿真模板生成器',
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new SimulationPlatformWorkbench(app);
          content.id = 'simulation-platform-generator';
          content.title.label = '仿真模板生成器';
          content.title.closable = true;

          widget = new MainAreaWidget({ content });
          widget.id = 'simulation-platform-generator-main';
          widget.title.label = '仿真模板生成器';
          widget.title.closable = true;
        }

        if (!widget.isAttached) {
          app.shell.add(widget, 'main');
        }
        app.shell.activateById(widget.id);
      }
    });

    palette.addItem({
      command: CommandIDs.openGenerator,
      category: '仿真平台'
    });

    const simulationMenu = new Menu({ commands: app.commands });
    simulationMenu.id = 'simulation-platform-menu';
    simulationMenu.title.label = '仿真平台';
    simulationMenu.addItem({ command: CommandIDs.openGenerator });
    mainMenu.addMenu(simulationMenu);
  }
};

export default plugin;
