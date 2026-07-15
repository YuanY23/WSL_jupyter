import React, { ChangeEvent, useEffect, useState } from 'react';
import { TrainingApiClient } from '../api/client';
import { MediaResource } from '../api/types';

interface MediaUploadPanelProps {
  api: TrainingApiClient;
}

export function MediaUploadPanel(props: MediaUploadPanelProps): React.ReactElement {
  const [items, setItems] = useState<MediaResource[]>([]);
  const [title, setTitle] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string>('');
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [status, setStatus] = useState<string>('正在加载媒体资源...');
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh(): Promise<void> {
    try {
      const media = await props.api.adminListMedia();
      setItems(media);
      setStatus(media.length ? '' : '暂无媒体资源。');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>): void {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    if (selected) {
      setTitle(current => current || selected.name.replace(/\.[^.]+$/, ''));
      setStatus(`已选择 ${selected.name}`);
    }
  }

  async function upload(): Promise<void> {
    if (!file) {
      setStatus('请先选择本地视频文件。');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const media = await props.api.adminUploadMedia(file, title);
      setItems(current => [media, ...current]);
      setFile(null);
      setTitle('');
      setStatus(media.status === 'processing' ? '媒体资源已上传，已加入转码加密队列。' : '媒体资源已上传。');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveRename(media: MediaResource): Promise<void> {
    const nextTitle = editingTitle.trim();
    if (!nextTitle) {
      setStatus('媒体标题不能为空。');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const updated = await props.api.adminRenameMedia(media.id, nextTitle);
      setItems(current => current.map(item => item.id === updated.id ? updated : item));
      setEditingId('');
      setEditingTitle('');
      setStatus('媒体资源已重命名。');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function deleteMedia(media: MediaResource): Promise<void> {
    if (!window.confirm(`删除媒体资源“${media.title}”？`)) {
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      await props.api.adminDeleteMedia(media.id);
      setItems(current => current.filter(item => item.id !== media.id));
      setStatus('媒体资源已删除。');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="training-admin-band training-media-panel">
      <div className="training-panel-heading">
        <div>
          <h3>上传媒体资源</h3>
          <p>选择本地视频文件上传，上传后可在“插入媒体资源”中选择。</p>
        </div>
        <button className="training-button" onClick={refresh}>刷新</button>
      </div>
      {status && <div className="training-status">{status}</div>}
      <div className="training-form-grid">
        <input type="file" accept="video/*,.mp4,.mov,.m4v,.webm,.mkv" onChange={selectFile} />
        <input value={title} onChange={event => setTitle(event.target.value)} placeholder="媒体标题" />
      </div>
      <div className="training-upload-actions">
        <button className="training-button primary" disabled={busy || !file} onClick={upload}>
          上传媒体资源
        </button>
      </div>
      <div className="training-media-list">
        {items.map(media => (
          <article className="training-media-row" key={media.id}>
            <div>
              {editingId === media.id ? (
                <input value={editingTitle} onChange={event => setEditingTitle(event.target.value)} />
              ) : (
                <strong>{media.title}</strong>
              )}
              <span>{media.id}</span>
              <em>{media.original_filename}</em>
              {media.status === 'processing' && <em>正在转码加密</em>}
              {media.status === 'failed' && <em>转码失败，请删除后重新上传</em>}
            </div>
            <div className="training-media-actions">
              {editingId === media.id ? (
                <>
                  <button className="training-button primary" disabled={busy} onClick={() => saveRename(media)}>
                    保存
                  </button>
                  <button
                    className="training-button"
                    disabled={busy}
                    onClick={() => {
                      setEditingId('');
                      setEditingTitle('');
                    }}
                  >
                    取消
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="training-button"
                    disabled={busy}
                    onClick={() => {
                      setEditingId(media.id);
                      setEditingTitle(media.title);
                    }}
                  >
                    重命名
                  </button>
                  <button className="training-button danger" disabled={busy} onClick={() => deleteMedia(media)}>
                    删除
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
