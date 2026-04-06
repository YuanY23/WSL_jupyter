import { TabPanel, Widget } from '@lumino/widgets';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
export declare class SimulationTabs extends TabPanel {
    constructor(app: JupyterFrontEnd, notebookTracker: INotebookTracker);
    addTemporaryTab(scenarioId: string, params: Record<string, number>, ipynbJson: any): void;
    get currentTempWidget(): Widget | null;
}
