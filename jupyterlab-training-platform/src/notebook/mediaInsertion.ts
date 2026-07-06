import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { MediaResource } from '../api/types';
import { appendMediaDirective, buildMediaDirective } from './mediaDirective';

export async function insertMediaIntoCurrentNotebook(
  app: JupyterFrontEnd,
  notebookTracker: INotebookTracker,
  media: MediaResource
): Promise<string> {
  void app;
  const panel = notebookTracker.currentWidget;
  if (!panel) {
    return '请先打开一个教程 Notebook。';
  }
  await panel.context.ready;
  const activeCell = panel.content.activeCell;
  if (!activeCell) {
    return '请先选中要插入媒体资源的 cell。';
  }

  const directive = buildMediaDirective(media);
  const currentSource = activeCell.model.sharedModel.getSource();
  activeCell.model.sharedModel.setSource(appendMediaDirective(currentSource, directive));
  if (activeCell.model.type !== 'markdown') {
    NotebookActions.changeCellType(panel.content, 'markdown');
  }
  return `已插入媒体资源：${media.title}`;
}
