export interface SimlabVideoDirective {
  mediaId: string;
  title: string;
  raw: string;
}

const DIRECTIVE_PATTERN = /::simlab-video\b[\s\S]*?::/g;
const MEDIA_ID_PATTERN = /\bmedia_id:\s*([A-Za-z0-9_-]+)/;
const MULTILINE_TITLE_PATTERN = /^title:\s*(.+)$/m;
const SINGLE_LINE_TITLE_PATTERN = /\btitle:\s*([\s\S]+)$/;

export function normalizeDirectiveText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function parseSimlabVideoDirectives(source: string): SimlabVideoDirective[] {
  const directives: SimlabVideoDirective[] = [];
  let match: RegExpExecArray | null;
  DIRECTIVE_PATTERN.lastIndex = 0;
  while ((match = DIRECTIVE_PATTERN.exec(source)) !== null) {
    const directive = parseSimlabVideoDirective(match[0]);
    if (directive) {
      directives.push(directive);
    }
  }
  return directives;
}

export function parseSimlabVideoDirective(source: string): SimlabVideoDirective | null {
  const raw = source.trim();
  if (!raw.startsWith('::simlab-video') || !raw.endsWith('::')) {
    return null;
  }

  const mediaMatch = MEDIA_ID_PATTERN.exec(raw);
  if (!mediaMatch) {
    return null;
  }

  const mediaId = mediaMatch[1];
  const body = raw
    .replace(/^::simlab-video\b/, '')
    .replace(/::$/, '')
    .trim();
  const multilineTitle = MULTILINE_TITLE_PATTERN.exec(body);
  const singleLineTitle = SINGLE_LINE_TITLE_PATTERN.exec(body);
  const title = (multilineTitle?.[1] ?? singleLineTitle?.[1] ?? mediaId).trim();

  return {
    mediaId,
    title: title || mediaId,
    raw
  };
}
