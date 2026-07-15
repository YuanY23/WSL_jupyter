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

async function testLoadsEncryptedHlsWithPlaybackToken() {
  installDom();
  const host = document.createElement('div');
  host.innerHTML = '<p>::simlab-video media_id: vid_secure title: 加密视频 ::</p>';
  const calls = [];
  const api = {
    createMediaPlayback: async mediaId => {
      calls.push(['playback', mediaId]);
      return {
        mode: 'hls',
        manifest_url: '/api/media/vid_secure/hls/manifest.m3u8',
        playback_token: 'signed-playback-token',
        expires_at: Math.floor(Date.now() / 1000) + 600
      };
    },
    fetchMediaBlob: async () => {
      throw new Error('blob fallback must not be used');
    }
  };
  let requestFilter = null;
  let destroyed = false;
  const fakePlayer = {
    getNetworkingEngine: () => ({
      registerRequestFilter: filter => {
        requestFilter = filter;
      }
    }),
    load: async uri => {
      calls.push(['load', uri]);
      const request = { headers: {} };
      await requestFilter('manifest', request);
      calls.push(['headers', request.headers]);
    },
    destroy: () => {
      destroyed = true;
    }
  };

  await enhanceSimlabVideoDirectives(host, api, {
    createAdaptivePlayer: async () => fakePlayer
  });

  const video = host.querySelector('video');
  assert.ok(video);
  assert.equal(video.dataset.adaptivePlayer, 'true');
  assert.deepEqual(calls, [
    ['playback', 'vid_secure'],
    ['load', '/api/media/vid_secure/hls/manifest.m3u8'],
    ['headers', { 'X-SimLab-Playback-Token': 'signed-playback-token' }]
  ]);

  revokeSimlabVideoObjectUrls(host);
  assert.equal(destroyed, true);
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

async function testOffersAutomaticAndManualQualitySelection() {
  installDom();
  const host = document.createElement('div');
  host.innerHTML = '<p>::simlab-video media_id: vid_quality title: 多清晰度视频 ::</p>';
  const configurations = [];
  const selections = [];
  const tracks = [
    { id: 1, height: 480, bandwidth: 1200000 },
    { id: 2, height: 720, bandwidth: 2500000 },
    { id: 3, height: 1080, bandwidth: 5000000 }
  ];
  const fakePlayer = {
    getNetworkingEngine: () => ({ registerRequestFilter: () => undefined }),
    load: async () => undefined,
    destroy: () => undefined,
    getVariantTracks: () => tracks,
    configure: config => configurations.push(config),
    selectVariantTrack: (track, clearBuffer) => selections.push([track.id, clearBuffer])
  };
  const api = {
    createMediaPlayback: async () => ({
      mode: 'hls',
      manifest_url: '/api/media/vid_quality/hls/manifest.m3u8',
      playback_token: 'token',
      expires_at: Math.floor(Date.now() / 1000) + 600
    }),
    fetchMediaBlob: async () => { throw new Error('not used'); }
  };

  await enhanceSimlabVideoDirectives(host, api, {
    createAdaptivePlayer: async () => fakePlayer
  });

  const select = host.querySelector('select[data-video-quality="true"]');
  assert.ok(select);
  assert.deepEqual(Array.from(select.options).map(option => option.textContent), [
    '自动', '1080p', '720p', '480p'
  ]);
  select.value = '720';
  select.dispatchEvent(new window.Event('change'));
  assert.deepEqual(configurations.at(-1), { abr: { enabled: false } });
  assert.deepEqual(selections, [[2, true]]);
  select.value = 'auto';
  select.dispatchEvent(new window.Event('change'));
  assert.deepEqual(configurations.at(-1), { abr: { enabled: true } });
}

async function run() {
  await testReplacesParagraphDirectiveWithPlayer();
  await testLeavesInvalidDirectiveUntouched();
  await testShowsLoadErrorWhenBlobFetchFails();
  await testLoadsEncryptedHlsWithPlaybackToken();
  await testOffersAutomaticAndManualQualitySelection();
  await testRevokesObjectUrls();
  console.log('simlab video player tests passed');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
