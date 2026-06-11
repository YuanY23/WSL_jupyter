import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget, WidgetTracker } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu, Widget } from '@lumino/widgets';
import { OfficialThermalExamplesWorkbench } from './MainWidget';

const CommandIDs = {
  openWorkbench: 'official-thermal-examples:open-workbench'
};

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-official-thermal-examples:plugin',
  description: 'Official visible-code thermal process modeling examples',
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
      namespace: 'official-thermal-examples'
    });

    app.commands.addCommand(CommandIDs.openWorkbench, {
      label: '打开官方热力建模示例',
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new OfficialThermalExamplesWorkbench(app);
          content.id = 'official-thermal-examples-workbench';
          content.title.label = '官方热力建模示例';
          content.title.closable = true;

          widget = new MainAreaWidget({ content });
          widget.id = 'official-thermal-examples-main';
          widget.title.label = '官方热力建模示例';
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

    palette.addItem({
      command: CommandIDs.openWorkbench,
      category: '官方热力建模示例'
    });

    const officialMenu = new Menu({ commands: app.commands });
    officialMenu.id = 'official-thermal-examples-menu';
    officialMenu.title.label = '官方热力建模示例';
    officialMenu.addItem({ command: CommandIDs.openWorkbench });
    mainMenu.addMenu(officialMenu, true, { rank: 7 });
  }
};

export default plugin;
