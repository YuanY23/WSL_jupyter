const assert = require('node:assert/strict');

const {
  extractTutorialMetadata,
  shouldOpenCommentPanel
} = require('../lib/notebook/tutorialMetadata.js');

function testOrdinaryNotebookHasNoTutorialMetadata() {
  assert.equal(extractTutorialMetadata({}), null);
}

function testTutorialNotebookReturnsMetadata() {
  const metadata = extractTutorialMetadata({
    simlab_tutorial: {
      enabled: true,
      tutorial_id: 'heat-basic-001',
      title: '一维稳态导热基础',
      version: '1.0'
    }
  });

  assert.deepEqual(metadata, {
    tutorialId: 'heat-basic-001',
    title: '一维稳态导热基础',
    version: '1.0'
  });
}

function testTutorialMetadataCanBeReadFromNotebookModelKey() {
  const metadata = extractTutorialMetadata({
    enabled: true,
    tutorial_id: 'heat-basic-002',
    title: '教程元数据直读',
    version: '1.1'
  });

  assert.deepEqual(metadata, {
    tutorialId: 'heat-basic-002',
    title: '教程元数据直读',
    version: '1.1'
  });
}

function testCommentPanelOnlyAutoOpensForTutorials() {
  assert.equal(shouldOpenCommentPanel(null), false);
  assert.equal(shouldOpenCommentPanel({ tutorialId: 'x', title: '教程', version: '1.0' }), true);
}

testOrdinaryNotebookHasNoTutorialMetadata();
testTutorialNotebookReturnsMetadata();
testTutorialMetadataCanBeReadFromNotebookModelKey();
testCommentPanelOnlyAutoOpensForTutorials();

console.log('training tutorial metadata tests passed');
