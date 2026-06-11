import { JupyterFrontEnd } from '@jupyterlab/application';
import { makeNotebookFilename } from './filename';
import { generateSimulationNotebook } from './notebookFactory';
import { SimulationConfig } from '../templates/types';

const RESULTS_DIR = 'simulation-platform-results';

async function ensureDirectory(app: JupyterFrontEnd, directoryName: string): Promise<void> {
  const contents = app.serviceManager.contents;
  try {
    await contents.get(directoryName);
  } catch (_error) {
    const newDirectory = await contents.newUntitled({ type: 'directory', path: '' });
    await contents.rename(newDirectory.path, directoryName);
  }
}

export async function saveAndOpenNotebook(app: JupyterFrontEnd, config: SimulationConfig): Promise<string> {
  const contents = app.serviceManager.contents;
  await ensureDirectory(app, RESULTS_DIR);

  const notebook = generateSimulationNotebook(config.templateId, config);
  const filename = makeNotebookFilename(config.templateId, config.simulationName);
  const filePath = `${RESULTS_DIR}/${filename}`;

  const fileModel = await contents.save(filePath, {
    type: 'notebook',
    format: 'json',
    content: notebook
  });

  await app.commands.execute('docmanager:open', {
    path: fileModel.path,
    options: {
      activate: false
    }
  });

  return fileModel.path;
}
