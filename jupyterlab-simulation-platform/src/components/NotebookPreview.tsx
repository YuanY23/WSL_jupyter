import React from 'react';
import { GENERIC_NOTEBOOK_OUTLINE, NOTEBOOK_OUTLINE } from '../notebook/notebookFactory';
import { SimulationConfig } from '../templates/types';

interface NotebookPreviewProps {
  config: SimulationConfig;
}

export function NotebookPreview(props: NotebookPreviewProps): React.ReactElement {
  const outline = props.config.templateId === 'generic-simulation'
    ? GENERIC_NOTEBOOK_OUTLINE.map(item => item.replace(/^\d+\.\s/u, ''))
    : NOTEBOOK_OUTLINE;

  return (
    <div className="simulation-platform-preview">
      <h3 className="simulation-platform-section-title">Notebook 结构预览</h3>
      <ol>
        {outline.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ol>
      <h3 className="simulation-platform-section-title">当前配置摘要</h3>
      <table className="simulation-platform-table">
        <tbody>
          <tr>
            <th>模板</th>
            <td>{props.config.templateId}</td>
          </tr>
          <tr>
            <th>仿真名称</th>
            <td>{props.config.simulationName}</td>
          </tr>
          <tr>
            <th>输出</th>
            <td>{props.config.outputs.join(', ')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
