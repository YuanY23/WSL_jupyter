import { NotebookCell, NotebookModel } from '../templates/types';

function splitSource(source: string): string[] {
  return source.split('\n').map(line => `${line}\n`);
}

export function markdownCell(source: string): NotebookCell {
  return {
    cell_type: 'markdown',
    metadata: {},
    source: splitSource(source)
  };
}

export function codeCell(source: string): NotebookCell {
  return {
    cell_type: 'code',
    execution_count: null,
    metadata: {},
    outputs: [],
    source: splitSource(source)
  };
}

export function makeNotebook(cells: NotebookCell[]): NotebookModel {
  return {
    cells,
    metadata: {
      kernelspec: {
        display_name: 'Python 3 (ipykernel)',
        language: 'python',
        name: 'python3'
      },
      language_info: {
        name: 'python',
        version: '3.10.0',
        mimetype: 'text/x-python',
        file_extension: '.py'
      }
    },
    nbformat: 4,
    nbformat_minor: 5
  };
}
