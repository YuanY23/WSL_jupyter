import React, { useState, useEffect, useRef } from 'react';
import { NotebookPanel, NotebookActions } from '@jupyterlab/notebook';
import { scanNotebookParams, IParsedParam } from '../utils/CellCodeParser';
import { updateCellParamValue } from '../utils/CellCodeUpdater';
import { runCellAndDownstream } from '../utils/CellExecutionManager';

interface IParamSidebarProps {
  notebookPanel: NotebookPanel | null;
}

export const ParamSidebar: React.FC<IParamSidebarProps> = ({ notebookPanel }) => {
  const [params, setParams] = useState<IParsedParam[]>([]);
  const [autoRun, setAutoRun] = useState<boolean>(true);
  const [kernelStatus, setKernelStatus] = useState<string>('unknown');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Keep track of values being currently dragged on sliders to show immediate feedback
  const [tempValues, setTempValues] = useState<Record<string, any>>({});

  const isSyncingRef = useRef<boolean>(false);

  // Scan and refresh parameter list from active notebook
  const refreshParams = () => {
    if (!notebookPanel || !notebookPanel.content) {
      setParams([]);
      return;
    }
    const scanned = scanNotebookParams(notebookPanel.content);
    setParams(scanned);
    
    // Initialize default group expansion (expanded by default)
    const groups: Record<string, boolean> = {};
    scanned.forEach(p => {
      const gName = p.metadata.group || '其他参数';
      if (expandedGroups[gName] === undefined) {
        groups[gName] = true;
      }
    });
    if (Object.keys(groups).length > 0) {
      setExpandedGroups(prev => ({ ...groups, ...prev }));
    }
  };

  // Sync back when notebook executes cells manually
  useEffect(() => {
    if (!notebookPanel) {
      return;
    }

    const onCellExecuted = (sender: any, args: any) => {
      // If we are currently syncing from the sidebar, ignore this execution signal
      if (isSyncingRef.current) {
        return;
      }
      
      // Check if executed notebook is the active one
      if (args.notebook === notebookPanel.content) {
        refreshParams();
      }
    };

    NotebookActions.executed.connect(onCellExecuted);
    
    // Scan initially
    refreshParams();

    // Listen to notebook model changes (e.g. content edits, cell added/deleted)
    const onContentChanged = () => {
      if (!isSyncingRef.current) {
        refreshParams();
      }
    };
    notebookPanel.context.model.contentChanged.connect(onContentChanged);

    // Track kernel status
    const updateStatus = () => {
      setKernelStatus(notebookPanel.context.sessionContext.kernelDisplayStatus);
    };
    notebookPanel.context.sessionContext.statusChanged.connect(updateStatus);
    updateStatus();

    return () => {
      NotebookActions.executed.disconnect(onCellExecuted);
      notebookPanel.context.model.contentChanged.disconnect(onContentChanged);
      notebookPanel.context.sessionContext.statusChanged.disconnect(updateStatus);
    };
  }, [notebookPanel]);

  // Handle value change during dragging (live code updates, no execution yet)
  const handleParamValueDrag = (param: IParsedParam, value: any) => {
    if (!notebookPanel || !notebookPanel.content) {
      return;
    }
    setTempValues(prev => ({ ...prev, [param.variableName]: value }));
    
    // Perform cell code update without execution
    updateCellParamValue(notebookPanel.content, param, value);
  };

  // Handle final change (drag release, dropdown select, blur)
  const handleParamValueCommit = async (param: IParsedParam, value: any) => {
    if (!notebookPanel || !notebookPanel.content) {
      return;
    }

    isSyncingRef.current = true;
    
    // Clear temp value
    setTempValues(prev => {
      const copy = { ...prev };
      delete copy[param.variableName];
      return copy;
    });

    // Update code value in cell
    const success = updateCellParamValue(notebookPanel.content, param, value);
    
    if (success) {
      // Re-scan params to synchronize local state
      const scanned = scanNotebookParams(notebookPanel.content);
      setParams(scanned);

      // Run cell and downstream if autoRun is active
      if (autoRun) {
        const sessionContext = notebookPanel.context.sessionContext;
        await runCellAndDownstream(notebookPanel.content, sessionContext, param.cellId);
      }
    }

    isSyncingRef.current = false;
  };

  // Run downstream manually
  const handleManualRunAll = async () => {
    if (!notebookPanel || !notebookPanel.content || params.length === 0) {
      return;
    }
    // Run from the first parameter cell ID
    const firstCellId = params[0].cellId;
    isSyncingRef.current = true;
    const sessionContext = notebookPanel.context.sessionContext;
    await runCellAndDownstream(notebookPanel.content, sessionContext, firstCellId);
    isSyncingRef.current = false;
  };

  // Group parameters
  const groups: Record<string, IParsedParam[]> = {};
  params.forEach(p => {
    const groupName = p.metadata.group || '其他参数';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(p);
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const isKernelUnavailable = kernelStatus === 'dead' || kernelStatus === 'reconnecting';
  const isKernelBusy = kernelStatus === 'busy';

  return (
    <div className="param-sidebar-container">
      <div className="param-sidebar-header">
        <h3 className="param-sidebar-title">自动参数绑定面板</h3>
        <div className="param-sidebar-controls">
          <button className="param-btn secondary" onClick={refreshParams} title="重新扫描 Notebook 中的参数">
            刷新扫描
          </button>
          <button 
            className="param-btn primary" 
            onClick={handleManualRunAll} 
            disabled={params.length === 0 || isKernelUnavailable}
            title="手动运行所有参数单元格及下游"
          >
            运行下游
          </button>
        </div>
        <div className="param-sidebar-options">
          <label className="param-checkbox-label">
            <input 
              type="checkbox" 
              checked={autoRun} 
              onChange={(e) => setAutoRun(e.target.checked)} 
            />
            <span>自动计算下游</span>
          </label>
        </div>
      </div>

      {isKernelUnavailable && (
        <div className="param-status-alert danger">
          ⚠ Kernel 未连接或死机，自动运行已禁用。
        </div>
      )}
      
      {isKernelBusy && (
        <div className="param-status-alert warning">
          ⚡ Kernel 正在计算中，请稍候...
        </div>
      )}

      {params.length === 0 ? (
        <div className="param-sidebar-empty">
          <p>当前 Notebook 未检测到绑定的参数。</p>
          <p className="param-tip">提示：在代码单元格中的变量后添加注释即可绑定：</p>
          <pre>k = 5.0 # @param {"{type:\"slider\", min:0, max:10}"}</pre>
        </div>
      ) : (
        <div className="param-groups-list">
          {Object.keys(groups).map(groupName => {
            const isExpanded = expandedGroups[groupName] !== false;
            return (
              <div key={groupName} className={`param-group-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="param-group-header" onClick={() => toggleGroup(groupName)}>
                  <span className="param-group-icon">{isExpanded ? '▼' : '▶'}</span>
                  <span className="param-group-name">{groupName}</span>
                  <span className="param-group-count">{groups[groupName].length} 个参数</span>
                </div>
                
                {isExpanded && (
                  <div className="param-group-content">
                    {groups[groupName].map(param => {
                      const value = tempValues[param.variableName] !== undefined 
                        ? tempValues[param.variableName] 
                        : param.value;
                      
                      const label = param.metadata.label || param.variableName;

                      return (
                        <div key={param.variableName} className="param-item-row">
                          <div className="param-item-meta">
                            <span className="param-item-name" title={param.variableName}>{label}</span>
                            <span className="param-item-code">{param.variableName}</span>
                          </div>
                          
                          <div className="param-item-control">
                            {param.metadata.type === 'slider' && (
                              <div className="param-slider-wrapper">
                                <input
                                  type="range"
                                  className="param-range-input"
                                  min={param.metadata.min ?? 0}
                                  max={param.metadata.max ?? 100}
                                  step={param.metadata.step ?? 1}
                                  value={value}
                                  onChange={(e) => handleParamValueDrag(param, Number(e.target.value))}
                                  onMouseUp={(e) => handleParamValueCommit(param, Number((e.target as HTMLInputElement).value))}
                                  onTouchEnd={(e) => handleParamValueCommit(param, Number((e.target as HTMLInputElement).value))}
                                  disabled={isKernelUnavailable}
                                />
                                <input
                                  type="number"
                                  className="param-number-input"
                                  min={param.metadata.min ?? 0}
                                  max={param.metadata.max ?? 100}
                                  step={param.metadata.step ?? 1}
                                  value={value}
                                  onChange={(e) => handleParamValueDrag(param, Number(e.target.value))}
                                  onBlur={(e) => handleParamValueCommit(param, Number(e.target.value))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleParamValueCommit(param, Number((e.target as HTMLInputElement).value));
                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                  disabled={isKernelUnavailable}
                                />
                              </div>
                            )}

                            {param.metadata.type === 'number' && (
                              <input
                                type="number"
                                className="param-number-input full-width"
                                min={param.metadata.min}
                                max={param.metadata.max}
                                value={value}
                                onChange={(e) => handleParamValueDrag(param, Number(e.target.value))}
                                onBlur={(e) => handleParamValueCommit(param, Number(e.target.value))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleParamValueCommit(param, Number((e.target as HTMLInputElement).value));
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                disabled={isKernelUnavailable}
                              />
                            )}

                            {param.metadata.type === 'dropdown' && (
                              <select
                                className="param-select-input"
                                value={value}
                                onChange={(e) => handleParamValueCommit(param, e.target.value)}
                                disabled={isKernelUnavailable}
                              >
                                {(param.metadata.options || []).map((opt: any) => (
                                  <option key={String(opt)} value={String(opt)}>
                                    {String(opt)}
                                  </option>
                                ))}
                              </select>
                            )}

                            {param.metadata.type === 'boolean' && (
                              <label className="param-switch">
                                <input
                                  type="checkbox"
                                  checked={!!value}
                                  onChange={(e) => handleParamValueCommit(param, e.target.checked)}
                                  disabled={isKernelUnavailable}
                                />
                                <span className="param-switch-slider"></span>
                              </label>
                            )}
                          </div>
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
