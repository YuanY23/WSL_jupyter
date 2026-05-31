import { IParsedParam } from './CellCodeParser';

/**
 * Updates a parameter's value inside a notebook cell code source.
 * Preserves the exact indentation, spacing, and comments.
 * Returns true if the update was successful.
 */
export function updateCellParamValue(
  notebook: any,
  param: IParsedParam,
  newValue: any
): boolean {
  if (!notebook || !notebook.widgets) {
    return false;
  }

  const cells = notebook.widgets;
  const cell = cells.find((c: any) => c.model && c.model.id === param.cellId);
  if (!cell) {
    console.error(`Cell with ID ${param.cellId} not found in notebook.`);
    return false;
  }

  const source = cell.model.sharedModel?.getSource() || '';
  const lines = source.split('\n');

  if (param.lineIndex < 0 || param.lineIndex >= lines.length) {
    console.error(`Line index ${param.lineIndex} is out of bounds for cell source.`);
    return false;
  }

  const targetLine = lines[param.lineIndex];

  // Regex to match variable assignment and the parameter comment
  const replaceRegex = /^(\s*[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*)(.+?)(\s*#\s*@param\s*\{.*\}\s*)$/;
  const lineMatch = targetLine.match(replaceRegex);

  if (!lineMatch) {
    console.error(`Line at index ${param.lineIndex} did not match parameter format:`, targetLine);
    return false;
  }

  // Double check variable name matches
  const varNameMatch = targetLine.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
  if (!varNameMatch || varNameMatch[1] !== param.variableName) {
    console.error(`Variable name mismatch. Expected: ${param.variableName}, Found: ${varNameMatch ? varNameMatch[1] : 'none'}`);
    return false;
  }

  // Format new value for Python syntax
  let newValueString = '';
  if (typeof newValue === 'boolean') {
    newValueString = newValue ? 'True' : 'False';
  } else if (typeof newValue === 'string') {
    const originalRaw = lineMatch[2].trim();
    if (originalRaw.startsWith("'")) {
      newValueString = `'${newValue}'`;
    } else {
      newValueString = `"${newValue}"`;
    }
  } else {
    newValueString = String(newValue);
  }

  const newLine = lineMatch[1] + newValueString + lineMatch[3];
  lines[param.lineIndex] = newLine;

  const newSource = lines.join('\n');
  if (cell.model.sharedModel) {
    cell.model.sharedModel.setSource(newSource);
    return true;
  }

  return false;
}
