import { TutorialComment } from '../api/types';

export function filterVisibleComments(comments: TutorialComment[]): TutorialComment[] {
  return comments
    .filter(comment => !comment.is_deleted)
    .map(comment => ({
      ...comment,
      replies: filterVisibleComments(comment.replies)
    }));
}
