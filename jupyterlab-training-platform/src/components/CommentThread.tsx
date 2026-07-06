import React, { useState } from 'react';
import { TutorialComment } from '../api/types';

interface CommentThreadProps {
  comment: TutorialComment;
  isAdmin: boolean;
  onReply: (commentId: string, content: string) => Promise<void>;
  onLike: (comment: TutorialComment) => Promise<void>;
  onPin: (comment: TutorialComment) => Promise<void>;
  onOfficial: (comment: TutorialComment) => Promise<void>;
  onDelete: (comment: TutorialComment) => Promise<void>;
}

export function CommentThread(props: CommentThreadProps): React.ReactElement {
  const [reply, setReply] = useState<string>('');
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const { comment } = props;

  async function submitReply(): Promise<void> {
    if (!reply.trim()) {
      return;
    }
    setIsReplying(true);
    try {
      await props.onReply(comment.id, reply);
      setReply('');
    } finally {
      setIsReplying(false);
    }
  }

  return (
    <article className={comment.is_pinned ? 'comment-thread pinned' : 'comment-thread'}>
      <header>
        <strong>{comment.author}</strong>
        {comment.is_official && <span className="comment-badge">官方回复</span>}
        {comment.is_pinned && <span className="comment-badge pinned">置顶</span>}
      </header>
      <p>{comment.content}</p>
      <div className="comment-actions">
        <button onClick={() => props.onLike(comment)}>{comment.liked_by_current_user ? '取消点赞' : '点赞'} {comment.like_count}</button>
        {props.isAdmin && <button onClick={() => props.onPin(comment)}>{comment.is_pinned ? '取消置顶' : '置顶'}</button>}
        {props.isAdmin && <button onClick={() => props.onOfficial(comment)}>{comment.is_official ? '取消官方' : '官方回复'}</button>}
        {props.isAdmin && <button onClick={() => props.onDelete(comment)}>删除</button>}
      </div>
      <div className="comment-reply-box">
        <input value={reply} onChange={event => setReply(event.target.value)} placeholder="回复这条评论" />
        <button disabled={isReplying || !reply.trim()} onClick={submitReply}>回复</button>
      </div>
      {comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(replyItem => (
            <CommentThread
              key={replyItem.id}
              comment={replyItem}
              isAdmin={props.isAdmin}
              onReply={props.onReply}
              onLike={props.onLike}
              onPin={props.onPin}
              onOfficial={props.onOfficial}
              onDelete={props.onDelete}
            />
          ))}
        </div>
      )}
    </article>
  );
}
