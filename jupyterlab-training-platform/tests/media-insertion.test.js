const assert = require('node:assert/strict');

const {
  appendMediaDirective,
  buildMediaDirective
} = require('../lib/notebook/mediaDirective.js');

function testBuildMediaDirective() {
  assert.equal(
    buildMediaDirective({ id: 'vid_abc123', title: '第一章导入视频' }),
    '::simlab-video\nmedia_id: vid_abc123\ntitle: 第一章导入视频\n::'
  );
}

function testAppendMediaDirectiveToEmptyCell() {
  assert.equal(
    appendMediaDirective('', '::simlab-video\nmedia_id: vid_abc123\n::'),
    '::simlab-video\nmedia_id: vid_abc123\n::'
  );
}

function testAppendMediaDirectiveToExistingContent() {
  assert.equal(
    appendMediaDirective('# 第一章', '::simlab-video\nmedia_id: vid_abc123\n::'),
    '# 第一章\n\n::simlab-video\nmedia_id: vid_abc123\n::'
  );
}

function testAppendMediaDirectivePreservesTrailingWhitespace() {
  assert.equal(
    appendMediaDirective('print("hello")\n', '::simlab-video\nmedia_id: vid_abc123\n::'),
    'print("hello")\n\n::simlab-video\nmedia_id: vid_abc123\n::'
  );
}

function run() {
  testBuildMediaDirective();
  testAppendMediaDirectiveToEmptyCell();
  testAppendMediaDirectiveToExistingContent();
  testAppendMediaDirectivePreservesTrailingWhitespace();
  console.log('media insertion tests passed');
}

run();
