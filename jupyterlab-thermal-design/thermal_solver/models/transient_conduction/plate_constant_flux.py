"""
一维瞬态导热 —— 无限大平板一侧突然施加恒定热流
============================================================
数值方法：有限体积法 · 隐式格式 (Implicit FVM / Fully Implicit)

物理模型
--------
一块厚度为 L 的无限大平板，初始均匀温度 T_init。
在 t=0 时刻：
  - 左侧 (x=0) 突然施加恒定热流密度 q_s (W/m²)（第二类边界条件）
  - 右侧 (x=L) 绝热（对称条件或自然边界）

    q_s → ┃                    ┃ 绝热
          ┃   初始 T_init      ┃ (dT/dx=0)
          ┃   k, ρ, c = const ┃
      x=0 ┃                    ┃ x=L

控制方程
--------
    ∂T/∂t = α · ∂²T/∂x²

边界条件：
    -k · ∂T/∂x|_{x=0} = q_s       (恒定热流)
    ∂T/∂x|_{x=L} = 0               (绝热)

为什么选择隐式格式？
--------------------
第一个场景使用了显式格式（FTCS），受 Fo ≤ 0.5 的稳定性限制。
本场景使用 **全隐式格式**（Fully Implicit），具有以下教学意义：

1. **无条件稳定**：无论时间步长多大都不会发散
2. **对第二类边界条件的处理**：展示热流边界如何进入右端项
3. **与显式格式对比**：精度为一阶（时间），但大步长下仍稳定

FVM 隐式离散过程
-----------------
将平板分为 N 个控制体积，节点在 CV 中心。

对每个 CV 做能量守恒（非稳态）：

    ρ·c·ΔV·(T_P^{n+1} - T_P^n)/Δt = q_w·A - q_e·A

    其中界面热流 q 采用 **新时刻** 的温度值（隐式）。

整理得：
    a_P·T_P^{n+1} = a_W·T_W^{n+1} + a_E·T_E^{n+1} + a_P^0·T_P^n + S_u

    a_W = k/Δx_w
    a_E = k/Δx_e
    a_P^0 = ρ·c·Δx/Δt              (非稳态项系数)
    a_P = a_W + a_E + a_P^0

左边界 (热流 q_s)：
    q_s 进入源项 S_u，无西侧邻居 → a_W = 0

右边界 (绝热)：
    dT/dx = 0 → 无东侧热流 → a_E = 0

组装 [A]{T}^{n+1} = {b} 并在每个时间步求解。
"""

import numpy as np


