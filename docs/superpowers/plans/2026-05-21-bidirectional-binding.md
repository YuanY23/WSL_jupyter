# 自动双向绑定与交互参数滑块系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个 JupyterLab 侧边栏参数面板插件，能够自动提取 Notebook 中的 `# @param` 变量元数据并生成 React 滑块等控件，拖动滑块时能实时修改 Notebook 代码并在松开鼠标时自动运行该单元格及其下游计算，同时反向同步 Notebook 手动代码运行的值。

**Architecture:** 
在前端 JupyterLab 扩展中通过 `INotebookTracker` 监听当前活动的 Notebook 及其执行事件；使用正则表达式解析器扫描并替换单元格中的特定变量声明行；通过 React 构建侧边栏表单视图，使用 `NotebookActions.runSelected` 调度下游单元格执行；引入锁定标志位防止正反向更新死循环。

**Tech Stack:** TypeScript, React, JupyterLab 4 APIs (`INotebookTracker`, `NotebookActions`), Lumino Widgets

---

### Task 1: 单元格代码解析器 (CellCodeParser) 及单元格单元测试

**Files:**
- Create: `jupyterlab-thermal-design/src/utils/CellCodeParser.ts`
- Create: `jupyterlab-thermal-design/src/utils/test-parser.ts`

- [ ] **Step 1: 创建代码解析器 `CellCodeParser.ts`**
  写出精确匹配 `# @param` 注释并解析其元数据的静态解析方法。

  ```typescript
  export interface ParamMeta {
    type: 'slider' | 'dropdown' | 'number' | 'boolean';
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
    label?: string;
  }

  export interface ParamInfo {
    varName: string;
    value: any;
    meta: ParamMeta;
    cellIndex: number;
    lineIndex: number;
    originalLine: string;
  }

  export class CellCodeParser {
    static parseCell(source: string, cellIndex: number): ParamInfo[] {
      const params: ParamInfo[] = [];
      const lines = source.split('\n');
      // 匹配：变量名 = 默认值 # @param {type:"..."}
      const paramRegex = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+?)\s*#\s*@param\s*(\{.*\})\s*$/;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(paramRegex);
        if (match) {
          const varName = match[1];
          const rawValue = match[2].trim();
          const rawMeta = match[3];
          try {
            // 安全且兼容宽松格式的 JSON 解析 (支持无引号的键名)
            const meta = Function(`return ${rawMeta}`)() as ParamMeta;
            let value: any = rawValue;
            
            if (meta.type === 'slider' || meta.type === 'number') {
              value = parseFloat(rawValue);
            } else if (meta.type === 'boolean') {
              value = rawValue === 'True' || rawValue === 'true';
            } else if (meta.type === 'dropdown') {
              // 去除字符串前后的单双引号
              value = rawValue.replace(/^['"]|['"]$/g, '');
            }
            
            params.push({
              varName,
              value,
              meta,
              cellIndex,
              lineIndex: i,
              originalLine: line
            });
          } catch (e) {
            console.warn('Failed to parse metadata for line:', line, e);
          }
        }
      }
      return params;
    }
  }
  ```

- [ ] **Step 2: 创建本地单元测试文件 `test-parser.ts`**
  编写包含四种类型参数的代码段，断言解析器能够正确提取各变量信息。

  ```typescript
  import { CellCodeParser } from './CellCodeParser';

  const sampleCell = `
  k = 5.0 # @param {type:"slider", min:0.1, max:20.0, step:0.1, label:"Thermal K"}
  title = "steady" # @param {type:"dropdown", options:["steady", "transient"], label:"Type"}
  use_grid = True # @param {type:"boolean", label:"Grid"}
  temp_val = 100 # @param {type:"number", min:10, max:500, label:"Temp"}
  `;

  const params = CellCodeParser.parseCell(sampleCell, 0);
  console.log('Parsed params:', params);

  if (params.length !== 4) {
    throw new Error(`Expected 4 parameters, got ${params.length}`);
  }
  if (params[0].varName !== 'k' || params[0].value !== 5.0 || params[0].meta.type !== 'slider') {
    throw new Error('Parameter k parsed incorrectly');
  }
  if (params[1].varName !== 'title' || params[1].value !== 'steady' || params[1].meta.type !== 'dropdown') {
    throw new Error('Parameter title parsed incorrectly');
  }
  if (params[2].varName !== 'use_grid' || params[2].value !== true || params[2].meta.type !== 'boolean') {
    throw new Error('Parameter use_grid parsed incorrectly');
  }
  if (params[3].varName !== 'temp_val' || params[3].value !== 100 || params[3].meta.type !== 'number') {
    throw new Error('Parameter temp_val parsed incorrectly');
  }

  console.log('All parsing tests passed!');
  ```

