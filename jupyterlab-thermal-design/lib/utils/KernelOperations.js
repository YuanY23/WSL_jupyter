import { showDialog } from '@jupyterlab/apputils';
export async function executeThermalSimulation(app, scenarioId, params) {
    const sessionManager = app.serviceManager.sessions;
    try {
        // Start a new Python session for the background computation
        const session = await sessionManager.startNew({
            path: `thermal_worker_${Date.now()}`,
            type: 'console',
            name: 'Thermal Simulation Worker',
            kernel: { name: 'python3' }
        });
        const kernel = session.kernel;
        if (!kernel)
            throw new Error("无法启动 Python3 Kernel");
        const pyCode = `
import json
try:
    from thermal_solver import run_simulation
except ImportError:
    print("\\n===THERMAL_OUTPUT_START===")
    print(json.dumps({"status": "error", "error_message": "未找到 thermal_solver 求解模块，请先在当前环境执行 pip install -e ./thermal_solver"}))
    print("===THERMAL_OUTPUT_END===\\n")
else:
    run_simulation('${scenarioId}', ${JSON.stringify(params)})
`;
        return new Promise((resolve, reject) => {
            const future = kernel.requestExecute({ code: pyCode, stop_on_error: true });
            let outputJson = "";
            let isBuffering = false;
            future.onIOPub = (msg) => {
                if (msg.header.msg_type === 'stream') {
                    const text = msg.content.text;
                    if (text.includes('===THERMAL_OUTPUT_START===')) {
                        isBuffering = true;
                        const parts = text.split('===THERMAL_OUTPUT_START===');
                        if (parts.length > 1) {
                            let inner = parts[1];
                            if (inner.includes('===THERMAL_OUTPUT_END===')) {
                                isBuffering = false;
                                outputJson += inner.split('===THERMAL_OUTPUT_END===')[0];
                                try {
                                    resolve(JSON.parse(outputJson.trim()));
                                }
                                catch (e) {
                                    reject(e);
                                }
                            }
                            else {
                                outputJson += inner;
                            }
                        }
                    }
                    else if (text.includes('===THERMAL_OUTPUT_END===')) {
                        isBuffering = false;
                        outputJson += text.split('===THERMAL_OUTPUT_END===')[0];
                        try {
                            const data = JSON.parse(outputJson.trim());
                            resolve(data);
                        }
                        catch (e) {
                            reject(new Error("求解器结果 JSON 解析失败"));
                        }
                    }
                    else if (isBuffering) {
                        outputJson += text;
                    }
                }
                else if (msg.header.msg_type === 'error') {
                    reject(new Error(msg.content.evalue || msg.content.ename));
                }
            };
            future.done.then(() => {
                session.shutdown(); // 阅后即焚
            }).catch(() => {
                session.shutdown();
            });
        });
    }
    catch (err) {
        showDialog({ title: 'Kernel 调用失败', body: err.message });
        throw err;
    }
}
//# sourceMappingURL=KernelOperations.js.map