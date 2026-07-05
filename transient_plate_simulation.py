# -*- coding: utf-8 -*-
"""
一维瞬态导热两侧恒温平板 仿真程序
============================================================
遵循 SimLab 五层结构化代码组织规范：
1. 参数层 (Parameter Layer)
2. 模型层 (Model Layer)
3. 求解层 (Solver Layer)
4. 可视化层 (Visualization Layer)
5. 分析层 (Analysis Layer)
"""

# ============================================================
# 【第一层：参数层 (Parameter Layer)】
# 定义物理常量、边界条件以及离散步长参数
# ============================================================
L = 0.1             # 平板厚度 (m)
alpha = 1e-5        # 材料热扩散率 (m²/s)
T_init = 20.0       # 初始温度 (°C)
T_s = 200.0         # 两侧壁面恒定温度 (°C)
time_total = 60.0   # 仿真总物理时间 (s)
N = 50              # 空间网格节点数
n_snapshots = 5     # 绘图时间快照数量

# ============================================================
# 【第二层：模型层 (Model Layer)】
# 导入科学计算库，并构建离散网格与物理模型方程
# ============================================================
import numpy as np
import matplotlib.pyplot as plt

# 空间网格离散
dx = L / (N - 1)
x = np.linspace(0, L, N)

# 显式步长自适应计算及稳定性校核 (Fo <= 0.5)
Fo_target = 0.4     # 目标网格傅里叶数，留有安全裕度
dt = Fo_target * dx**2 / alpha
n_steps = int(np.ceil(time_total / dt))
dt = time_total / n_steps  # 精确分配时间步长
Fo = alpha * dt / dx**2   # 实际运行的网格傅里叶数

# 定义显式有限差分格式 (FTCS) 控制方程
def explicit_ftcs_equation(T_prev, i, Fo_num):
    """
    一维瞬态热传导控制方程的 FTCS 离散代数形式：
    T_i^{n+1} = T_i^n + Fo * (T_{i-1}^n - 2 * T_i^n + T_{i+1}^n)
    """
    return T_prev[i] + Fo_num * (T_prev[i-1] - 2.0 * T_prev[i] + T_prev[i+1])

# ============================================================
# 【第三层：求解层 (Solver Layer)】
# 执行时间迭代，计算板内温度分布并记录快照
# ============================================================
# 初始化温度场
T = np.full(N, T_init, dtype=float)
T[0] = T_s    # 左侧壁面温度边界
T[-1] = T_s   # 右侧壁面温度边界

# 确定需要输出快照的时间步索引
snap_indices = [int(round(i * n_steps / n_snapshots)) for i in range(1, n_snapshots + 1)]
snapshots = []

# 开始时间步迭代求解
for step in range(1, n_steps + 1):
    T_new = T.copy()
    
    # 遍历内部节点应用控制方程进行计算
    for i in range(1, N - 1):
        T_new[i] = explicit_ftcs_equation(T, i, Fo)
        
    T = T_new
    
    # 记录指定时刻的温度快照
    if step in snap_indices:
        t_current = step * dt
        snapshots.append((round(t_current, 4), T.copy()))

# 计算解析解以进行精度验证（采用傅里叶级数级数法）
Fo_global = alpha * time_total / L**2
theta_i = T_init - T_s
T_analytical = np.full(N, T_s, dtype=np.float64)
for k in range(1, 401, 2):  # 累加前 200 项奇数项
    coeff = (4.0 / (k * np.pi)) * np.exp(-(k * np.pi)**2 * Fo_global)
    T_analytical += theta_i * coeff * np.sin(k * np.pi * x / L)

# ============================================================
# 【第四层：可视化层 (Visualization Layer)】
# 绘制瞬态温度分布曲线与解析解对比
# ============================================================
plt.figure(figsize=(10, 6))

# 绘制初始时刻和各快照时刻的温度场
plt.plot(x * 1000, np.full(N, T_init), 'k--', label='t = 0 s (初始温度)')
for t_snap, T_snap in snapshots:
    plt.plot(x * 1000, T_snap, '-o', markersize=2, label=f't = {t_snap:.1f} s')

# 绘制最终时刻的解析解对比
plt.plot(x * 1000, T_analytical, 'r--', linewidth=2, label='t = 最终时刻 (解析解)')

plt.xlabel('位置 x (mm)')
plt.ylabel('温度 T (°C)')
plt.title('一维平板两侧恒温瞬态导热演化过程')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()

# ============================================================
# 【第五层：分析层 (Analysis Layer)】
# 输出关键物理指标并对结果进行合理性分析
# ============================================================
max_error = np.max(np.abs(T - T_analytical))
T_center = T[N // 2]

print("=" * 60)
print("                    仿真结果分析与指标")
print("=" * 60)
print(f"1. 空间节点数 N            = {N}")
print(f"2. 实际网格 Fourier 数 Fo  = {Fo:.4f}  (稳定性阈值 <= 0.5)")
print(f"3. 时间步长 dt            = {dt:.6f} s (总推进步数 = {n_steps})")
print(f"4. 最终平板中心节点温度    = {T_center:.2f} °C")
print(f"5. 数值解与解析解最大相对误差 = {max_error:.4e} °C")
print("-" * 60)
print("物理规律总结提示：")
print("- 平板在遭受两侧对称等温加热后，温度热波向中心逐步传递。")
print("- 随着时间推移，整块平板温度最终会达到壁面恒温 T_s = 200°C 的热平衡状态。")
print("- 显式 FTCS 格式的时间步长 dt 必须受到稳定性判据限制，即 Fo <= 0.5。")
print("=" * 60)