- [ ] **Step 3: 运行解析器测试**
  在宿主机运行测试代码（由于包含 ES module 导入，使用 ts-node 或 tsc 编译后用 node 运行）。
  运行命令：
  `npx ts-node jupyterlab-thermal-design/src/utils/test-parser.ts`
  预期输出：`All parsing tests passed!`

- [ ] **Step 4: 提交代码**
  `git add jupyterlab-thermal-design/src/utils/CellCodeParser.ts jupyterlab-thermal-design/src/utils/test-parser.ts`
  `git commit -m "feat: add CellCodeParser and unit test for @param syntax"`

---

### Task 2: 单元格代码更新器 (CellCodeUpdater) 及更新功能测试

**Files:**
- Create: `jupyterlab-thermal-design/src/utils/CellCodeUpdater.ts`
- Modify: `jupyterlab-thermal-design/src/utils/test-parser.ts`

- [ ] **Step 1: 创建代码更新器 `CellCodeUpdater.ts`**
  实现根据行号和变量名，只替换对应行中 `=` 与 `#` 之间的值，保持前后其他字符不变的方法。

  ```typescript
  export class CellCodeUpdater {
    static updateValueInSource(
      source: string, 
      lineIndex: number, 
      varName: string, 
      newValue: any, 
      type: string
    ): string {
      const lines = source.split('\n');
      if (lineIndex < 0 || lineIndex >= lines.length) {
        throw new Error(`Line index ${lineIndex} out of bounds`);
      }
      const line = lines[lineIndex];
      const paramRegex = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+?)\s*#\s*@param\s*(\{.*\})\s*$/;
      const match = line.match(paramRegex);
      if (!match || match[1] !== varName) {
        throw new Error(`Variable ${varName} not found on line ${lineIndex}`);
      }
      
      let formattedValue = String(newValue);
      if (type === 'dropdown') {
        formattedValue = `"${newValue}"`;
      } else if (type === 'boolean') {
        formattedValue = newValue ? 'True' : 'False';
      }
      
      const beforeEqual = line.indexOf('=');
      const afterParam = line.indexOf('#');
      
      // 保留等号前和注释后的内容，仅重写值
      const newSourceLine = line.substring(0, beforeEqual + 1) + ` ${formattedValue} ` + line.substring(afterParam);
      lines[lineIndex] = newSourceLine;
      return lines.join('\n');
    }
  }
  ```

- [ ] **Step 2: 在 `test-parser.ts` 中增加更新功能测试断言**
  增加修改测试：

  ```typescript
  // 续 test-parser.ts 底部
  import { CellCodeUpdater } from './CellCodeUpdater';

  const updatedSource = CellCodeUpdater.updateValueInSource(sampleCell, 0, 'k', 7.5, 'slider');
  const reParsed = CellCodeParser.parseCell(updatedSource, 0);

  if (reParsed[0].value !== 7.5) {
    throw new Error(`Expected updated value of k to be 7.5, got ${reParsed[0].value}`);
  }

  const updatedDropdown = CellCodeUpdater.updateValueInSource(updatedSource, 1, 'title', 'transient', 'dropdown');
  const reParsed2 = CellCodeParser.parseCell(updatedDropdown, 0);

  if (reParsed2[1].value !== 'transient' || !updatedDropdown.includes('"transient"')) {
    throw new Error('Dropdown update failed or format incorrect');
  }

  console.log('All updater tests passed!');
  ```

- [ ] **Step 3: 运行更新器测试**
  运行命令：
  `npx ts-node jupyterlab-thermal-design/src/utils/test-parser.ts`
  预期输出：`All updater tests passed!`

- [ ] **Step 4: 提交代码**
  `git add jupyterlab-thermal-design/src/utils/CellCodeUpdater.ts jupyterlab-thermal-design/src/utils/test-parser.ts`
  `git commit -m "feat: add CellCodeUpdater and verify cell text update logic"`

---

### Task 3: 自动执行管理器 (CellExecutionManager)

**Files:**
- Create: `jupyterlab-thermal-design/src/utils/CellExecutionManager.ts`

