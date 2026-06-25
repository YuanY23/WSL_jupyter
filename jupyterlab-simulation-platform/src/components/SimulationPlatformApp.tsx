import React, { useMemo, useState } from 'react';
import { getDefaultConfig, validateSimulationConfig } from '../templates/registry';
import { SimulationConfig, TemplateId } from '../templates/types';
import { NotebookPreview } from './NotebookPreview';
import { TemplateSelector } from './TemplateSelector';
import { TemplateForm } from './forms/TemplateForms';

interface SimulationPlatformAppProps {
  onGenerate: (config: SimulationConfig) => Promise<void>;
}

export function SimulationPlatformApp(props: SimulationPlatformAppProps): React.ReactElement {
  const [activeTemplateId, setActiveTemplateId] = useState<TemplateId>('generic-simulation');
  const [config, setConfig] = useState<SimulationConfig>(() => getDefaultConfig('generic-simulation'));
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusKind, setStatusKind] = useState<'success' | 'error'>('success');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const validation = useMemo(() => validateSimulationConfig(config), [config]);

  const handleSelect = (templateId: TemplateId): void => {
    setActiveTemplateId(templateId);
    setConfig(getDefaultConfig(templateId));
    setStatusMessage('');
    setStatusKind('success');
  };

  const handleGenerate = async (): Promise<void> => {
    const currentValidation = validateSimulationConfig(config);
    if (!currentValidation.valid) {
      setStatusKind('error');
      setStatusMessage(currentValidation.messages.join('\n'));
      return;
    }

    setIsGenerating(true);
    setStatusMessage('');
    try {
      await props.onGenerate(config);
      setStatusKind('success');
      setStatusMessage('Notebook 已生成并打开。');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusKind('error');
      setStatusMessage(`生成失败: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="simulation-platform-panel">
      <div className="simulation-platform-shell">
        <TemplateSelector activeTemplateId={activeTemplateId} onSelect={handleSelect} />
        <div>
          <div className="simulation-platform-editor">
            <h2 className="simulation-platform-title">仿真模板生成器</h2>
            <p className="simulation-platform-subtitle">
              {activeTemplateId === 'generic-simulation'
                ? '生成空白通用 Notebook 后，用户自行在各标题下填写仿真代码。'
                : '选择模板，填写仿真问题、参数、公式或规则，然后生成可运行、可修改、代码可见的 Notebook。'}
            </p>
            <TemplateForm config={config} onChange={nextConfig => setConfig(nextConfig)} />
            {!validation.valid && (
              <div className="simulation-platform-error">
                {validation.messages.map(message => <div key={message}>{message}</div>)}
              </div>
            )}
            {statusMessage && (
              <div className={statusKind === 'error' ? 'simulation-platform-error' : 'simulation-platform-status'}>
                {statusMessage.split('\n').map(message => <div key={message}>{message}</div>)}
              </div>
            )}
            <div className="simulation-platform-actions">
              <button
                className="simulation-platform-button primary"
                disabled={isGenerating || !validation.valid}
                onClick={handleGenerate}
              >
                生成 Notebook
              </button>
              <button
                className="simulation-platform-button"
                disabled={isGenerating}
                onClick={() => setConfig(getDefaultConfig(activeTemplateId))}
              >
                重置模板
              </button>
            </div>
          </div>
          <NotebookPreview config={config} />
        </div>
      </div>
    </div>
  );
}
