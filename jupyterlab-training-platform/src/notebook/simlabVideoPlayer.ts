import type { TrainingApiClient } from '../api/client';
import type { HlsMediaPlayback, MediaPlayback } from '../api/types';
import {
  normalizeDirectiveText,
  parseSimlabVideoDirective,
  SimlabVideoDirective
} from './simlabVideoDirective';

type MediaPlaybackClient = Pick<TrainingApiClient, 'fetchMediaBlob'>
  & Partial<Pick<TrainingApiClient, 'createMediaPlayback'>>;

interface AdaptiveRequest {
  headers: Record<string, string>;
}

interface AdaptiveNetworkingEngine {
  registerRequestFilter(
    filter: (requestType: unknown, request: AdaptiveRequest) => void | Promise<void>
  ): void;
}

interface AdaptivePlayer {
  getNetworkingEngine(): AdaptiveNetworkingEngine | null;
  load(uri: string): Promise<unknown>;
  destroy(): Promise<unknown> | void;
  getVariantTracks?(): AdaptiveVariantTrack[];
  configure?(config: Record<string, unknown>): void;
  selectVariantTrack?(track: AdaptiveVariantTrack, clearBuffer?: boolean): void;
}

interface AdaptiveVariantTrack {
  id: number;
  height?: number;
  bandwidth?: number;
  active?: boolean;
}

export interface SimlabVideoPlayerOptions {
  createAdaptivePlayer?: (video: HTMLVideoElement) => Promise<AdaptivePlayer>;
}

const adaptivePlayers = new WeakMap<HTMLVideoElement, AdaptivePlayer>();

export async function enhanceSimlabVideoDirectives(
  host: HTMLElement,
  api: MediaPlaybackClient,
  options: SimlabVideoPlayerOptions = {}
): Promise<void> {
  const targets = findDirectiveElements(host);
  await Promise.all(targets.map(async target => {
    const directive = parseSimlabVideoDirective(target.textContent ?? '');
    if (!directive) {
      return;
    }
    const player = await createPlayer(directive, api, options);
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
  host.querySelectorAll<HTMLVideoElement>('video[data-adaptive-player]').forEach(video => {
    const player = adaptivePlayers.get(video);
    if (player) {
      adaptivePlayers.delete(video);
      void Promise.resolve(player.destroy()).catch(() => undefined);
    }
    delete video.dataset.adaptivePlayer;
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
  api: MediaPlaybackClient,
  options: SimlabVideoPlayerOptions
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
    const playback = await resolvePlayback(api, directive.mediaId);
    if (playback.mode === 'hls') {
      await attachEncryptedHlsPlayer(figure, status, directive.mediaId, playback, api, options);
    } else {
      const blob = await api.fetchMediaBlob(directive.mediaId);
      const objectUrl = URL.createObjectURL(blob);
      const video = createVideoElement();
      video.src = objectUrl;
      video.dataset.objectUrl = objectUrl;
      figure.replaceChild(video, status);
    }
  } catch {
    Array.from(figure.querySelectorAll('video')).forEach(video => video.remove());
    status.className = 'training-video-error';
    status.textContent = '视频加载失败，请确认媒体资源仍然存在。';
    if (!figure.contains(status)) {
      figure.appendChild(status);
    }
  }

  return figure;
}

async function resolvePlayback(
  api: MediaPlaybackClient,
  mediaId: string
): Promise<MediaPlayback> {
  if (api.createMediaPlayback) {
    return api.createMediaPlayback(mediaId);
  }
  return { mode: 'blob', content_url: '' };
}

async function attachEncryptedHlsPlayer(
  figure: HTMLElement,
  status: HTMLElement,
  mediaId: string,
  initialPlayback: HlsMediaPlayback,
  api: MediaPlaybackClient,
  options: SimlabVideoPlayerOptions
): Promise<void> {
  const video = createVideoElement();
  video.dataset.adaptivePlayer = 'true';
  figure.replaceChild(video, status);
  const createAdaptivePlayer = options.createAdaptivePlayer ?? defaultAdaptivePlayerFactory;
  const player = await createAdaptivePlayer(video);
  adaptivePlayers.set(video, player);
  try {
    let playback = initialPlayback;
    const networkingEngine = player.getNetworkingEngine();
    if (!networkingEngine) {
      throw new Error('Adaptive player networking engine is unavailable');
    }
    networkingEngine.registerRequestFilter(async (_requestType, request) => {
      if (playback.expires_at * 1000 <= Date.now() + 30_000) {
        if (!api.createMediaPlayback) {
          throw new Error('Playback token cannot be refreshed');
        }
        const refreshed = await api.createMediaPlayback(mediaId);
        if (refreshed.mode !== 'hls') {
          throw new Error('Encrypted playback is no longer available');
        }
        playback = refreshed;
      }
      request.headers['X-SimLab-Playback-Token'] = playback.playback_token;
    });
    await player.load(playback.manifest_url);
    attachQualityControl(figure, player);
  } catch (error) {
    adaptivePlayers.delete(video);
    await player.destroy();
    throw error;
  }
}

function attachQualityControl(figure: HTMLElement, player: AdaptivePlayer): void {
  if (!player.getVariantTracks || !player.configure || !player.selectVariantTrack) {
    return;
  }
  const tracks = player.getVariantTracks().filter(track => Number.isFinite(track.height));
  const tracksByHeight = new Map<number, AdaptiveVariantTrack>();
  tracks.forEach(track => {
    const height = track.height as number;
    const existing = tracksByHeight.get(height);
    if (!existing || (track.bandwidth ?? 0) > (existing.bandwidth ?? 0)) {
      tracksByHeight.set(height, track);
    }
  });
  const heights = Array.from(tracksByHeight.keys()).sort((left, right) => right - left);
  if (heights.length < 2) {
    return;
  }

  const control = document.createElement('div');
  control.className = 'training-video-quality';
  const label = document.createElement('label');
  label.textContent = '清晰度';
  const select = document.createElement('select');
  select.setAttribute('aria-label', '视频清晰度');
  select.dataset.videoQuality = 'true';
  select.appendChild(createSelectOption('自动', 'auto'));
  heights.forEach(height => select.appendChild(createSelectOption(`${height}p`, String(height))));
  select.addEventListener('change', () => {
    if (select.value === 'auto') {
      player.configure?.({ abr: { enabled: true } });
      return;
    }
    const track = tracksByHeight.get(Number(select.value));
    if (!track) {
      return;
    }
    player.configure?.({ abr: { enabled: false } });
    player.selectVariantTrack?.(track, true);
  });
  label.appendChild(select);
  control.appendChild(label);
  figure.appendChild(control);
}

function createSelectOption(label: string, value: string): HTMLOptionElement {
  const option = document.createElement('option');
  option.textContent = label;
  option.value = value;
  return option;
}

function createVideoElement(): HTMLVideoElement {
  const video = document.createElement('video');
  video.controls = true;
  video.preload = 'metadata';
  return video;
}

async function defaultAdaptivePlayerFactory(video: HTMLVideoElement): Promise<AdaptivePlayer> {
  const shakaModule = await import('shaka-player');
  shakaModule.default.polyfill.installAll();
  if (!shakaModule.default.Player.isBrowserSupported()) {
    throw new Error('This browser does not support encrypted HLS playback');
  }
  return new shakaModule.default.Player(video) as unknown as AdaptivePlayer;
}