- [ ] **Step 1: 创建 `CellExecutionManager.ts`**
  实现自动选中指定单元格及其下游的所有单元格，触发运行，然后静默还原用户原有焦点的功能。

  ```typescript
  import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';

  export class CellExecutionManager {
    static async runCellAndDownstream(tracker: INotebookTracker, cellIndex: number): Promise<void> {
      const panel = tracker.currentWidget;
      if (!panel) return;
      const notebook = panel.content;
      const sessionContext = panel.sessionContext;
      
      const originalActiveIndex = notebook.activeCellIndex;
      const cells = notebook.widgets;
      
      if (cellIndex < 0 || cellIndex >= cells.length) {
        return;
      }
      
      // 1. 清除当前选中
      notebook.deselectAll();
      
      // 2. 选择目标参数单元格以及其下游所有的代码/Markdown 单元格
      for (let i = cellIndex; i < cells.length; i++) {
        notebook.select(cells[i]);
      }
      
      try {
        // 3. 执行选中的单元格组
        await NotebookActions.runSelected(notebook, sessionContext);
      } catch (err) {
        console.error('CellExecutionManager failed to run cells:', err);
      } finally {
        // 4. 瞬间还原光标和焦点，防止页面视图抖动
        notebook.activeCellIndex = originalActiveIndex;
      }
    }
  }
  ```

- [ ] **Step 2: 提交代码**
  `git add jupyterlab-thermal-design/src/utils/CellExecutionManager.ts`
  `git commit -m "feat: add CellExecutionManager for running target and downstream cells"`

---

### Task 4: 侧边栏 React 控件面板 (ParamSidebar)

**Files:**
- Create: `jupyterlab-thermal-design/src/components/ParamSidebar.tsx`

