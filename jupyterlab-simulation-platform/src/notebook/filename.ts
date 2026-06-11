export function sanitizeFilenamePart(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return cleaned || 'simulation';
}

export function makeNotebookFilename(templateId: string, simulationName: string, date = new Date()): string {
  const timestamp = date.toISOString().slice(0, 23).replace(/[T:.]/g, '-');
  return `${sanitizeFilenamePart(templateId)}_${sanitizeFilenamePart(simulationName)}_${timestamp}.ipynb`;
}
