import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import React, { useEffect, useState } from 'react';
import { TrainingApiClient } from '../api/client';
import { MediaResource } from '../api/types';
import { insertMediaIntoCurrentNotebook } from '../notebook/mediaInsertion';

interface MediaInsertPanelProps {
  api: TrainingApiClient;
  app: JupyterFrontEnd;
  notebookTracker: INotebookTracker;
}

export function MediaInsertPanel(props: MediaInsertPanelProps): React.ReactElement {
  const [items, setItems] = useState<MediaResource[]>([]);
  const [status, setStatus] = useState<string>('正在加载媒体资源...');
  const [busyId, setBusyId] = useState<string>('');

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh(): Promise<void> {
    try {
      const media = await props.api.adminListMedia();
      setItems(media);
      setStatus(media.length ? '' : '暂无媒体资源，请先上传视频。');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function insert(media: MediaResource): Promise<void> {
    setBusyId(media.id);
    setStatus('');
    try {
      const message = await insertMediaIntoCurrentNotebook(props.app, props.notebookTracker, media);
      setStatus(message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyId('');
    }
  }

  return (
    <section className="training-admin-band training-media-panel">
      <div className="training-panel-heading">
        <div>
          <h3>插入媒体资源</h3>
          <p>选择一个已上传视频，将平台内部媒体引用写入当前 Notebook cell。</p>
        </div>
        <button className="training-button" onClick={refresh}>刷新</button>
      </div>
      {status && <div className="training-status">{status}</div>}
      <div className="training-media-list">
        {items.map(media => (
          <article className="training-media-row" key={media.id}>
            <div>
              <strong>{media.title}</strong>
              <span>{media.id}</span>
              <em>{media.original_filename}</em>
            </div>
            <button
              className="training-button primary"
              disabled={busyId === media.id}
              onClick={() => insert(media)}
            >
              插入媒体资源
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
