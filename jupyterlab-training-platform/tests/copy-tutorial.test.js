const assert = require('node:assert/strict');

const { copyTutorialToWorkspace } = require('../lib/notebook/copyTutorial.js');

function makeApp() {
  const saved = [];
  const opened = [];
  const existingPaths = new Set();
  return {
    saved,
    opened,
    app: {
      serviceManager: {
        contents: {
          get: async path => {
            if (existingPaths.has(path)) {
              return { path, content: null };
            }
            throw new Error(`missing ${path}`);
          },
          newUntitled: async ({ path }) => ({ path: `${path ? `${path}/` : ''}Untitled Folder` }),
          rename: async (_oldPath, nextPath) => {
            existingPaths.add(nextPath);
            return { path: nextPath };
          },
          save: async (path, model) => {
            saved.push({ path, model });
            existingPaths.add(path);
            return { path };
          }
        }
      },
      commands: {
        execute: async (_command, args) => {
          opened.push(args.path);
        }
      }
    }
  };
}

async function testCopyUsesManagedNotebookFilenameWhenPresent() {
  const harness = makeApp();

  const path = await copyTutorialToWorkspace(
    harness.app,
    { title: '课程一' },
    { title: '第一章', sort_order: 1 },
    { title: '热力系统入门', sort_order: 7, notebook_filename: '1-1.ipynb' },
    { cells: [], metadata: { simlab_tutorial: { version: '1.0' } }, nbformat: 4, nbformat_minor: 5 }
  );

  assert.equal(path, 'SimLab教程/课程一/1-第一章/1-1.ipynb');
  assert.equal(harness.saved[0].path, 'SimLab教程/课程一/1-第一章/1-1.ipynb');
  assert.equal(harness.opened[0], 'SimLab教程/课程一/1-第一章/1-1.ipynb');
}

testCopyUsesManagedNotebookFilenameWhenPresent()
  .then(() => console.log('training tutorial copy tests passed'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
