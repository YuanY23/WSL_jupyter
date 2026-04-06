import { showDialog, Dialog, InputDialog } from '@jupyterlab/apputils';
export async function saveAndUpgradeNotebook(app, tabs) {
    var _a;
    const currentWidget = tabs.currentTempWidget;
    if (!currentWidget) {
        showDialog({ title: '没有选中工作的 Tab', body: '请先执行一个仿真方案', buttons: [Dialog.warnButton()] });
        return;
    }
    const notebookJson = currentWidget._tempNbJson;
    const scenarioId = currentWidget._tempScenarioId;
    if (!notebookJson) {
        // Possibly it's already a real notebook widget or just the placeholder
        showDialog({ title: '无法保存', body: '当前选中的标签不是临时版工程。' });
        return;
    }
    // Ask for filename
    const result = await InputDialog.getText({
        title: '保存临时 Tab 为真实 Notebook',
        text: `热设计仿真_${scenarioId}_${new Date().toISOString().slice(0, 10)}.ipynb`
    });
    if (!result.button.accept || !result.value) {
        return; // Cancelled
    }
    const filename = result.value.endsWith('.ipynb') ? result.value : result.value + '.ipynb';
    // Use ContentsManager to save
    const browser = app.serviceManager.contents;
    try {
        const fileModel = await browser.save(filename, {
            type: 'notebook',
            format: 'json',
            content: notebookJson
        });
        console.log(`File saved: ${fileModel.path}`);
        // Here we should inject the real notebook panel into the tab
        // Instead of replacing in the tab natively, Jupyter often relies on launching
        // real Notebook files in the main dock. Let's try to open it inside the dock for stability!
        // Or we can try to render it in our own tab if strictly required. 
        // Opening it natively using command `docmanager:open` ensures ALL nbgrader extensions attach to it.
        (_a = tabs.currentWidget) === null || _a === void 0 ? void 0 : _a.dispose(); // Close the temporary tab natively
        await app.commands.execute('docmanager:open', {
            path: fileModel.path
        });
    }
    catch (err) {
        showDialog({ title: '保存失败', body: err.message });
    }
}
//# sourceMappingURL=FileOperations.js.map