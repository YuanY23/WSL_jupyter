import { MediaResource } from '../api/types';

export function buildMediaDirective(media: Pick<MediaResource, 'id' | 'title'>): string {
  return [
    '::simlab-video',
    `media_id: ${media.id}`,
    `title: ${media.title}`,
    '::'
  ].join('\n');
}

export function appendMediaDirective(source: string, directive: string): string {
  const trimmed = source.replace(/\s+$/, '');
  return trimmed ? `${trimmed}\n\n${directive}` : directive;
}
