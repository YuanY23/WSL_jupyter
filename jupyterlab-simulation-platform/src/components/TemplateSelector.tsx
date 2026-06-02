import React from 'react';
import { TEMPLATE_REGISTRY } from '../templates/registry';
import { TemplateId } from '../templates/types';

interface TemplateSelectorProps {
  activeTemplateId: TemplateId;
  onSelect: (templateId: TemplateId) => void;
}

export function TemplateSelector(props: TemplateSelectorProps): React.ReactElement {
  return (
    <div className="simulation-platform-sidebar">
      <h2 className="simulation-platform-title">通用仿真平台</h2>
      <p className="simulation-platform-subtitle">仿真模板生成器</p>
      {TEMPLATE_REGISTRY.map(template => (
        <button
          key={template.id}
          className={`simulation-template-button ${template.id === props.activeTemplateId ? 'is-active' : ''}`}
          onClick={() => props.onSelect(template.id)}
        >
          <span className="simulation-template-name">{template.name}</span>
          <span className="simulation-template-summary">{template.summary}</span>
        </button>
      ))}
    </div>
  );
}
