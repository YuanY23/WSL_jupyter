import { PageConfig } from '@jupyterlab/coreutils';
import {
  CreateCourseRequest,
  CreateSectionRequest,
  CurrentUser,
  MediaResource,
  PatchCourseRequest,
  PatchMediaResourceRequest,
  PatchSectionRequest,
  PatchTutorialRequest,
  TrainingCourse,
  TutorialComment,
  TutorialImportRequest,
  TutorialSummary
} from './types';

type RequestBody =
  | Record<string, unknown>
  | TutorialImportRequest
  | CreateCourseRequest
  | CreateSectionRequest
  | PatchCourseRequest
  | PatchMediaResourceRequest
  | PatchSectionRequest
  | PatchTutorialRequest;

export function normalizeApiBaseUrl(baseUrl: string, configuredUrl = ''): string {
  if (configuredUrl.trim()) {
    return configuredUrl.replace(/\/$/, '');
  }
  void baseUrl;
  return '/services/simlab-training/api';
}

export function authorizationHeaderFromToken(token = PageConfig.getToken()): Record<string, string> {
  const trimmed = token.trim();
  return trimmed ? { Authorization: `token ${trimmed}` } : {};
}

export class TrainingApiClient {
  readonly baseUrl: string;

  constructor(baseUrl = normalizeApiBaseUrl(
    PageConfig.getBaseUrl(),
    PageConfig.getOption('simlabTrainingApiUrl')
  )) {
    this.baseUrl = baseUrl;
  }

  async getMe(): Promise<CurrentUser> {
    return this.get<CurrentUser>('/me');
  }

  async getCourses(): Promise<TrainingCourse[]> {
    return this.get<TrainingCourse[]>('/courses');
  }

  async getTutorialContent(publicId: string): Promise<Record<string, unknown>> {
    return this.get<Record<string, unknown>>(`/tutorials/${encodeURIComponent(publicId)}/content`);
  }

  async getComments(publicId: string): Promise<TutorialComment[]> {
    return this.get<TutorialComment[]>(`/tutorials/${encodeURIComponent(publicId)}/comments`);
  }

  async createComment(publicId: string, content: string): Promise<TutorialComment> {
    return this.post<TutorialComment>(`/tutorials/${encodeURIComponent(publicId)}/comments`, { content });
  }

  async createReply(commentId: string, content: string): Promise<TutorialComment> {
    return this.post<TutorialComment>(`/comments/${encodeURIComponent(commentId)}/replies`, { content });
  }

  async likeComment(commentId: string): Promise<void> {
    await this.post(`/comments/${encodeURIComponent(commentId)}/like`, {});
  }

  async unlikeComment(commentId: string): Promise<void> {
    await this.request(`/comments/${encodeURIComponent(commentId)}/like`, { method: 'DELETE' });
  }

  async adminCreateCourse(payload: CreateCourseRequest): Promise<TrainingCourse> {
    return this.post<TrainingCourse>('/admin/courses', payload);
  }

  async adminGetCourses(): Promise<TrainingCourse[]> {
    return this.get<TrainingCourse[]>('/admin/courses');
  }

  async adminPatchCourse(courseId: string, payload: PatchCourseRequest): Promise<TrainingCourse> {
    return this.patch<TrainingCourse>(`/admin/courses/${encodeURIComponent(courseId)}`, payload);
  }

  async adminArchiveCourse(courseId: string): Promise<void> {
    await this.request(`/admin/courses/${encodeURIComponent(courseId)}`, { method: 'DELETE' });
  }

  async adminCreateSection(payload: CreateSectionRequest): Promise<{ id: string }> {
    return this.post<{ id: string }>('/admin/sections', payload);
  }

  async adminPatchSection(sectionId: string, payload: PatchSectionRequest): Promise<{ id: string }> {
    return this.patch<{ id: string }>(`/admin/sections/${encodeURIComponent(sectionId)}`, payload);
  }

  async adminArchiveSection(sectionId: string): Promise<void> {
    await this.request(`/admin/sections/${encodeURIComponent(sectionId)}`, { method: 'DELETE' });
  }

  async adminImportTutorial(payload: TutorialImportRequest): Promise<TutorialSummary> {
    return this.post<TutorialSummary>('/admin/tutorials/import', payload);
  }

  async adminUpdateTutorialVersion(publicId: string, payload: TutorialImportRequest): Promise<TutorialSummary> {
    return this.post<TutorialSummary>(`/admin/tutorials/${encodeURIComponent(publicId)}/versions`, payload);
  }

  async adminPatchTutorial(publicId: string, payload: PatchTutorialRequest): Promise<TutorialSummary> {
    return this.patch<TutorialSummary>(`/admin/tutorials/${encodeURIComponent(publicId)}`, payload);
  }

  async adminArchiveTutorial(publicId: string): Promise<void> {
    await this.request(`/admin/tutorials/${encodeURIComponent(publicId)}`, { method: 'DELETE' });
  }

  async adminLockComments(publicId: string, locked: boolean): Promise<void> {
    const suffix = locked ? 'lock-comments' : 'lock-comments';
    await this.request(`/admin/tutorials/${encodeURIComponent(publicId)}/${suffix}`, {
      method: locked ? 'POST' : 'DELETE'
    });
  }

  async adminSetCommentPin(commentId: string, pinned: boolean): Promise<void> {
    await this.request(`/admin/comments/${encodeURIComponent(commentId)}/pin`, {
      method: pinned ? 'POST' : 'DELETE'
    });
  }

  async adminSetCommentOfficial(commentId: string, official: boolean): Promise<void> {
    await this.request(`/admin/comments/${encodeURIComponent(commentId)}/official`, {
      method: official ? 'POST' : 'DELETE'
    });
  }

  async adminDeleteComment(commentId: string, reason = ''): Promise<void> {
    await this.request(`/admin/comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason })
    });
  }

  async adminListMedia(): Promise<MediaResource[]> {
    return this.get<MediaResource[]>('/admin/media');
  }

  async adminUploadMedia(file: File | Blob, title: string): Promise<MediaResource> {
    const form = new FormData();
    form.append('title', title);
    form.append('file', file);
    return this.requestForm<MediaResource>('/admin/media', form);
  }

  async adminRenameMedia(mediaId: string, title: string): Promise<MediaResource> {
    return this.patch<MediaResource>(`/admin/media/${encodeURIComponent(mediaId)}`, { title });
  }

  async adminDeleteMedia(mediaId: string): Promise<void> {
    await this.request(`/admin/media/${encodeURIComponent(mediaId)}`, { method: 'DELETE' });
  }

  mediaContentUrl(mediaId: string): string {
    return `${this.baseUrl}/media/${encodeURIComponent(mediaId)}/content`;
  }

  async fetchMediaBlob(mediaId: string): Promise<Blob> {
    const response = await fetch(this.mediaContentUrl(mediaId), {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        ...authorizationHeaderFromToken()
      }
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`请求失败 ${response.status}: ${detail}`);
    }
    return response.blob();
  }

  private async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  private async post<T = void>(path: string, body: RequestBody): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  private async patch<T = void>(path: string, body: RequestBody): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  private async requestForm<T>(path: string, body: FormData): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      credentials: 'same-origin',
      body,
      headers: {
        ...authorizationHeaderFromToken()
      }
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`请求失败 ${response.status}: ${detail}`);
    }
    return response.json() as Promise<T>;
  }

  private async request<T = void>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      credentials: 'same-origin',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...authorizationHeaderFromToken(),
        ...(init.headers ?? {})
      }
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`请求失败 ${response.status}: ${detail}`);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return response.json() as Promise<T>;
  }
}
