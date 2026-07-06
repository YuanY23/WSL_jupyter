import type { TrainingApiClient } from '../api/client';
import {
  normalizeDirectiveText,
  parseSimlabVideoDirective,
  SimlabVideoDirective
} from './simlabVideoDirective';

type MediaBlobClient = Pick<TrainingApiClient, 'fetchMediaBlob'>;

export async function enhanceSimlabVideoDirectives(
  host: HTMLElement,
  api: MediaBlobClient
): Promise<void> {
  const targets = findDirectiveElements(host);
  await Promise.all(targets.map(async target => {
    const directive = parseSimlabVideoDirective(target.textContent ?? '');
    if (!directive) {
      return;
    }
    const player = await createPlayer(directive, api);
    target.replaceWith(player);
  }));
}

export function revokeSimlabVideoObjectUrls(host: HTMLElement): void {
  host.querySelectorAll<HTMLVideoElement>('video[data-object-url]').forEach(video => {
    const objectUrl = video.dataset.objectUrl;
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      delete video.dataset.objectUrl;
    }
  });
}

function findDirectiveElements(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll<HTMLElement>('p, pre')).filter(element => {
    const text = element.textContent ?? '';
    const normalized = normalizeDirectiveText(text);
    return normalized.startsWith('::simlab-video ')
      && normalized.endsWith(' ::')
      && parseSimlabVideoDirective(text) !== null;
  });
}

async function createPlayer(
  directive: SimlabVideoDirective,
  api: MediaBlobClient
): Promise<HTMLElement> {
  const figure = document.createElement('figure');
  figure.className = 'training-video-player';
  figure.dataset.mediaId = directive.mediaId;

  const caption = document.createElement('figcaption');
  caption.className = 'training-video-title';
  caption.textContent = directive.title;
  figure.appendChild(caption);

  const status = document.createElement('div');
  status.className = 'training-video-status';
  status.textContent = '正在加载视频...';
  figure.appendChild(status);

  try {
    const blob = await api.fetchMediaBlob(directive.mediaId);
    const objectUrl = URL.createObjectURL(blob);
    const video = document.createElement('video');
    video.controls = true;
    video.preload = 'metadata';
    video.src = objectUrl;
    video.dataset.objectUrl = objectUrl;
    figure.replaceChild(video, status);
  } catch {
    status.className = 'training-video-error';
    status.textContent = '视频加载失败，请确认媒体资源仍然存在。';
  }

  return figure;
}
