import { JupyterFrontEnd } from '@jupyterlab/application';
import { TrainingCourse, TrainingSection, TutorialSummary } from '../api/types';

async function ensureDirectory(app: JupyterFrontEnd, path: string): Promise<void> {
  const contents = app.serviceManager.contents;
  try {
    await contents.get(path);
  } catch (_error) {
    const parts = path.split('/').filter(Boolean);
    let current = '';
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      try {
        await contents.get(current);
      } catch (_nestedError) {
        const created = await contents.newUntitled({
          type: 'directory',
          path: current.includes('/') ? current.slice(0, current.lastIndexOf('/')) : ''
        });
        await contents.rename(created.path, current);
      }
    }
  }
}

export function safePathSegment(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim() || '未命名';
}

export async function copyTutorialToWorkspace(
  app: JupyterFrontEnd,
  course: TrainingCourse,
  section: TrainingSection,
  tutorial: TutorialSummary,
  notebook: Record<string, unknown>
): Promise<string> {
  const root = 'SimLab教程';
  const sectionName = `${section.sort_order || 0}-${safePathSegment(section.title)}`;
  const directory = `${root}/${safePathSegment(course.title)}/${sectionName}`;
  const filename = tutorial.notebook_filename
    ? safePathSegment(tutorial.notebook_filename)
    : `${tutorial.sort_order || 0}-${safePathSegment(tutorial.title)}.ipynb`;
  const filePath = `${directory}/${filename}`;
  await ensureDirectory(app, directory);

  const contents = app.serviceManager.contents;
  let shouldWrite = true;
  try {
    const existing = await contents.get(filePath, { content: true });
    const existingVersion = (existing.content?.metadata?.simlab_tutorial?.version ?? '') as string;
    const nextVersion = (notebook.metadata as { simlab_tutorial?: { version?: string } } | undefined)
      ?.simlab_tutorial?.version ?? '';
    if (existingVersion && existingVersion === nextVersion) {
      shouldWrite = false;
    } else if (!window.confirm('该教程已有旧版本副本。是否复制最新版？')) {
      shouldWrite = false;
    }
  } catch (_error) {
    shouldWrite = true;
  }

  if (shouldWrite) {
    await contents.save(filePath, {
      type: 'notebook',
      format: 'json',
      content: notebook
    });
  }

  await app.commands.execute('docmanager:open', { path: filePath });
  return filePath;
}
