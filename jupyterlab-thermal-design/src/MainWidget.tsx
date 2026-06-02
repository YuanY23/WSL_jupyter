import { Widget } from '@lumino/widgets';
import { ReactWidget } from '@jupyterlab/apputils';
import { ControlPanel } from './components/ControlPanel';
import React from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { showDialog, Dialog } from '@jupyterlab/apputils';
import { generateNotebook, getScenarioName } from './utils/NotebookGenerator';
import { THERMAL_RESULTS_DIR } from './utils/resultsDirectory';

class ControlPanelWidget extends ReactWidget {
    private _app: JupyterFrontEnd;

    constructor(app: JupyterFrontEnd) {
        super();
        this.addClass('thermal-control-panel');
        this._app = app;
    }

    protected render(): React.ReactElement<any> {
        return (
            <ControlPanel
                onExecute={async (scenarioId, params, controls) => {
                    try {
                        // 1. 生成自包含 notebook JSON
                        const nbJson = generateNotebook(scenarioId, {
                            values: params,
                            controls
                        });

                        // 2. 生成文件名
                        const name = getScenarioName(scenarioId);
                        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
                        const filename = `热设计仿真_${name}_${timestamp}.ipynb`;

                        // 3. 确保目录存在
                        const dirName = THERMAL_RESULTS_DIR;
                        const contentsManager = this._app.serviceManager.contents;
                        try {
                            await contentsManager.get(dirName);
                        } catch (e) {
                            // 目录不存在，则创建一个新的文件夹并重命名
                            const newDir = await contentsManager.newUntitled({ type: 'directory', path: '' });
                            await contentsManager.rename(newDir.path, dirName);
                        }

                        // 4. 通过 ContentsManager 保存到指定工作区
                        const filePath = `${dirName}/${filename}`;
                        const fileModel = await contentsManager.save(filePath, {
                            type: 'notebook',
                            format: 'json',
                            content: nbJson
                        });

                        // 5. 在 JupyterLab 中打开该 notebook
                        await this._app.commands.execute('docmanager:open', {
                            path: fileModel.path
                        });
                    } catch (e: any) {
                        showDialog({
                            title: '生成 Notebook 失败',
                            body: e.message || '未知错误',
                            buttons: [Dialog.okButton()]
                        });
                    }
                }}
            />
        );
    }
}

export class ThermalDesignWorkbench extends Widget {
    constructor(app: JupyterFrontEnd) {
        super();
        this.addClass('thermal-design-workbench');

        const controlPanel = new ControlPanelWidget(app);
        controlPanel.node.style.height = '100%';
        controlPanel.node.style.overflow = 'auto';

        this.node.appendChild(controlPanel.node);

        // ReactWidget needs explicit attach for React rendering
        (controlPanel as any).processMessage(Widget.Msg.AfterAttach);
    }
}
