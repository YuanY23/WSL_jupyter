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

async function run() {
  await testAdminGetsFullCourseTree();
  await testAdminPatchesTutorialTitleAndNotebookFilename();
  await testAdminArchivesCourseAndSection();
  console.log('training admin API client tests passed');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
