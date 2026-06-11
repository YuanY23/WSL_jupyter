import { IDisposable, DisposableDelegate } from '@lumino/disposable';

import { ToolbarButton, Dialog } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { requestAPI } from './validateassignment';

import { showNbGraderDialog, validate } from '../common/validate';

var nbgrader_version = "0.9.5"; // TODO: hardcoded value

class ValidateButton extends ToolbarButton {
  private _buttonCallback = this.newButtonCallback();
  private _versionCheckCallback = this.newVersionCheckCallback();
  private _saveCallback = this.newSaveCallback();
  private panel: NotebookPanel;

  constructor(panel: NotebookPanel) {
    super({
      className: 'validate-button',
      // iconClass: 'fa fa-fast-forward',
      label: '验证作业',
      onClick: () => {this.buttonCallback();},
      tooltip: '验证作业'
    });
    this.panel = panel;
  }

  private get buttonCallback() {
    return this._buttonCallback;
  }

  private get saveCallback() {
    return this._saveCallback;
  }

  private get versionCheckCallback() {
    return this._versionCheckCallback;
  }

  dispose() {
    if (this.isDisposed) {
      return;
    }
    this.panel = null;
    super.dispose()
  }

  private newSaveCallback() {
    return (sender: DocumentRegistry.IContext<INotebookModel>,
            args: DocumentRegistry.SaveState) => {
      if (args !== 'completed' && args !== 'failed') {
        return;
      }

      this.panel.context.saveState.disconnect(this.saveCallback);

      if (args !== "completed") {
        showNbGraderDialog({
          title: "验证失败",
          body: "无法保存笔记本",
          buttons: [Dialog.okButton({ label: '确定' })],
          focusNodeSelector: 'input'
        }, true);
        this.setButtonLabel();
        this.setButtonDisabled(false);
        return;
      }

      this.setButtonLabel('验证中...');
      const notebook_path = this.panel.context.path
      requestAPI<any>(
          'assignments/validate',
          { method: 'POST' },
          new Map([['path', notebook_path]])
      ).then(data => {
        validate(data);
        this.setButtonLabel();
        this.setButtonDisabled(false);
      }).catch(reason => {
        showNbGraderDialog({
          title: "验证失败",
          body: `无法验证：${reason}`,
          buttons: [Dialog.okButton({ label: '确定' })],
          focusNodeSelector: 'input'
        }, true);
        this.setButtonLabel();
        this.setButtonDisabled(false);
      });
    }
  }

  private newVersionCheckCallback() {
    return (data: any) => {
      if (data.success !== true) {
        showNbGraderDialog({
          title: "版本不匹配",
          body: data.message,
          buttons: [Dialog.okButton({ label: '确定' })],
          focusNodeSelector: 'input'
        }, true);
        return;
      }

      this.setButtonDisabled();
      this.setButtonLabel('保存中...');
      this.panel.context.saveState.connect(this.saveCallback);
      this.panel.context.save();
    }
  }

  private newButtonCallback() {
    return () => {
      requestAPI<any>(
          'nbgrader_version',
          undefined,
          new Map([['version', nbgrader_version]])
      ).then(
          this.versionCheckCallback
      ).catch(reason => {
        // The validate_assignment server extension appears to be missing
        showNbGraderDialog({
          title: "验证失败",
          body: `无法检查版本：${reason}`,
          buttons: [Dialog.okButton({ label: '确定' })],
          focusNodeSelector: 'input'
        }, true);
      });
    }
  }

  private setButtonDisabled(disabled: boolean = true): void {
    const button = this.node.getElementsByTagName('jp-button')[0];
    if (disabled) {
      button.setAttribute('disabled', 'disabled');
    } else {
      button.removeAttribute('disabled');
    }
  }

  private setButtonLabel(label: string = '验证作业'): void {
    const labelElement = this.node.getElementsByClassName(
        'jp-ToolbarButtonComponent-label')[0] as HTMLElement;
    labelElement.innerText = label;
  }

}

export class ButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  /**
   * Create a new extension object.
   */
  createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    const button = new ValidateButton(panel);

    // let children = panel.toolbar.children();
    let index = 0;
    for (let widget of panel.toolbar.children()) {
      if (widget == undefined) {
        break;
      }
      if (widget.node.classList.contains("jp-Toolbar-spacer")) {
        break;
      }
      index ++;
    }
    panel.toolbar.insertItem(index, 'runAll', button);
    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}
