import React, { useEffect, useRef, useState } from 'react';
import { NotebookActions, NotebookPanel } from '@jupyterlab/notebook';
import { runCellAndDownstream } from '../utils/CellExecutionManager';
import {
  IParsedParam,
  ParamControlType,
  resolveNumericControlAttributes,
  scanParameterRegion
} from '../utils/parameterBinding';
import {
  getNotebookBindingMetadata,
  updateNotebookBindingConfig,
  updateNotebookParamValue
} from '../utils/notebookBinding';

interface IParamSidebarProps {
  notebookPanel: NotebookPanel | null;
}

function numericOrUndefined(value: string): number | undefined {
  if (value.trim() === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptions(value: string): string[] {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function paramInstanceKey(param: Pick<IParsedParam, 'cellId' | 'cellIndex' | 'variableName'>): string {
  return `${param.cellId ?? param.cellIndex}:${param.variableName}`;
}

export const ParamSidebar: React.FC<IParamSidebarProps> = ({ notebookPanel }) => {
  const [params, setParams] = useState<IParsedParam[]>([]);
  const [autoRun, setAutoRun] = useState<boolean>(true);
  const [kernelStatus, setKernelStatus] = useState<string>('unknown');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedConfigDetails, setExpandedConfigDetails] = useState<Record<string, boolean>>({});
  const [tempValues, setTempValues] = useState<Record<string, any>>({});
  const isSyncingRef = useRef<boolean>(false);

  const refreshParams = () => {
    if (!notebookPanel?.content) {
      setParams([]);
      return;
    }

    const metadata = getNotebookBindingMetadata(notebookPanel.content.model);
    const scanned = scanParameterRegion(notebookPanel.content.widgets, metadata);
    setParams(scanned);

    const nextGroups: Record<string, boolean> = {};
    scanned.forEach(param => {
      const groupName = param.metadata.group || param.regionTitle;
      if (expandedGroups[groupName] === undefined) {
        nextGroups[groupName] = true;
      }
    });
    if (Object.keys(nextGroups).length > 0) {
      setExpandedGroups(previous => ({ ...nextGroups, ...previous }));
    }

    setExpandedConfigDetails(previous => {
      let changed = false;
      const next = { ...previous };
      scanned.forEach(param => {
        const key = paramInstanceKey(param);
        if (!param.configured && next[key] === undefined) {
          next[key] = true;
          changed = true;
        }
      });
      return changed ? next : previous;
    });
  };

  useEffect(() => {
    if (!notebookPanel) {
      return;
    }

    const onCellExecuted = (sender: any, args: any) => {
      if (isSyncingRef.current) {
        return;
      }
      if (args.notebook === notebookPanel.content) {
        refreshParams();
      }
    };

    const onContentChanged = () => {
      if (!isSyncingRef.current) {
        refreshParams();
      }
    };

    const updateStatus = () => {
      setKernelStatus(notebookPanel.context.sessionContext.kernelDisplayStatus);
    };

    NotebookActions.executed.connect(onCellExecuted);
    notebookPanel.context.model.contentChanged.connect(onContentChanged);
    notebookPanel.context.sessionContext.statusChanged.connect(updateStatus);

    refreshParams();
    updateStatus();

    return () => {
      NotebookActions.executed.disconnect(onCellExecuted);
      notebookPanel.context.model.contentChanged.disconnect(onContentChanged);
      notebookPanel.context.sessionContext.statusChanged.disconnect(updateStatus);
    };
  }, [notebookPanel]);

  const saveConfig = (param: IParsedParam, patch: Record<string, any>) => {
    if (!notebookPanel?.content?.model) {
      return;
    }
    isSyncingRef.current = true;
    try {
      updateNotebookBindingConfig(notebookPanel.content.model, param.variableName, {
        type: param.metadata.type,
        label: param.metadata.label || param.variableName,
        ...patch
      });
      refreshParams();
    } finally {
      isSyncingRef.current = false;
    }
  };

  const handleValueDrag = (param: IParsedParam, value: any) => {
    setTempValues(previous => ({ ...previous, [param.variableName]: value }));
  };

  const handleValueCommit = async (param: IParsedParam, value: any) => {
    if (!notebookPanel?.content) {
      return;
    }

    try {
      isSyncingRef.current = true;
      setTempValues(previous => {
        const copy = { ...previous };
        delete copy[param.variableName];
        return copy;
      });

      const success = updateNotebookParamValue(notebookPanel.content, param, value);
      if (success) {
        refreshParams();
        if (autoRun) {
          await runCellAndDownstream(
            notebookPanel.content,
            notebookPanel.context.sessionContext,
            param.regionStartCellId,
            param.regionStartCellIndex
          );
        }
      }
    } finally {
      isSyncingRef.current = false;
    }
  };

  const handleManualRunAll = async () => {
    if (!notebookPanel?.content || params.length === 0) {
      return;
    }

    const firstParam = params[0];
    try {
      isSyncingRef.current = true;
      await runCellAndDownstream(
        notebookPanel.content,
        notebookPanel.context.sessionContext,
        firstParam.regionStartCellId,
        firstParam.regionStartCellIndex
      );
    } finally {
      isSyncingRef.current = false;
    }
  };

  const groupedParams: Record<string, IParsedParam[]> = {};
  params.forEach(param => {
    const groupName = param.metadata.group || param.regionTitle;
    if (!groupedParams[groupName]) {
      groupedParams[groupName] = [];
    }
    groupedParams[groupName].push(param);
  });

  const isKernelUnavailable = kernelStatus === 'dead' || kernelStatus === 'reconnecting';
  const isKernelBusy = kernelStatus === 'busy';

  return (
    <div className="param-sidebar-container">
      <div className="param-sidebar-header">
        <h3 className="param-sidebar-title">自动参数绑定面板</h3>
        <div className="param-sidebar-controls">
          <button className="param-btn secondary" onClick={refreshParams}>
            刷新扫描
          </button>
          <button
            className="param-btn primary"
            onClick={handleManualRunAll}
            disabled={params.length === 0 || isKernelUnavailable}
          >
            运行下游
          </button>
        </div>
        <label className="param-checkbox-label">
          <input
            type="checkbox"
            checked={autoRun}
            onChange={event => setAutoRun(event.target.checked)}
          />
          <span>自动计算下游</span>
        </label>
      </div>

      {isKernelUnavailable && (
        <div className="param-status-alert danger">Kernel 未连接或死机，自动运行已禁用。</div>
      )}
      {isKernelBusy && (
        <div className="param-status-alert warning">Kernel 正在计算中，请稍候...</div>
      )}

      {params.length === 0 ? (
        <div className="param-sidebar-empty">
          <p>当前 Notebook 未检测到参数层代码。</p>
          <p className="param-tip">在 Markdown 标题中写入“参数层代码”，并在其后的代码单元格中使用普通赋值即可扫描。</p>
          <pre>{'H = 0.01\nT_w = 3000'}</pre>
        </div>
      ) : (
        <div className="param-groups-list">
          {Object.keys(groupedParams).map(groupName => {
            const isExpanded = expandedGroups[groupName] !== false;
            return (
              <div key={groupName} className={`param-group-card ${isExpanded ? 'expanded' : ''}`}>
                <div
                  className="param-group-header"
                  onClick={() => setExpandedGroups(previous => ({ ...previous, [groupName]: !isExpanded }))}
                >
                  <span className="param-group-icon">{isExpanded ? '▼' : '▶'}</span>
                  <span className="param-group-name">{groupName}</span>
                  <span className="param-group-count">{groupedParams[groupName].length} 个参数</span>
                </div>

                {isExpanded && (
                  <div className="param-group-content">
                    {groupedParams[groupName].map(param => {
                      const value = tempValues[param.variableName] !== undefined
                        ? tempValues[param.variableName]
                        : param.value;
                      const controlType = param.metadata.type;
                      const label = param.metadata.label || param.variableName;
                      const numericControl = resolveNumericControlAttributes(
                        param.metadata,
                        param.value,
                        value
                      );
                      const configDetailsKey = paramInstanceKey(param);
                      const isConfigDetailsOpen = expandedConfigDetails[configDetailsKey] ?? !param.configured;

                      return (
                        <div key={`${param.cellId}-${param.variableName}`} className="param-item-row">
                          <div className="param-item-meta">
                            <span className="param-item-name" title={param.variableName}>{label}</span>
                            <span className="param-item-code">{param.variableName}</span>
                          </div>

                          <div className="param-item-control">
                            {(controlType === 'slider' || controlType === 'number') && (
                              <div className="param-slider-wrapper">
                                {controlType === 'slider' && (
                                  <input
                                    type="range"
                                    className="param-range-input"
                                    min={numericControl.min}
                                    max={numericControl.max}
                                    step={numericControl.step}
                                    value={numericControl.rangeValue}
                                    onChange={event => handleValueDrag(param, Number(event.target.value))}
                                    onMouseUp={event => handleValueCommit(param, Number((event.target as HTMLInputElement).value))}
                                    onTouchEnd={event => handleValueCommit(param, Number((event.target as HTMLInputElement).value))}
                                    disabled={isKernelUnavailable}
                                  />
                                )}
                                <input
                                  type="number"
                                  className="param-number-input"
                                  min={numericControl.min}
                                  max={numericControl.max}
                                  step={numericControl.step}
                                  value={numericControl.inputValue}
                                  onChange={event => handleValueDrag(param, event.target.value)}
                                  onBlur={event => handleValueCommit(param, Number(event.target.value))}
                                  disabled={isKernelUnavailable}
                                />
                              </div>
                            )}

                            {controlType === 'boolean' && (
                              <label className="param-switch">
                                <input
                                  type="checkbox"
                                  checked={!!value}
                                  onChange={event => handleValueCommit(param, event.target.checked)}
                                  disabled={isKernelUnavailable}
                                />
                                <span className="param-switch-slider"></span>
                              </label>
                            )}

                            {controlType === 'dropdown' && (
                              <select
                                className="param-select-input"
                                value={String(value)}
                                onChange={event => handleValueCommit(param, event.target.value)}
                                disabled={isKernelUnavailable}
                              >
                                {(param.metadata.options || []).map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            )}

                            {controlType === 'text' && (
                              <input
                                className="param-text-input"
                                value={String(value)}
                                onChange={event => handleValueDrag(param, event.target.value)}
                                onBlur={event => handleValueCommit(param, event.target.value)}
                                disabled={isKernelUnavailable}
                              />
                            )}
                          </div>

                          <details
                            className="param-config-details"
                            open={isConfigDetailsOpen}
                            onToggle={event => {
                              const open = (event.currentTarget as HTMLDetailsElement).open;
                              setExpandedConfigDetails(previous => (
                                previous[configDetailsKey] === open
                                  ? previous
                                  : { ...previous, [configDetailsKey]: open }
                              ));
                            }}
                          >
                            <summary>{param.configured ? '参数设置' : '设置控件范围'}</summary>
                            <div className="param-config-grid">
                              <label>
                                <span>显示名</span>
                                <input
                                  defaultValue={label}
                                  onBlur={event => saveConfig(param, { label: event.target.value || param.variableName })}
                                />
                              </label>
                              <label>
                                <span>控件</span>
                                <select
                                  defaultValue={controlType}
                                  onChange={event => saveConfig(param, { type: event.target.value as ParamControlType })}
                                >
                                  <option value="number">数字</option>
                                  <option value="slider">滑块</option>
                                  <option value="boolean">开关</option>
                                  <option value="text">文本</option>
                                  <option value="dropdown">下拉</option>
                                </select>
                              </label>
                              {(controlType === 'number' || controlType === 'slider') && (
                                <>
                                  <label>
                                    <span>最小值</span>
                                    <input
                                      type="number"
                                      step="any"
                                      defaultValue={param.metadata.min ?? ''}
                                      onBlur={event => saveConfig(param, { min: numericOrUndefined(event.target.value) })}
                                    />
                                  </label>
                                  <label>
                                    <span>最大值</span>
                                    <input
                                      type="number"
                                      step="any"
                                      defaultValue={param.metadata.max ?? ''}
                                      onBlur={event => saveConfig(param, { max: numericOrUndefined(event.target.value) })}
                                    />
                                  </label>
                                  <label>
                                    <span>步长</span>
                                    <input
                                      type="number"
                                      step="any"
                                      defaultValue={param.metadata.step ?? ''}
                                      onBlur={event => saveConfig(param, { step: numericOrUndefined(event.target.value) })}
                                    />
                                  </label>
                                </>
                              )}
                              {controlType === 'dropdown' && (
                                <label className="param-config-wide">
                                  <span>选项</span>
                                  <input
                                    defaultValue={(param.metadata.options || []).join(', ')}
                                    onBlur={event => saveConfig(param, { options: parseOptions(event.target.value) })}
                                  />
                                </label>
                              )}
                            </div>
                          </details>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
