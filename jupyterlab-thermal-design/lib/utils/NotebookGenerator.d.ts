/**
 * NotebookGenerator.ts
 * ===================================================
 * 为每个仿真场景生成自包含的 .ipynb JSON。
 * 每个 notebook 包含:
 *   1. Markdown: 标题 + 物理模型 + 控制方程
 *   2. Code: 参数定义 (用户可修改)
 *   3. Code: 完整求解算法
 *   4. Code: matplotlib 可视化
 */
export declare function generateNotebook(scenarioId: string, params: Record<string, number>): any;
export declare function getScenarioName(scenarioId: string): string;