- [ ] **Step 1: 创建 `ParamSidebar.tsx`**
  利用 React hooks 监听当前活动 Notebook，解析代码中的参数元数据，并根据元数据的 `type` 渲染成不同 UI 控件。

  ```tsx
  import React, { useState, useEffect, useRef } from 'react';
  import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
  import { CellCodeParser, ParamInfo } from '../utils/CellCodeParser';
  import { CellCodeUpdater } from '../utils/CellCodeUpdater';
  import { CellExecutionManager } from '../utils/CellExecutionManager';

  interface ParamSidebarProps {
    tracker: INotebookTracker;
  }

  // 向上查找最近的 Markdown 标题作为分组
  function findNearestHeading(cells: any[], cellIndex: number): string {
    for (let i = cellIndex; i >= 0; i--) {
      const cell = cells[i];
      if (cell.model.type === 'markdown') {
        const text = cell.model.sharedModel.getSource();
        const match = text.match(/^#+\s*(.+)$/m);
        if (match) {
          return match[1].trim();
        }
      }
    }
    return '全局变量';
  }

  export const ParamSidebar: React.FC<ParamSidebarProps> = ({ tracker }) => {
    const [params, setParams] = useState<ParamInfo[]>([]);
    const [autoRun, setAutoRun] = useState(true);
    const [isKernelConnected, setIsKernelConnected] = useState(false);
    const isSyncingFromSidebar = useRef(false);

    const scanNotebook = () => {
      if (isSyncingFromSidebar.current) return;
      const panel = tracker.currentWidget;
      if (!panel) {
        setParams([]);
        return;
      }
      const notebook = panel.content;
      const cells = notebook.widgets;
      const allParams: ParamInfo[] = [];
      
      cells.forEach((cell, idx) => {
        if (cell.model.type === 'code') {
          const source = cell.model.sharedModel.getSource();
          const parsed = CellCodeParser.parseCell(source, idx);
          allParams.push(...parsed);
        }
      });
      setParams(allParams);
    };

    useEffect(() => {
      scanNotebook();

      // 监听 Notebook 窗口切换
      tracker.currentChanged.connect(scanNotebook);
      
      // 监听 Notebook 执行结束以反向同步代码数值
      const onExecuted = () => {
        scanNotebook();
      };
      NotebookActions.executed.connect(onExecuted);
      
      const updateKernelStatus = () => {
        const panel = tracker.currentWidget;
        if (panel) {
          setIsKernelConnected(panel.sessionContext.session?.kernel?.connectionStatus === 'connected');
        } else {
          setIsKernelConnected(false);
        }
      };
      
      const onSessionChanged = () => {
        updateKernelStatus();
        const panel = tracker.currentWidget;
        if (panel) {
          panel.sessionContext.connectionStatusChanged.connect(updateKernelStatus);
        }
      };
      
      tracker.currentChanged.connect(onSessionChanged);
      onSessionChanged();

      return () => {
        tracker.currentChanged.disconnect(scanNotebook);
        tracker.currentChanged.disconnect(onSessionChanged);
        NotebookActions.executed.disconnect(onExecuted);
      };
    }, [tracker]);

    const handleParamChange = (p: ParamInfo, newValue: any) => {
      const panel = tracker.currentWidget;
      if (!panel) return;
      const notebook = panel.content;
      const cell = notebook.widgets[p.cellIndex];
      if (!cell) return;
      
      isSyncingFromSidebar.current = true;
      try {
        const source = cell.model.sharedModel.getSource();
        const newSource = CellCodeUpdater.updateValueInSource(source, p.lineIndex, p.varName, newValue, p.meta.type);
        cell.model.sharedModel.setSource(newSource);
        
        // 瞬间同步本地状态，避免 UI 抖动
        setParams(prev => prev.map(item => 
          (item.cellIndex === p.cellIndex && item.varName === p.varName)
            ? { ...item, value: newValue }
            : item
        ));
      } catch (e) {
        console.error('Failed to update parameter in source:', e);
      } finally {
        isSyncingFromSidebar.current = false;
      }
    };

    const handleParamChangeEnd = (p: ParamInfo) => {
      if (autoRun) {
        CellExecutionManager.runCellAndDownstream(tracker, p.cellIndex);
      }
    };

    // 整理分组
    const groupedParams: { [groupName: string]: ParamInfo[] } = {};
    const panel = tracker.currentWidget;
    const cells = panel ? panel.content.widgets : [];

    params.forEach(p => {
      const group = findNearestHeading(cells, p.cellIndex);
      if (!groupedParams[group]) {
        groupedParams[group] = [];
      }
      groupedParams[group].push(p);
    });

    return (
      <div className="param-sidebar-container">
        <div className="param-sidebar-header">
          <button onClick={scanNotebook} className="param-btn">🔃 重新扫描</button>
          <label className="param-toggle">
            <input 
              type="checkbox" 
              checked={autoRun} 
              onChange={e => setAutoRun(e.target.checked)} 
            />
            自动运行
          </label>
        </div>
        
        {!isKernelConnected && (
          <div className="param-kernel-warning">
            ⚠️ Python 内核未连接，计算暂不可用
          </div>
        )}

        <div className="param-groups-list">
          {Object.keys(groupedParams).map(groupName => (
            <div key={groupName} className="param-group">
              <h4 className="param-group-title">📁 {groupName}</h4>
              <div className="param-group-content">
                {groupedParams[groupName].map(p => (
                  <div key={`${p.cellIndex}-${p.varName}`} className="param-item">
                    <div className="param-label-row">
                      <span className="param-label">{p.meta.label || p.varName}</span>
                      <span className="param-value-badge">{String(p.value)}</span>
                    </div>
                    
                    {p.meta.type === 'slider' && (
                      <input 
                        type="range"
                        min={p.meta.min ?? 0}
                        max={p.meta.max ?? 100}
                        step={p.meta.step ?? 1}
                        value={p.value}
                        className="param-control-slider"
                        onChange={e => handleParamChange(p, parseFloat(e.target.value))}
                        onMouseUp={() => handleParamChangeEnd(p)}
                      />
                    )}

                    {p.meta.type === 'number' && (
                      <input 
                        type="number"
                        min={p.meta.min}
                        max={p.meta.max}
                        value={p.value}
                        className="param-control-number"
                        onChange={e => handleParamChange(p, parseFloat(e.target.value))}
                        onBlur={() => handleParamChangeEnd(p)}
                      />
                    )}

                    {p.meta.type === 'dropdown' && (
                      <select
                        value={p.value}
                        className="param-control-select"
                        onChange={e => {
                          handleParamChange(p, e.target.value);
                          if (autoRun) CellExecutionManager.runCellAndDownstream(tracker, p.cellIndex);
                        }}
                      >
                        {p.meta.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {p.meta.type === 'boolean' && (
                      <input 
                        type="checkbox"
                        checked={!!p.value}
                        className="param-control-checkbox"
                        onChange={e => {
                          handleParamChange(p, e.target.checked);
                          if (autoRun) CellExecutionManager.runCellAndDownstream(tracker, p.cellIndex);
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  ```

