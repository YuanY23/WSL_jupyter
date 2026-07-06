const assert = require('node:assert/strict');
const Module = require('node:module');
const { JSDOM } = require('jsdom');

function installDom() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
}

function loadRendererWithMocks(hooks) {
  const originalLoad = Module._load;
  class FakeRenderedMarkdown {
    constructor() {
      this.node = document.createElement('div');
    }

    async renderModel() {
      hooks.rendered = true;
    }

    dispose() {
      hooks.disposed = true;
    }
  }

  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === '@jupyterlab/rendermime') {
      return { RenderedMarkdown: FakeRenderedMarkdown };
    }
    if (request === './simlabVideoPlayer') {
      return {
        enhanceSimlabVideoDirectives: async () => {
          hooks.enhanced = true;
        },
        revokeSimlabVideoObjectUrls: () => {
          hooks.revoked += 1;
        }
      };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    delete require.cache[require.resolve('../lib/notebook/simlabMarkdownRenderer.js')];
    return require('../lib/notebook/simlabMarkdownRenderer.js');
  } finally {
    Module._load = originalLoad;
  }
}

function testCreatesMarkdownRendererFactory() {
  installDom();
  const hooks = { rendered: false, enhanced: false, disposed: false, revoked: 0 };
  const { createSimlabMarkdownRendererFactory } = loadRendererWithMocks(hooks);
  const api = {
    fetchMediaBlob: async () => new Blob(['fake-video'], { type: 'video/mp4' })
  };
  const factory = createSimlabMarkdownRendererFactory(api);

  assert.equal(factory.safe, true);
  assert.deepEqual(factory.mimeTypes, ['text/markdown']);
  assert.equal(factory.defaultRank, 60);

  const renderer = factory.createRenderer({
    mimeType: 'text/markdown',
    sanitizer: { sanitize: value => value },
    resolver: null,
    linkHandler: null,
    latexTypesetter: null,
    markdownParser: { render: async value => `<p>${value}</p>` }
  });

  assert.equal(typeof renderer.renderModel, 'function');
  renderer.dispose();
  assert.equal(hooks.revoked, 1);
  assert.equal(hooks.disposed, true);
}

function run() {
  testCreatesMarkdownRendererFactory();
  console.log('simlab markdown renderer tests passed');
}

run();
