import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget, ReactWidget, WidgetTracker } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Menu, Widget } from '@lumino/widgets';
import React from 'react';
import { TrainingApiClient } from './api/client';
import { CurrentUser, TrainingCourse, TrainingSection, TutorialSummary } from './api/types';
import { AdminManager } from './components/AdminManager';
import { CommentPanel } from './components/CommentPanel';
import { TrainingBrowser } from './components/TrainingBrowser';
import { copyTutorialToWorkspace } from './notebook/copyTutorial';
import { extractTutorialMetadata, shouldOpenCommentPanel, TutorialMetadata } from './notebook/tutorialMetadata';

const CommandIDs = {
  openTrainingBrowser: 'training-platform:open-browser',
  openAdminManager: 'training-platform:open-admin',
  openCommentPanel: 'training-platform:open-comments'
};

class TrainingBrowserWidget extends ReactWidget {
  constructor(private readonly app: JupyterFrontEnd, private readonly api: TrainingApiClient) {
    super();
    this.addClass('training-platform-widget');
  }

  protected render(): React.ReactElement {
    return (
      <TrainingBrowser
        api={this.api}
        onOpenTutorial={async (course: TrainingCourse, section: TrainingSection, tutorial: TutorialSummary) => {
          const notebook = await this.api.getTutorialContent(tutorial.public_id);
          await copyTutorialToWorkspace(this.app, course, section, tutorial, notebook);
        }}
      />
    );
  }
}

class AdminManagerWidget extends ReactWidget {
  constructor(private readonly api: TrainingApiClient) {
    super();
    this.addClass('training-platform-widget');
  }

  protected render(): React.ReactElement {
    return <AdminManager api={this.api} />;
  }
}

class CommentPanelWidget extends ReactWidget {
  private currentUser: CurrentUser | null = null;
  private tutorial: TutorialMetadata | null = null;

  constructor(private readonly api: TrainingApiClient) {
    super();
    this.id = 'training-platform-comment-panel';
    this.title.label = '评论';
    this.title.caption = '学习课程评论区';
    this.addClass('training-comment-widget');
  }

  setUser(user: CurrentUser | null): void {
    this.currentUser = user;
    this.update();
  }

  setTutorial(tutorial: TutorialMetadata | null): void {
    this.tutorial = tutorial;
    this.update();
  }

  protected render(): React.ReactElement {
    return <CommentPanel api={this.api} user={this.currentUser} tutorial={this.tutorial} />;
  }
}

interface MetadataReader {
  metadata?: unknown;
  getMetadata?: (key?: string) => unknown;
  metadataChanged?: {
    connect: (slot: () => void) => void;
  };
  sharedModel?: MetadataReader;
}

function metadataReader(panel: NotebookPanel | null): MetadataReader | null {
  return panel?.content.model as MetadataReader | null;
}

