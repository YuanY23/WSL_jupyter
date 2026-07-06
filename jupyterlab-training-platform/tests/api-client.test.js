const assert = require('node:assert/strict');

const { PageConfig } = require('@jupyterlab/coreutils');
const { normalizeApiBaseUrl, authorizationHeaderFromToken } = require('../lib/api/client.js');

function testDefaultApiPathUsesHubServiceRoute() {
  assert.equal(
    normalizeApiBaseUrl('/user/yuan/'),
    '/services/simlab-training/api'
  );
}

function testConfiguredApiPathWins() {
  assert.equal(
    normalizeApiBaseUrl('/user/yuan/', '/services/simlab-training/api'),
    '/services/simlab-training/api'
  );
}

function testAuthorizationHeaderUsesJupyterPageToken() {
  PageConfig.setOption('token', 'page-token-123');

  assert.deepEqual(authorizationHeaderFromToken(), {
    Authorization: 'token page-token-123'
  });
}

function testAuthorizationHeaderIsEmptyWithoutToken() {
  PageConfig.setOption('token', '');

  assert.deepEqual(authorizationHeaderFromToken(), {});
}

testDefaultApiPathUsesHubServiceRoute();
testConfiguredApiPathWins();
testAuthorizationHeaderUsesJupyterPageToken();
testAuthorizationHeaderIsEmptyWithoutToken();

console.log('training API client tests passed');
