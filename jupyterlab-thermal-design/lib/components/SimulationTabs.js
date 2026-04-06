import { TabPanel, Widget } from '@lumino/widgets';
import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import ReactECharts from 'echarts-for-react';
const ReadOnlyNotebookView = ({ scenarioId, params, ipynbJson }) => {
    var _a, _b;
    const chartData = (_a = ipynbJson === null || ipynbJson === void 0 ? void 0 : ipynbJson.metadata) === null || _a === void 0 ? void 0 : _a.thermal_chart;
    // Prepare echarts option
    let option = null;
    if (chartData && chartData.x && chartData.y) {
        option = {
            title: { text: chartData.title || '结果分析图', left: 'center' },
            tooltip: { trigger: 'axis' },
            grid: { bottom: 30, left: 60, right: 20 },
            xAxis: { type: 'category', data: chartData.x, name: chartData.x_label },
            yAxis: { type: 'value', name: chartData.y_label },
            series: [{ data: chartData.y, type: 'line', smooth: true, itemStyle: { color: '#0ea5e9' }, areaStyle: { color: 'rgba(14, 165, 233, 0.2)' } }]
        };
    }
    return (React.createElement("div", { style: { padding: '20px', overflowY: 'auto', backgroundColor: 'var(--jp-layout-color0)', height: '100%' } }, (_b = ipynbJson === null || ipynbJson === void 0 ? void 0 : ipynbJson.cells) === null || _b === void 0 ? void 0 :
        _b.map((cell, idx) => (React.createElement("div", { key: idx, style: { marginBottom: '15px', padding: '15px', backgroundColor: 'var(--jp-layout-color1)', border: '1px solid var(--jp-border-color2)', borderRadius: '4px' } },
            cell.cell_type === 'markdown' && (React.createElement("div", { style: { color: 'var(--jp-content-font-color1)', whiteSpace: 'pre-wrap' } }, cell.source.join(''))),
            cell.cell_type === 'code' && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { fontFamily: 'monospace', color: 'var(--jp-mirror-editor-variable-color)', whiteSpace: 'pre-wrap' } }, cell.source.join('')),
                cell.outputs && cell.outputs.length > 0 && (React.createElement("div", { style: { borderTop: '1px dashed var(--jp-border-color2)', marginTop: '10px', paddingTop: '10px' } }, cell.outputs.map((out, oidx) => {
                    if (out.output_type === 'stream') {
                        return React.createElement("pre", { key: oidx, style: { margin: 0, color: 'var(--jp-ui-font-color0)' } }, out.text.join(''));
                    }
                    if (out.output_type === 'display_data' && out.data['text/html']) {
                        return React.createElement("div", { key: oidx, dangerouslySetInnerHTML: { __html: out.data['text/html'].join('') } });
                    }
                    return null;
                })))))))),
        option && (React.createElement("div", { style: { marginBottom: '15px', padding: '15px', backgroundColor: 'var(--jp-layout-color1)', border: '1px solid var(--jp-border-color2)', borderRadius: '4px' } },
            React.createElement(ReactECharts, { option: option, style: { height: '400px', width: '100%' } })))));
};
export class SimulationTabs extends TabPanel {
    constructor(app, notebookTracker) {
        super();
        this.addClass('thermal-tabs-area');
        const placeholder = new Widget();
        placeholder.title.label = '欢迎使用热设计系统';
        placeholder.title.closable = false;
        placeholder.node.innerHTML = '<div style="padding:20px; text-align:center;">请在左侧选择场景并调整参数后点击「仿真执行」</div>';
        this.addWidget(placeholder);
    }
    addTemporaryTab(scenarioId, params, ipynbJson) {
        const title = `*临时示例_${scenarioId}`;
        // Use ReactWidget cleanly wrap the entire read-only logic
        const widget = ReactWidget.create(React.createElement(ReadOnlyNotebookView, { scenarioId: scenarioId, params: params, ipynbJson: ipynbJson }));
        widget.title.label = title;
        widget.title.closable = true;
        // Keep reference of data for Save operation
        widget._tempNbJson = ipynbJson;
        widget._tempScenarioId = scenarioId;
        this.addWidget(widget);
        this.currentWidget = widget;
    }
    get currentTempWidget() {
        return this.currentWidget;
    }
}
//# sourceMappingURL=SimulationTabs.js.map