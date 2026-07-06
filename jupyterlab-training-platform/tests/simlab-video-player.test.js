const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const {
  enhanceSimlabVideoDirectives,
  revokeSimlabVideoObjectUrls
} = require('../lib/notebook/simlabVideoPlayer.js');

function installDom() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  return dom;
}

async function testReplacesParagraphDirectiveWithPlayer() {
  installDom();
  const host = document.createElement('div');
  host.innerHTML = '<p>::simlab-video media_id: vid_abc123 title: 课程介绍 ::</p>';
  const calls = [];
  const api = {
    fetchMediaBlob: async mediaId => {
      calls.push(mediaId);
      return new Blob(['fake-video'], { type: 'video/mp4' });
    }
  };
  const created = [];
  global.URL.createObjectURL = blob => {
    created.push(blob);
    return 'blob:simlab-video';
  };
  global.URL.revokeObjectURL = () => undefined;

  await enhanceSimlabVideoDirectives(host, api);

  const figure = host.querySelector('.training-video-player');
  const video = host.querySelector('video');
  assert.ok(figure);
  assert.ok(video);
  assert.equal(figure.dataset.mediaId, 'vid_abc123');
  assert.equal(video.getAttribute('controls'), '');
  assert.equal(video.src, 'blob:simlab-video');
  assert.deepEqual(calls, ['vid_abc123']);
  assert.equal(created.length, 1);
}

async function testLeavesInvalidDirectiveUntouched() {
  installDom();
  const host = document.createElement('div');
  host.innerHTML = '<p>::simlab-video title: 缺少编号 ::</p>';
  const api = {
    fetchMediaBlob: async () => {
      throw new Error('should not fetch');
    }
  };

  await enhanceSimlabVideoDirectives(host, api);

  assert.equal(host.querySelector('video'), null);
  assert.equal(host.textContent.trim(), '::simlab-video title: 缺少编号 ::');
}

async function testShowsLoadErrorWhenBlobFetchFails() {
  installDom();
  const host = document.createElement('div');
  host.innerHTML = '<p>::simlab-video media_id: vid_missing title: 丢失视频 ::</p>';
  const api = {
    fetchMediaBlob: async () => {
      throw new Error('404');
    }
  };

  await enhanceSimlabVideoDirectives(host, api);

  assert.equal(host.querySelector('video'), null);
  assert.match(host.querySelector('.training-video-error').textContent, /视频加载失败/);
}

async function testRevokesObjectUrls() {
  installDom();
  const host = document.createElement('div');
  const video = document.createElement('video');
  video.dataset.objectUrl = 'blob:old-url';
  host.appendChild(video);
  const revoked = [];
  global.URL.revokeObjectURL = value => {
    revoked.push(value);
  };

  revokeSimlabVideoObjectUrls(host);

  assert.deepEqual(revoked, ['blob:old-url']);
  assert.equal(video.dataset.objectUrl, undefined);
}

async function run() {
  await testReplacesParagraphDirectiveWithPlayer();
  await testLeavesInvalidDirectiveUntouched();
  await testShowsLoadErrorWhenBlobFetchFails();
  await testRevokesObjectUrls();
  console.log('simlab video player tests passed');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
