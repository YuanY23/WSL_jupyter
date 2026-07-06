const assert = require('node:assert/strict');

const {
  parseSimlabVideoDirective,
  parseSimlabVideoDirectives,
  normalizeDirectiveText
} = require('../lib/notebook/simlabVideoDirective.js');

function testParsesMultilineDirective() {
  assert.deepEqual(
    parseSimlabVideoDirective('::simlab-video\nmedia_id: vid_abc123\ntitle: 课程介绍\n::'),
    {
      mediaId: 'vid_abc123',
      title: '课程介绍',
      raw: '::simlab-video\nmedia_id: vid_abc123\ntitle: 课程介绍\n::'
    }
  );
}

function testParsesSingleLineDirective() {
  assert.deepEqual(
    parseSimlabVideoDirective('::simlab-video media_id: vid_abc123 title: 课程介绍 ::'),
    {
      mediaId: 'vid_abc123',
      title: '课程介绍',
      raw: '::simlab-video media_id: vid_abc123 title: 课程介绍 ::'
    }
  );
}

function testUsesMediaIdWhenTitleIsMissing() {
  assert.deepEqual(
    parseSimlabVideoDirective('::simlab-video\nmedia_id: vid_abc123\n::'),
    {
      mediaId: 'vid_abc123',
      title: 'vid_abc123',
      raw: '::simlab-video\nmedia_id: vid_abc123\n::'
    }
  );
}

function testRejectsDirectiveWithoutMediaId() {
  assert.equal(
    parseSimlabVideoDirective('::simlab-video\ntitle: 缺少编号\n::'),
    null
  );
}

function testFindsMultipleDirectivesInMarkdownSource() {
  assert.deepEqual(
    parseSimlabVideoDirectives('# 第一章\n\n::simlab-video\nmedia_id: vid_a\n::\n\n::simlab-video media_id: vid_b title: 第二段 ::')
      .map(item => [item.mediaId, item.title]),
    [
      ['vid_a', 'vid_a'],
      ['vid_b', '第二段']
    ]
  );
}

function testNormalizeDirectiveTextCollapsesWhitespace() {
  assert.equal(
    normalizeDirectiveText('::simlab-video\nmedia_id: vid_a\ntitle: 第一章\n::'),
    '::simlab-video media_id: vid_a title: 第一章 ::'
  );
}

function run() {
  testParsesMultilineDirective();
  testParsesSingleLineDirective();
  testUsesMediaIdWhenTitleIsMissing();
  testRejectsDirectiveWithoutMediaId();
  testFindsMultipleDirectivesInMarkdownSource();
  testNormalizeDirectiveTextCollapsesWhitespace();
  console.log('simlab video directive tests passed');
}

run();