- [ ] **Step 2: 提交代码**
  `git add jupyterlab-thermal-design/src/components/ParamSidebar.tsx`
  `git commit -m "feat: implement ParamSidebar React component for parameter control"`

---

### Task 5: 侧边栏 CSS 样式美化

**Files:**
- Modify: `jupyterlab-thermal-design/style/base.css:39-80`

- [ ] **Step 1: 在 `base.css` 尾部追加侧边栏视觉样式**
  使用 JupyterLab 内置的主题 CSS 变量，确保支持 Light 与 Dark 主题完美兼容。

  ```css
  /* 
   *-------------------------------------------------------------------------------------------------------
   * Param Sidebar CSS Styles
   *-------------------------------------------------------------------------------------------------------
   */
  .param-sidebar-widget {
    background-color: var(--jp-layout-color1);
    color: var(--jp-ui-font-color1);
    font-family: var(--jp-ui-font-family);
    font-size: var(--jp-ui-font-size1);
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .param-sidebar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 12px;
    box-sizing: border-box;
  }

  .param-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--jp-border-color2);
  }

  .param-btn {
    background-color: var(--jp-layout-color3);
    color: var(--jp-ui-font-color1);
    border: 1px solid var(--jp-border-color1);
    padding: 4px 8px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
  }
  .param-btn:hover {
    background-color: var(--jp-layout-color4);
  }

  .param-toggle {
    display: flex;
    align-items: center;
    font-size: 11px;
    cursor: pointer;
  }
  .param-toggle input {
    margin-right: 4px;
  }

  .param-kernel-warning {
    background-color: var(--jp-warn-color3);
    color: var(--jp-ui-font-color1);
    padding: 6px;
    border-radius: 4px;
    font-size: 11px;
    margin-bottom: 10px;
    text-align: center;
  }

  .param-groups-list {
    flex: 1;
    overflow-y: auto;
  }

  .param-group {
    background-color: var(--jp-layout-color2);
    border: 1px solid var(--jp-border-color2);
    border-radius: 4px;
    margin-bottom: 12px;
    padding: 8px;
  }

  .param-group-title {
    margin: 0 0 8px 0;
    font-size: 12px;
    font-weight: bold;
    color: var(--jp-ui-font-color2);
    border-bottom: 1px solid var(--jp-border-color3);
    padding-bottom: 4px;
  }

  .param-item {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
  }

  .param-label-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    margin-bottom: 4px;
  }

  .param-label {
    font-weight: 500;
  }

  .param-value-badge {
    background-color: var(--jp-layout-color3);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 10px;
    font-family: monospace;
  }

  .param-control-slider {
    width: 100%;
    margin: 2px 0;
  }

  .param-control-number, .param-control-select {
    background-color: var(--jp-layout-color1);
    color: var(--jp-ui-font-color1);
    border: 1px solid var(--jp-border-color1);
    padding: 3px;
    border-radius: 3px;
    font-size: 11px;
  }

  .param-control-checkbox {
    align-self: flex-start;
  }
  ```

- [ ] **Step 2: 提交代码**
  `git add jupyterlab-thermal-design/style/base.css`
  `git commit -m "style: add CSS styles for parameter control sidebar"`

---

### Task 6: 注册侧边栏 Widget 并与 JupyterLab 绑定

**Files:**
- Modify: `jupyterlab-thermal-design/src/index.ts`