function extractPanelTutorialMetadata(panel: NotebookPanel | null): TutorialMetadata | null {
  const model = metadataReader(panel);
  const sharedModel = model?.sharedModel as {
    metadata?: unknown;
    getMetadata?: (key?: string) => unknown;
  } | undefined;

  const candidates = [
    model?.getMetadata?.('simlab_tutorial'),
    model?.metadata,
    sharedModel?.getMetadata?.('simlab_tutorial'),
    sharedModel?.metadata,
    sharedModel?.getMetadata?.()
  ];

  for (const candidate of candidates) {
    const tutorial = extractTutorialMetadata(candidate);
    if (tutorial) {
      return tutorial;
    }
  }

  return null;
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-training-platform:plugin',
  description: 'Public training tutorial browser, admin manager, and tutorial comments',
  autoStart: true,
  requires: [ICommandPalette, IMainMenu, INotebookTracker],
  activate: async (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    mainMenu: IMainMenu,
    notebookTracker: INotebookTracker
  ) => {
    const api = new TrainingApiClient();
    let currentUser: CurrentUser | null = null;
    try {
      currentUser = await api.getMe();
    } catch (_error) {
      currentUser = null;
    }

    const browserTracker = new WidgetTracker<MainAreaWidget<Widget>>({
      namespace: 'training-platform-browser'
    });
    const adminTracker = new WidgetTracker<MainAreaWidget<Widget>>({
      namespace: 'training-platform-admin'
    });
    let browserWidget: MainAreaWidget<Widget> | null = null;
    let adminWidget: MainAreaWidget<Widget> | null = null;
    const commentsWidget = new CommentPanelWidget(api);
    commentsWidget.setUser(currentUser);

    app.commands.addCommand(CommandIDs.openTrainingBrowser, {
      label: '打开学习课程',
      execute: () => {
        if (!browserWidget || browserWidget.isDisposed) {
          const content = new TrainingBrowserWidget(app, api);
          content.id = 'training-platform-browser';
          content.title.label = '学习课程';
          content.title.closable = true;
          browserWidget = new MainAreaWidget({ content });
          browserWidget.id = 'training-platform-browser-main';
          browserWidget.title.label = '学习课程';
          browserWidget.title.closable = true;
        }
        if (!browserTracker.has(browserWidget)) {
          void browserTracker.add(browserWidget);
        }
        if (!browserWidget.isAttached) {
          app.shell.add(browserWidget, 'main', { mode: 'tab-after', activate: true });
        }
        app.shell.activateById(browserWidget.id);
      }
    });

    app.commands.addCommand(CommandIDs.openAdminManager, {
      label: '打开课程管理',
      isVisible: () => Boolean(currentUser?.is_admin),
      execute: () => {
        if (!adminWidget || adminWidget.isDisposed) {
          const content = new AdminManagerWidget(api);
          content.id = 'training-platform-admin';
          content.title.label = '课程管理';
          content.title.closable = true;
          adminWidget = new MainAreaWidget({ content });
          adminWidget.id = 'training-platform-admin-main';
          adminWidget.title.label = '课程管理';
          adminWidget.title.closable = true;
        }
        if (!adminTracker.has(adminWidget)) {
          void adminTracker.add(adminWidget);
        }
        if (!adminWidget.isAttached) {
          app.shell.add(adminWidget, 'main', { mode: 'tab-after', activate: true });
        }
        app.shell.activateById(adminWidget.id);
      }
    });

    app.commands.addCommand(CommandIDs.openCommentPanel, {
      label: '评论',
      execute: () => {
        if (!commentsWidget.isAttached) {
          app.shell.add(commentsWidget, 'right', { rank: 650 });
        }
        app.shell.activateById(commentsWidget.id);
      }
    });

    if (!commentsWidget.isAttached) {
      app.shell.add(commentsWidget, 'right', { rank: 650 });
    }

    palette.addItem({ command: CommandIDs.openTrainingBrowser, category: '学习课程' });
    if (currentUser?.is_admin) {
      palette.addItem({ command: CommandIDs.openAdminManager, category: '课程管理' });
    }

    const trainingMenu = new Menu({ commands: app.commands });
    trainingMenu.id = 'training-platform-menu';
    trainingMenu.title.label = '学习课程';
    trainingMenu.addItem({ command: CommandIDs.openTrainingBrowser });
    mainMenu.addMenu(trainingMenu, true, { rank: 7.5 });

    if (currentUser?.is_admin) {
      const adminMenu = new Menu({ commands: app.commands });
      adminMenu.id = 'training-platform-admin-menu';
      adminMenu.title.label = '课程管理';
      adminMenu.addItem({ command: CommandIDs.openAdminManager });
      mainMenu.addMenu(adminMenu, true, { rank: 7.6 });
    }

    const observedPanels = new WeakSet<NotebookPanel>();

    function refreshCommentPanel(panel: NotebookPanel | null): void {
      if (panel && panel !== notebookTracker.currentWidget) {
        return;
      }
      const tutorial = extractPanelTutorialMetadata(panel);
      commentsWidget.setTutorial(tutorial);
      if (shouldOpenCommentPanel(tutorial)) {
        void app.commands.execute(CommandIDs.openCommentPanel);
      }
    }

    function observePanel(panel: NotebookPanel | null): void {
      if (!panel || observedPanels.has(panel)) {
        return;
      }
      observedPanels.add(panel);
      const model = metadataReader(panel);
      model?.metadataChanged?.connect(() => refreshCommentPanel(panel));
      model?.sharedModel?.metadataChanged?.connect(() => refreshCommentPanel(panel));
      void panel.context.ready.then(() => {
        refreshCommentPanel(panel);
      }).catch(() => undefined);
    }

    notebookTracker.currentChanged.connect((_sender: INotebookTracker, panel: NotebookPanel | null) => {
      observePanel(panel);
      refreshCommentPanel(panel);
    });
    observePanel(notebookTracker.currentWidget);
    refreshCommentPanel(notebookTracker.currentWidget);
  }
};

export default plugin;
