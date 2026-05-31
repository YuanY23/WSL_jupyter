export interface IParamMetadata {
  type: 'slider' | 'dropdown' | 'number' | 'boolean';
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: any[];
  group?: string;
  [key: string]: any;
}

export interface IParsedParam {
  cellId: string;
  variableName: string;
  value: any;
  rawLineValue: string;
  lineIndex: number;
  metadata: IParamMetadata;
}

export const paramRegex = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+?)\s*#\s*@param\s*(\{.*\})\s*$/;

export function parseMetadata(metaStr: string): IParamMetadata {
  try {
    return JSON.parse(metaStr);
  } catch (e) {
    // Convert relaxed JSON (unquoted keys, single quotes) to strict JSON
    let strictStr = metaStr.trim();
    // Replace single quotes with double quotes
    strictStr = strictStr.replace(/'/g, '"');
    // Quote unquoted keys, e.g. {type:"slider"} -> {"type":"slider"}
    strictStr = strictStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
    try {
      return JSON.parse(strictStr);
    } catch (err) {
      console.error('Failed to parse metadata string:', metaStr, 'Strict form:', strictStr, err);
      return { type: 'number' }; // Fallback type
    }
  }
}

export function parsePythonValue(rawValue: string): any {
  const val = rawValue.trim();
  if (val === 'True') {
    return true;
  }
  if (val === 'False') {
    return false;
  }
  if (val === 'None') {
    return null;
  }
  // Check if it's a number
  if (!isNaN(Number(val))) {
    return Number(val);
  }
  // Check if it's a double-quoted string
  if (val.startsWith('"') && val.endsWith('"')) {
    return val.slice(1, -1);
  }
  // Check if it's a single-quoted string
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1);
  }
  return val;
}

/**
 * Scan notebook cells and extract param configurations.
 * Note: Cell and Notebook types are typed loosely (any) to avoid strict build-time dependency issues
 * when compiling outside of the Jupyter environment or in standalone test environments.
 */
export function scanNotebookParams(notebook: any): IParsedParam[] {
  const params: IParsedParam[] = [];
  if (!notebook || !notebook.widgets) {
    return params;
  }

  const cells = notebook.widgets;
  let currentGroup = '';

  cells.forEach((cell: any) => {
    if (!cell.model) {
      return;
    }

    if (cell.model.type === 'markdown') {
      const text = cell.model.sharedModel?.getSource() || '';
      // Find markdown heading (e.g. # Section Title)
      const match = text.match(/^#+\s*(.+)$/m);
      if (match) {
        currentGroup = match[1].trim();
      }
    } else if (cell.model.type === 'code') {
      const source = cell.model.sharedModel?.getSource() || '';
      const lines = source.split('\n');
      lines.forEach((line: string, lineIndex: number) => {
        const match = line.match(paramRegex);
        if (match) {
          const variableName = match[1].trim();
          const rawValue = match[2].trim();
          const metaStr = match[3].trim();

          const metadata = parseMetadata(metaStr);
          const value = parsePythonValue(rawValue);

          params.push({
            cellId: cell.model.id,
            variableName,
            value,
            rawLineValue: rawValue,
            lineIndex,
            metadata: {
              ...metadata,
              group: metadata.group || currentGroup
            }
          });
        }
      });
    }
  });

  return params;
}
