"""
一维瞬态导热 —— 无限大平板两侧突然施加恒定温度
============================================================
数值方法：有限差分法 · 显式格式 (Explicit FDM / FTCS)

物理模型
--------
一块厚度为 L 的无限大平板，初始均匀温度 T_init。
在 t=0 时刻，两侧同时突然施加恒定壁面温度 T_s（对称加热/冷却）。
板内导热系数 k、密度 ρ、比热 c 为常数。

    T_s ┃                    ┃ T_s
        ┃   初始 T_init      ┃
        ┃   k, ρ, c = const ┃
    x=0 ┃                    ┃ x=L

控制方程（一维非稳态傅里叶方程）
-------------------------------
    ∂T/∂t = α · ∂²T/∂x²       (0 < x < L, t > 0)

    其中 α = k/(ρ·c) 为热扩散率 (m²/s)

初始条件：
    T(x, 0) = T_init

边界条件（第一类 / Dirichlet）：
    T(0, t) = T_s
    T(L, t) = T_s

FDM 显式格式（前向时间、中心空间 — FTCS）
------------------------------------------
空间离散：N 个节点，Δx = L/(N-1)
时间步进：Δt 由稳定性条件确定

    T_i^{n+1} = T_i^n + Fo · (T_{i-1}^n - 2·T_i^n + T_{i+1}^n)

    Fo = α·Δt/Δx²  (网格傅里叶数 / Fourier number)

稳定性条件（显式格式必须满足）
------------------------------
    Fo ≤ 0.5

    若用户给定的参数导致 Fo > 0.5，求解器将自动减小 Δt 以满足
    稳定性要求（Fo = 0.4，留有安全裕度）。

过余温度与 Bi / Fo 分析
-----------------------
    θ(x,t) = T(x,t) - T_s
    θ_i    = T_init - T_s

由于两侧对称，可利用对称性只求解半域 [0, L/2]，
但此处为了教学清晰，仍求解全域。

解析解（傅里叶级数）
--------------------
    θ(x,t)/θ_i = Σ_{n=1,3,5,...} (4/nπ)·sin(nπx/L)·exp(-(nπ)²·Fo_global)

    其中 Fo_global = α·t/L²
"""

import numpy as np


def solve_plate_constant_temp(params: dict) -> dict:
    """
    无限大平板两侧突然施加恒定温度 · 显式有限差分法 (FTCS) 求解

    Parameters (通过 params 字典传入)
    ----------
    thickness        : 平板厚度 L (m), 默认 0.1
    alpha            : 热扩散率 α (m²/s), 默认 1e-5
    temp_init        : 初始温度 T_init (°C), 默认 20
    temp_surface     : 壁面温度 T_s (°C), 默认 200
    time             : 仿真总时间 (s), 默认 60
    n_nodes          : 空间节点数 (可选), 默认 50
    n_snapshots      : 输出快照数 (可选), 默认 5

    Returns
    -------
    dict : 包含 indicators 和 chart_data
    """
    # ---------- 读取参数 ----------
    L         = float(params.get('thickness', 0.1))
    alpha     = float(params.get('alpha', 1e-5))
    T_init    = float(params.get('temp_init', 20))
    T_s       = float(params.get('temp_surface', 200))
    time_total = float(params.get('time', 60))
    n         = int(params.get('n_nodes', 50))
    n_snap    = int(params.get('n_snapshots', 5))

    dx = L / (n - 1)
    x  = np.linspace(0, L, n)

    # ========================================================
    # 第一步：确定时间步长（保证稳定性 Fo ≤ 0.5）
    # ========================================================
    Fo_target = 0.4   # 留安全裕度
    dt = Fo_target * dx**2 / alpha
    Fo = alpha * dt / dx**2
    time_steps = int(np.ceil(time_total / dt))
    dt = time_total / time_steps  # 精确分配时间

    # 重新计算实际 Fo
    Fo = alpha * dt / dx**2

    # ========================================================
    # 第二步：确定快照时间点
    # ========================================================
    snap_indices = [int(round(i * time_steps / n_snap)) for i in range(1, n_snap + 1)]
    snap_indices = sorted(set(snap_indices))  # 去重

    # ========================================================
    # 第三步：显式时间推进 (FTCS)
    # ========================================================
    T = np.full(n, T_init)
    T[0]  = T_s   # 左边界
    T[-1] = T_s   # 右边界

    snapshots = []  # [(time, T_array), ...]

    for step in range(1, time_steps + 1):
        T_new = T.copy()
        # 显式格式：内部节点
        for i in range(1, n - 1):
            T_new[i] = T[i] + Fo * (T[i - 1] - 2.0 * T[i] + T[i + 1])
        T = T_new

        if step in snap_indices:
            t_current = step * dt
            snapshots.append((round(t_current, 4), T.copy()))

    # ========================================================
    # 第四步：计算解析解（最终时刻，傅里叶级数取 200 项）
    # ========================================================
    Fo_global = alpha * time_total / L**2
    theta_i = T_init - T_s
    T_analytical = np.full(n, T_s, dtype=np.float64)
    for nn in range(1, 401, 2):  # 奇数项 n=1,3,5,...
        coeff = (4.0 / (nn * np.pi)) * np.exp(-(nn * np.pi)**2 * Fo_global)
        T_analytical += theta_i * coeff * np.sin(nn * np.pi * x / L)

    max_error = float(np.max(np.abs(T[-1] - T_analytical[-1])) if len(T) > 0 else 0)
    # 更准确：比较全场
    max_error = float(np.max(np.abs(T - T_analytical)))

    # ========================================================
    # 第五步：计算工程物理量
    # ========================================================
    T_center = float(T[n // 2])
    Fo_total = alpha * time_total / L**2

    # ---------- 返回标准格式 ----------
    # chart_data 使用最终时刻温度分布
    return {
        "indicators": {
            "中心温度 T_center (°C)": round(T_center, 2),
            "总模拟时间 (s)": time_total,
            "全局 Fourier 数 Fo": round(Fo_total, 4),
            "网格 Fourier 数 Fo_grid": round(Fo, 4),
            "时间步长 Δt (s)": round(dt, 6),
            "总时间步数": time_steps,
            "数值方法": "显式有限差分 (FTCS)",
            "数值解与解析解最大误差 (°C)": f"{max_error:.2e}",
        },
        "chart_data": {
            "x": x.tolist(),
            "y": T.tolist(),
            "x_label": "位置 x (m)",
            "y_label": "温度 T (°C)",
            "title": f"平板两侧恒温加热 · 温度分布 (t={time_total}s)",
        },
    }
