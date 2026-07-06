import React, { useEffect, useState } from 'react';
import { TrainingApiClient } from '../api/client';
import { CurrentUser, TutorialComment } from '../api/types';
import { TutorialMetadata } from '../notebook/tutorialMetadata';
import { CommentThread } from './CommentThread';
import { filterVisibleComments } from './commentVisibility';

interface CommentPanelProps {
  api: TrainingApiClient;
  user: CurrentUser | null;
  tutorial: TutorialMetadata | null;
}

export function CommentPanel(props: CommentPanelProps): React.ReactElement {
  const [comments, setComments] = useState<TutorialComment[]>([]);
  const [content, setContent] = useState<string>('');
  const [status, setStatus] = useState<string>('打开教程文件后显示评论区。');

  useEffect(() => {
    void loadComments();
  }, [props.tutorial?.tutorialId]);

  async function loadComments(): Promise<void> {
    if (!props.tutorial) {
      setComments([]);
      setStatus('打开教程文件后显示评论区。');
      return;
    }
    try {
      const nextComments = await props.api.getComments(props.tutorial.tutorialId);
      const visibleComments = filterVisibleComments(nextComments);
      setComments(visibleComments);
      setStatus(visibleComments.length ? '' : '暂无评论，欢迎发表第一条讨论。');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function submitComment(): Promise<void> {
    if (!props.tutorial || !content.trim()) {
      return;
    }
    try {
      await props.api.createComment(props.tutorial.tutorialId, content);
      setContent('');
      await loadComments();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function reply(commentId: string, nextContent: string): Promise<void> {
    await props.api.createReply(commentId, nextContent);
    await loadComments();
  }

  async function like(comment: TutorialComment): Promise<void> {
    if (comment.liked_by_current_user) {
      await props.api.unlikeComment(comment.id);
    } else {
      await props.api.likeComment(comment.id);
    }
    await loadComments();
  }

  async function pin(comment: TutorialComment): Promise<void> {
    await props.api.adminSetCommentPin(comment.id, !comment.is_pinned);
    await loadComments();
  }

  async function official(comment: TutorialComment): Promise<void> {
    await props.api.adminSetCommentOfficial(comment.id, !comment.is_official);
    await loadComments();
  }

  async function remove(comment: TutorialComment): Promise<void> {
    const reason = window.prompt('删除原因（可选）', '') ?? '';
    await props.api.adminDeleteComment(comment.id, reason);
    await loadComments();
  }

  return (
    <div className="comment-panel">
      <header className="comment-panel-header">
        <h3>评论</h3>
        <p>{props.tutorial ? `${props.tutorial.title} ${props.tutorial.version}` : '未检测到教程文件'}</p>
      </header>
      {status && <div className="training-status">{status}</div>}
      {props.tutorial && (
        <div className="comment-compose">
          <textarea value={content} onChange={event => setContent(event.target.value)} placeholder="发表你的问题、思路或补充说明" />
          <button className="training-button primary" disabled={!content.trim()} onClick={submitComment}>发布评论</button>
        </div>
      )}
      <div className="comment-list">
        {comments.map(comment => (
          <CommentThread
            key={comment.id}
            comment={comment}
            isAdmin={Boolean(props.user?.is_admin)}
            onReply={reply}
            onLike={like}
            onPin={pin}
            onOfficial={official}
            onDelete={remove}
          />
        ))}
      </div>
    </div>
  );
}
