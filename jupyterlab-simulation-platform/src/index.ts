import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget, WidgetTracker } from '@jupyterlab/apputils';
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
  optional: [ILayoutRestorer],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    mainMenu: IMainMenu,
    restorer: ILayoutRestorer | null
  ) => {
    let widget: MainAreaWidget<Widget> | null = null;
    const tracker = new WidgetTracker<MainAreaWidget<Widget>>({
      namespace: 'simulation-platform-generator'
    });

    app.commands.addCommand(CommandIDs.openGenerator, {
      label: '打开通用仿真平台',
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new SimulationPlatformWorkbench(app);
          content.id = 'simulation-platform-generator';
          content.title.label = '通用仿真平台';
          content.title.closable = true;

          widget = new MainAreaWidget({ content });
          widget.id = 'simulation-platform-generator-main';
          widget.title.label = '通用仿真平台';
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
        command: CommandIDs.openGenerator,
        name: () => 'main'
      });
    }

    palette.addItem({
      command: CommandIDs.openGenerator,
      category: '通用仿真平台'
    });

    const simulationMenu = new Menu({ commands: app.commands });
    simulationMenu.id = 'simulation-platform-menu';
    simulationMenu.title.label = '通用仿真平台';
    simulationMenu.addItem({ command: CommandIDs.openGenerator });
    mainMenu.addMenu(simulationMenu, true, { rank: 5 });
  }
};

export default plugin;
