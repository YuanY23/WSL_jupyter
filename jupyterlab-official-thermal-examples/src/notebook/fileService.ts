import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  CspExampleConfig,
  generateCspNotebook,
  makeCspNotebookFilename
} from '../csp/cspNotebookGenerator';

const RESULTS_DIR = 'official-thermal-examples-results';

async function ensureDirectory(app: JupyterFrontEnd, directoryName: string): Promise<void> {
  const contents = app.serviceManager.contents;
  try {
    await contents.get(directoryName);
  } catch (_error) {
    const newDirectory = await contents.newUntitled({ type: 'directory', path: '' });
    await contents.rename(newDirectory.path, directoryName);
  }
}

export async function saveAndOpenCspNotebook(app: JupyterFrontEnd, config: CspExampleConfig): Promise<string> {
  const contents = app.serviceManager.contents;
  await ensureDirectory(app, RESULTS_DIR);

  const notebook = generateCspNotebook(config);
  const filename = makeCspNotebookFilename(config.exampleName);
  const filePath = `${RESULTS_DIR}/${filename}`;

  const fileModel = await contents.save(filePath, {
    type: 'notebook',
    format: 'json',
    content: notebook
  });

  await app.commands.execute('docmanager:open', {
    path: fileModel.path
  });

  return fileModel.path;
}
