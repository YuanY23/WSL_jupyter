const assert = require('node:assert/strict');
const { filterVisibleComments } = require('../lib/components/commentVisibility.js');

const baseComment = {
  id: 'comment-visible',
  tutorial_public_id: 'tutorial-1',
  parent_id: null,
  author: 'yuan',
  content: '保留评论',
  is_pinned: false,
  is_official: false,
  is_deleted: false,
  deleted_reason: null,
  created_at: '2026-07-06T00:00:00+00:00',
  updated_at: '2026-07-06T00:00:00+00:00',
  like_count: 0,
  liked_by_current_user: false,
  can_admin: true,
  replies: []
};

function comment(overrides) {
  return {
    ...baseComment,
    ...overrides,
    replies: overrides.replies ?? []
  };
}

const visibleReply = comment({
  id: 'reply-visible',
  parent_id: 'comment-visible',
  content: '保留回复'
});
const deletedReply = comment({
  id: 'reply-deleted',
  parent_id: 'comment-visible',
  content: '该评论已被管理员删除',
  is_deleted: true
});
const deletedTopLevel = comment({
  id: 'comment-deleted',
  content: '该评论已被管理员删除',
  is_deleted: true,
  replies: [visibleReply]
});

const visibleComments = filterVisibleComments([
  deletedTopLevel,
  comment({
    id: 'comment-visible',
    replies: [deletedReply, visibleReply]
  })
]);

assert.deepEqual(
  visibleComments.map(item => item.id),
  ['comment-visible']
);
assert.deepEqual(
  visibleComments[0].replies.map(item => item.id),
  ['reply-visible']
);
assert.equal(visibleComments[0].replies[0].content, '保留回复');

console.log('comment visibility tests passed');
