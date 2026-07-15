const assert = require('node:assert/strict');

const { PageConfig } = require('@jupyterlab/coreutils');
const { TrainingApiClient } = require('../lib/api/client.js');

function response(payload = {}) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  };
}

async function captureRequest(action) {
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url, init });
    return response([]);
  };
  PageConfig.setOption('token', '');
  const client = new TrainingApiClient('/api');

  await action(client);

  assert.equal(calls.length, 1);
  return calls[0];
}

async function testAdminGetsFullCourseTree() {
  const call = await captureRequest(client => client.adminGetCourses());

  assert.equal(call.url, '/api/admin/courses');
  assert.equal(call.init.method, 'GET');
}

async function testAdminPatchesTutorialTitleAndNotebookFilename() {
  const call = await captureRequest(client => client.adminPatchTutorial('heat-basic', {
    title: '1-1 热力系统入门',
    notebook_filename: '1-1.ipynb',
    status: 'published'
  }));

  assert.equal(call.url, '/api/admin/tutorials/heat-basic');
  assert.equal(call.init.method, 'PATCH');
  assert.deepEqual(JSON.parse(call.init.body), {
    title: '1-1 热力系统入门',
    notebook_filename: '1-1.ipynb',
    status: 'published'
  });
}

async function testAdminArchivesCourseAndSection() {
  const courseCall = await captureRequest(client => client.adminArchiveCourse('course-1'));
  const sectionCall = await captureRequest(client => client.adminArchiveSection('section-1'));

  assert.equal(courseCall.url, '/api/admin/courses/course-1');
  assert.equal(courseCall.init.method, 'DELETE');
  assert.equal(sectionCall.url, '/api/admin/sections/section-1');
  assert.equal(sectionCall.init.method, 'DELETE');
}

async function testAdminListsMediaResources() {
  const call = await captureRequest(client => client.adminListMedia());

  assert.equal(call.url, '/api/admin/media');
  assert.equal(call.init.method, 'GET');
}

async function testAdminUploadsMediaWithFormData() {
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url, init });
    return response({
      id: 'vid_123',
      title: '第一章',
      original_filename: 'intro.mp4',
      mime_type: 'video/mp4',
      file_size: 10,
      status: 'available',
      created_by: 'yuan',
      created_at: '2026-07-06T00:00:00+00:00',
      updated_at: '2026-07-06T00:00:00+00:00'
    });
  };
  PageConfig.setOption('token', '');
  const client = new TrainingApiClient('/api');
  const file = new Blob(['fake-video'], { type: 'video/mp4' });

  await client.adminUploadMedia(file, '第一章');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/admin/media');
  assert.equal(calls[0].init.method, 'POST');
  assert.ok(calls[0].init.body instanceof FormData);
  assert.equal(calls[0].init.headers['Content-Type'], undefined);
}

async function testAdminRenamesMediaResource() {
  const call = await captureRequest(client => client.adminRenameMedia('vid_123', '新标题'));

  assert.equal(call.url, '/api/admin/media/vid_123');
  assert.equal(call.init.method, 'PATCH');
  assert.deepEqual(JSON.parse(call.init.body), { title: '新标题' });
}

async function testAdminDeletesMediaResource() {
  const call = await captureRequest(client => client.adminDeleteMedia('vid_123'));

  assert.equal(call.url, '/api/admin/media/vid_123');
  assert.equal(call.init.method, 'DELETE');
}

async function testMediaContentUrlUsesPublicMediaEndpoint() {
  const client = new TrainingApiClient('/api');

  assert.equal(
    client.mediaContentUrl('vid_123'),
    '/api/media/vid_123/content'
  );
}

async function testCreatesMediaPlaybackDescriptor() {
  const call = await captureRequest(client => client.createMediaPlayback('vid_123'));

  assert.equal(call.url, '/api/media/vid_123/playback');
  assert.equal(call.init.method, 'POST');
  assert.deepEqual(JSON.parse(call.init.body), {});
}

async function testFetchMediaBlobUsesAuthorizationHeaders() {
  const calls = [];
  const blob = new Blob(['fake-video'], { type: 'video/mp4' });
  global.fetch = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      blob: async () => blob,
      text: async () => ''
    };
  };
  PageConfig.setOption('token', 'page-token-123');
  const client = new TrainingApiClient('/api');

  const result = await client.fetchMediaBlob('vid_123');

  assert.equal(result, blob);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/media/vid_123/content');
  assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.credentials, 'same-origin');
  assert.equal(calls[0].init.headers.Authorization, 'token page-token-123');
}

async function run() {
  await testAdminGetsFullCourseTree();
  await testAdminPatchesTutorialTitleAndNotebookFilename();
  await testAdminArchivesCourseAndSection();
  await testAdminListsMediaResources();
  await testAdminUploadsMediaWithFormData();
  await testAdminRenamesMediaResource();
  await testAdminDeletesMediaResource();
  await testMediaContentUrlUsesPublicMediaEndpoint();
  await testCreatesMediaPlaybackDescriptor();
  await testFetchMediaBlobUsesAuthorizationHeaders();
  console.log('training admin API client tests passed');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