- [ ] **Step 1: 修改 `index.ts`**
  引入 `INotebookTracker` token；创建并向 app 的左侧区域（`left` 区域）添加 `ParamSidebarWidget` 侧边栏。

  ```typescript
  // 修改后完整的 index.ts 如下：
  import {
      JupyterFrontEnd,
      JupyterFrontEndPlugin
  } from '@jupyterlab/application';
  import { ICommandPalette, MainAreaWidget, ReactWidget } from '@jupyterlab/apputils';
  import { IMainMenu } from '@jupyterlab/mainmenu';
  import { INotebookTracker } from '@jupyterlab/notebook';
  import { Widget, Menu } from '@lumino/widgets';
  import { ThermalDesignWorkbench } from './MainWidget';
  import { ParamSidebar } from './components/ParamSidebar';
  import React from 'react';

  const CommandIDs = {
      openWorkbench: 'thermal-design:open-workbench'
  };

  /**
   * 侧边栏 Widget 封装
   */
  export class ParamSidebarWidget extends ReactWidget {
      private _tracker: INotebookTracker;

      constructor(tracker: INotebookTracker) {
          super();
          this.id = 'jupyterlab-param-sidebar';
          this.title.iconClass = 'jp-SideBar-icon jp-SliderIcon'; // 使用 JupyterLab 原生的 slider 图标
          this.title.caption = '交互式参数滑块面板';
          this._tracker = tracker;
          this.addClass('param-sidebar-widget');
      }

      protected render(): React.ReactElement {
          return <ParamSidebar tracker={this._tracker} />;
      }
  }

  /**
   * Initialization data for the jupyterlab-thermal-design extension.
   */
  const plugin: JupyterFrontEndPlugin<void> = {
      id: 'jupyterlab-thermal-design:plugin',
      description: 'Thermal Design Simulation',
      autoStart: true,
      requires: [ICommandPalette, IMainMenu, INotebookTracker], // 增加要求 INotebookTracker
      activate: (
          app: JupyterFrontEnd,
          palette: ICommandPalette,
          mainMenu: IMainMenu,
          tracker: INotebookTracker // 注入 INotebookTracker
      ) => {
          console.log('JupyterLab extension jupyterlab-thermal-design is activated!');

          let widget: MainAreaWidget<Widget>;

          // 1. 创建并添加左侧侧边栏
          const sidebarWidget = new ParamSidebarWidget(tracker);
          app.shell.add(sidebarWidget, 'left', { rank: 1000 });

          // 2. 注册已有的仿真工作台命令
          app.commands.addCommand(CommandIDs.openWorkbench, {
              label: '打开仿真工作台',
              execute: () => {
                  if (!widget || widget.isDisposed) {
                      const content = new ThermalDesignWorkbench(app);
                      content.id = 'thermal-design-workbench';
                      content.title.label = '热设计原理仿真工作台';
                      content.title.closable = true;

                      widget = new MainAreaWidget({ content });
                      widget.id = 'thermal-design-workbench-main';
                      widget.title.label = '热设计原理仿真工作台';
                      widget.title.closable = true;
                  }

                  if (!widget.isAttached) {
                      app.shell.add(widget, 'main');
                  }
                  app.shell.activateById(widget.id);
              }
          });

          palette.addItem({ command: CommandIDs.openWorkbench, category: 'Thermal Design' });

          const thermalMenu = new Menu({ commands: app.commands });
          thermalMenu.id = 'thermal-design-menu';
          thermalMenu.title.label = '热设计仿真系统';
          thermalMenu.addItem({ command: CommandIDs.openWorkbench });

          mainMenu.addMenu(thermalMenu);
      }
  };

  export default plugin;
  ```

- [ ] **Step 2: 提交代码**
  `git add jupyterlab-thermal-design/src/index.ts`
  `git commit -m "feat: register ParamSidebarWidget in JupyterLab left sidebar area"`

---

### Task 7: 重新构建 Docker 镜像并进行整体测试

- [ ] **Step 1: 重新编译并打包 Docker 镜像**
  由于我们在开发环境容器内热挂载了 `/src/jupyterlab` 和 `/src/nbgrader` 源码，但是并没有热挂载自研插件 `/src/jupyterlab-thermal-design`，因此在修改插件代码后，需要触发整个容器的重新构建。
  在宿主机运行以下命令：
  `docker build -t my_jupyterhub:latest -f Dockerfile-nbgrader .`
  预期输出：Docker 镜像编译成功，没有编译语法或 node 构建错误。

- [ ] **Step 2: 重启 JupyterHub**
  在运行 JupyterHub 终端中按 `Ctrl+C` 结束当前 Hub 进程，随后运行：
  `/home/yuan/miniconda3/envs/jupyter/bin/jupyterhub -f /home/yuan/my_project/jupyterhub_config.py`

- [ ] **Step 3: 进行手动的双向交互测试**
  1. 打开浏览器登录平台，使用 `yuan` 用户登录。
  2. 随便打开一个 Notebook，在一个单元格输入：
     ```python
     k = 5.0 # @param {type:"slider", min:0.1, max:20.0, step:0.1, label:"热传导系数 (W/m·K)"}
     print(f"当前传热系数为: {k}")
     ```
  3. 观察左侧侧边栏中是否出现了一个滑块。拖拽该滑块，观察单元格文本是否同步更改。
  4. 松开鼠标时，观察输出是否重新运行并输出最新的 `k`。