def solve_plate_constant_flux(params: dict) -> dict:
    """
    无限大平板一侧恒定热流 · 隐式有限体积法求解

    Parameters (通过 params 字典传入)
    ----------
    thickness        : 平板厚度 L (m), 默认 0.1
    thermal_conductivity : 导热系数 k (W/(m·K)), 默认 50
    density          : 密度 ρ (kg/m³), 默认 7800 (钢)
    specific_heat    : 比热 c (J/(kg·K)), 默认 500
    heat_flux        : 左侧热流密度 q_s (W/m²), 默认 5000
    temp_init        : 初始温度 T_init (°C), 默认 20
    time             : 仿真总时间 (s), 默认 120
    n_nodes          : 空间节点数 (可选), 默认 50
    n_time_steps     : 时间步数 (可选), 默认 200

    Returns
    -------
    dict : 包含 indicators 和 chart_data
    """
    # ---------- 读取参数 ----------
    L     = float(params.get('thickness', 0.1))
    k     = float(params.get('thermal_conductivity', 50))
    rho   = float(params.get('density', 7800))
    cp    = float(params.get('specific_heat', 500))
    q_s   = float(params.get('heat_flux', 5000))
    T_init = float(params.get('temp_init', 20))
    time_total = float(params.get('time', 120))
    N     = int(params.get('n_nodes', 50))
    n_steps = int(params.get('n_time_steps', 200))

    alpha = k / (rho * cp)
    dx    = L / N
    dt    = time_total / n_steps
    Fo    = alpha * dt / dx**2  # 网格傅里叶数（隐式法不受限制）

    # 节点坐标（CV 中心）
    x_nodes = np.array([(i + 0.5) * dx for i in range(N)])

    # ========================================================
    # 第一步：组装隐式 FVM 系数矩阵
    # ========================================================
    # 系数矩阵在每个时间步相同，只需组装一次
    A = np.zeros((N, N))
    a_P0 = rho * cp * dx / dt    # 非稳态项 (ρcΔx/Δt)

    for i in range(N):
        if i == 0:
            # ---- 左边界：施加热流 q_s ----
            # 西侧面是边界面 → 无 a_W 邻居
            # 东侧面 → a_E = k/dx
            a_E = k / dx
            a_W = 0.0
            # a_P = a_E + a_P0 (热流边界没有 a_W)
            A[i, i]     = a_E + a_P0
            A[i, i + 1] = -a_E

        elif i == N - 1:
            # ---- 右边界：绝热 ----
            # 东侧面 dT/dx=0 → a_E = 0
            a_W = k / dx
            a_E = 0.0
            A[i, i]     = a_W + a_P0
            A[i, i - 1] = -a_W

        else:
            # ---- 内部节点 ----
            a_W = k / dx
            a_E = k / dx
            A[i, i]     = a_W + a_E + a_P0
            A[i, i - 1] = -a_W
            A[i, i + 1] = -a_E

    # ========================================================
    # 第二步：时间推进（隐式，每步解线性方程组）
    # ========================================================
    T = np.full(N, T_init)
    snapshots = []
    n_snap = 5
    snap_indices = set(int(round(i * n_steps / n_snap)) for i in range(1, n_snap + 1))

    for step in range(1, n_steps + 1):
        # 构建右端项 b
        b = a_P0 * T.copy()    # 旧时刻贡献

        # 左边界热流源项：q_s 进入第一个节点的 b
        b[0] += q_s  # q_s * A，此处单位面积 A=1

        # 求解
        T = np.linalg.solve(A, b)

        if step in snap_indices:
            t_current = step * dt
            snapshots.append((round(t_current, 4), T.copy()))

    # ========================================================
    # 第三步：解析解（半无限大体近似 + 精确级数解）
    # ========================================================
    # 对于绝热右边界 + 左侧恒热流，长时间后温度线性上升。
    # 短时近似（半无限大体）: T(x,t) - T_init = (2q_s/k)√(αt/π) exp(-x²/(4αt)) - (q_s·x/k) erfc(x/(2√(αt)))
    # 这里用长时间稳态升温速率做补充分析
    from math import erfc as _erfc_scalar, exp as _exp_scalar, sqrt as _sqrt_scalar, pi as _pi

    t = time_total
    T_analytical = np.full(N, T_init, dtype=np.float64)
    sqrt_at = np.sqrt(alpha * t)
    for idx in range(N):
        xi = x_nodes[idx]
        eta = xi / (2.0 * sqrt_at) if sqrt_at > 1e-15 else 1e10
        T_analytical[idx] = T_init + (q_s / k) * (
            2.0 * sqrt_at * _exp_scalar(-eta**2) / _sqrt_scalar(_pi)
            - xi * _erfc_scalar(eta)
        )

    # 注意：此解析解为半无限大体近似，当热波到达右壁后误差增大
    # 判断热波是否到达右壁
    penetration_depth = 3.6 * np.sqrt(alpha * time_total)  # ~99% 穿透深度
    wave_reached = penetration_depth >= L

    max_error = float(np.max(np.abs(T - T_analytical)))

    # ========================================================
    # 第四步：计算工程物理量
    # ========================================================
    T_left  = float(T[0])
    T_right = float(T[-1])
    T_avg   = float(np.mean(T))
    # 能量守恒验证：输入能量 = ρcΔT_avg * L
    Q_input = q_s * time_total  # 总输入能量密度 (J/m²)
    Q_stored = rho * cp * L * (T_avg - T_init)
    energy_balance_error = abs(Q_input - Q_stored) / Q_input * 100 if Q_input > 0 else 0

    # ---------- 返回标准格式 ----------
    return {
        "indicators": {
            "热面温度 T_left (°C)": round(T_left, 2),
            "绝热面温度 T_right (°C)": round(T_right, 2),
            "平均温度 T_avg (°C)": round(T_avg, 2),
            "总模拟时间 (s)": time_total,
            "网格 Fourier 数 Fo": round(Fo, 4),
            "Fo > 0.5 (隐式无条件稳定)": "是" if Fo > 0.5 else "否",
            "热穿透深度 (m)": round(penetration_depth, 4),
            "热波是否到达右壁": "是" if wave_reached else "否",
            "能量守恒误差 (%)": round(energy_balance_error, 4),
            "数值方法": "隐式有限体积法 (Fully Implicit FVM)",
        },
        "chart_data": {
            "x": x_nodes.tolist(),
            "y": T.tolist(),
            "x_label": "位置 x (m)",
            "y_label": "温度 T (°C)",
            "title": f"一侧恒定热流加热 · 温度分布 (t={time_total}s)",
        },
    }
