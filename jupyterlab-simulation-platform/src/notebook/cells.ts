import { NotebookCell, NotebookModel } from '../templates/types';

export type NotebookLanguage = 'python' | 'julia';

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

function notebookMetadata(language: NotebookLanguage): Record<string, unknown> {
  if (language === 'julia') {
    return {
      kernelspec: {
        display_name: 'Julia 1.12',
        language: 'julia',
        name: 'julia-1.12'
      },
      language_info: {
        name: 'julia',
        version: '1.12',
        mimetype: 'application/julia',
        file_extension: '.jl'
      }
    };
  }

  return {
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
  };
}

export function makeNotebook(cells: NotebookCell[], language: NotebookLanguage = 'python'): NotebookModel {
  return {
    cells,
    metadata: notebookMetadata(language),
    nbformat: 4,
    nbformat_minor: 5
  };
}
