import { Notebook, NotebookActions } from '@jupyterlab/notebook';

/**
 * Executes a target cell and all subsequent (downstream) code cells in the notebook.
 * Restores the active cell index after execution completes.
 */
export async function runCellAndDownstream(
  notebook: Notebook,
  sessionContext: any,
  targetCellId: string
): Promise<void> {
  if (!notebook || !sessionContext) {
    return;
  }

  const cells = notebook.widgets;
  const targetIndex = cells.findIndex((c: any) => c.model && c.model.id === targetCellId);
  if (targetIndex === -1) {
    console.error(`Target cell ${targetCellId} not found in notebook.`);
    return;
  }

  const cellsToRun = cells.slice(targetIndex);

  try {
    // Run the specified cells
    await NotebookActions.runCells(notebook, cellsToRun, sessionContext);
  } catch (err) {
    console.error('Failed to run downstream cells:', err);
  }
}
