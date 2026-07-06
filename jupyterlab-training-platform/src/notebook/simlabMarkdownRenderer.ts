import type { IRenderMime } from '@jupyterlab/rendermime';
import { RenderedMarkdown } from '@jupyterlab/rendermime';
import { TrainingApiClient } from '../api/client';
import {
  enhanceSimlabVideoDirectives,
  revokeSimlabVideoObjectUrls
} from './simlabVideoPlayer';

export function createSimlabMarkdownRendererFactory(
  api: TrainingApiClient
): IRenderMime.IRendererFactory {
  return {
    safe: true,
    mimeTypes: ['text/markdown'],
    defaultRank: 60,
    createRenderer: options => new SimlabMarkdownRenderer(options, api)
  };
}

class SimlabMarkdownRenderer extends RenderedMarkdown {
  constructor(
    options: IRenderMime.IRendererOptions,
    private readonly api: TrainingApiClient
  ) {
    super(options);
  }

  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    revokeSimlabVideoObjectUrls(this.node);
    await super.renderModel(model);
    await enhanceSimlabVideoDirectives(this.node, this.api);
  }

  dispose(): void {
    revokeSimlabVideoObjectUrls(this.node);
    super.dispose();
  }
}
