export interface TutorialMetadata {
  tutorialId: string;
  title: string;
  version: string;
}

interface RawTutorialMetadata {
  enabled?: unknown;
  tutorial_id?: unknown;
  title?: unknown;
  version?: unknown;
}

export function extractTutorialMetadata(metadata: unknown): TutorialMetadata | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }
  const record = metadata as { simlab_tutorial?: RawTutorialMetadata };
  const tutorial = record.simlab_tutorial ?? (metadata as RawTutorialMetadata);
  if (!tutorial || tutorial.enabled !== true || typeof tutorial.tutorial_id !== 'string' || !tutorial.tutorial_id.trim()) {
    return null;
  }
  return {
    tutorialId: tutorial.tutorial_id,
    title: typeof tutorial.title === 'string' && tutorial.title.trim() ? tutorial.title : '学习课程',
    version: typeof tutorial.version === 'string' && tutorial.version.trim() ? tutorial.version : ''
  };
}

export function shouldOpenCommentPanel(metadata: TutorialMetadata | null): boolean {
  return metadata !== null;
}
