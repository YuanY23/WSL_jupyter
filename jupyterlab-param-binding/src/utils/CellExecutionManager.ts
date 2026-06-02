import { Notebook, NotebookActions } from '@jupyterlab/notebook';

export async function runCellAndDownstream(
  notebook: Notebook,
  sessionContext: any,
  targetCellId: string | undefined,
  fallbackCellIndex: number
): Promise<void> {
  if (!notebook || !sessionContext) {
    return;
  }

  const cells = notebook.widgets;
  let targetIndex = -1;
  if (targetCellId) {
    targetIndex = cells.findIndex((cell: any) => cell.model && cell.model.id === targetCellId);
  }
  if (targetIndex === -1) {
    targetIndex = fallbackCellIndex;
  }
  if (targetIndex < 0 || targetIndex >= cells.length) {
    return;
  }

  const cellsToRun = cells.slice(targetIndex);

  try {
    await NotebookActions.runCells(notebook, cellsToRun, sessionContext);
  } catch (error) {
    console.error('Failed to run parameter region and downstream cells:', error);
  }
}
