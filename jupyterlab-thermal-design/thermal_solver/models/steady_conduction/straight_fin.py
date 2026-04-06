"""
一维稳态导热 —— 等截面直肋导热（肋片效率计算）
============================================================
数值方法：有限体积法 (Finite Volume Method, FVM)

物理模型
--------
一根等截面矩形直肋（长度 L_f，宽度 w，厚度 t），
肋根温度为 T_b，肋尖绝热。肋片周围为温度 T_∞ 的流体，
对流换热系数为 h。

        T_b (基板)
         ┃
         ┃  ← 肋根 (x=0)
    ┌────┃────┐
    │    ┃    │  ↕ t (厚度)
    │    ┃    │  ↕
    │    ┃    │  → h, T_∞ (周围流体)
    │    ┃    │
    └────┃────┘
         ┃  ← 肋尖 (x=L_f, 绝热)
         ┃
    ←───── w ─────→

控制方程（肋片方程）
--------------------
    d²T/dx² - m²·(T - T_∞) = 0

    其中 m² = h·P / (k·A_c)
         P  = 2·(w + t)      周长
         A_c = w · t          横截面积

    令 θ = T - T_∞（过余温度），方程化为：
        d²θ/dx² - m²·θ = 0

边界条件
--------
    θ(0)   = T_b - T_∞ = θ_b      (肋根温度)
    dθ/dx|_{x=L_f} = 0             (肋尖绝热)

解析解
------
    θ(x) = θ_b · cosh[m·(L_f - x)] / cosh(m·L_f)
    T(x) = T_∞ + θ(x)

    肋片实际散热量：Q_fin = √(h·P·k·A_c) · θ_b · tanh(m·L_f)
    肋片最大散热量：Q_max = h · P · L_f · θ_b
    肋片效率：       η = tanh(m·L_f) / (m·L_f)

FVM 离散过程（含源项的有限体积法）
----------------------------------
将肋片 [0, L_f] 沿轴向划分为 N 个控制体积，CV 宽度 Δx = L_f/N。

对每个 CV 做能量守恒：

    [导入热量] - [导出热量] - [对流散热] = 0

    k·A_c·(T_W - T_P)/Δx_w  -  k·A_c·(T_P - T_E)/Δx_e  -  h·P·Δx·(T_P - T_∞) = 0

整理为标准形式：
    a_W·T_W + a_E·T_E - a_P·T_P = -S_u

    a_W = k·A_c / Δx_w
    a_E = k·A_c / Δx_e
    S_u = h·P·Δx·T_∞                        (源项常数部分)
    S_p = h·P·Δx                             (源项系数部分)
    a_P = a_W + a_E + S_p

肋根边界 (i=0)  : T_P = T_b  → 直接赋值
肋尖边界 (i=N-1): 绝热 → a_E = 0，只有 a_W 和 S_p 项
"""

import numpy as np


def solve_straight_fin(params: dict) -> dict:
    """
    等截面直肋稳态导热 · 有限体积法 (FVM) 求解

    Parameters (通过 params 字典传入)
    ----------
    fin_length           : 肋片长度 L_f (m), 默认 0.05
    fin_thickness        : 肋片厚度 t (m), 默认 0.002
    fin_width            : 肋片宽度 w (m), 默认 0.10
    thermal_conductivity : 导热系数 k (W/(m·K)), 默认 200
    h_conv               : 对流换热系数 h (W/(m²·K)), 默认 25
    temp_base            : 肋根温度 T_b (°C), 默认 100
    temp_ambient         : 环境温度 T_∞ (°C), 默认 25
    n_nodes              : 网格节点数 (可选), 默认 50

    Returns
    -------
    dict : 包含 indicators 和 chart_data
    """
    # ---------- 读取参数 ----------
    L_f  = float(params.get('fin_length', 0.05))
    t    = float(params.get('fin_thickness', 0.002))
    w    = float(params.get('fin_width', 0.10))
    k    = float(params.get('thermal_conductivity', 200))
    h    = float(params.get('h_conv', 25))
    T_b  = float(params.get('temp_base', 100))
    T_inf = float(params.get('temp_ambient', 25))
    N    = int(params.get('n_nodes', 50))

    # 几何参数
    P    = 2.0 * (w + t)     # 周长 (m)
    A_c  = w * t             # 横截面积 (m²)
    m    = np.sqrt(h * P / (k * A_c))  # 肋片参数 (1/m)
    dx   = L_f / N

    # 节点坐标（CV 中心）
    x_nodes = np.array([(i + 0.5) * dx for i in range(N)])

    # ========================================================
    # 第一步：组装 FVM 系数矩阵（含源项）
    # ========================================================
    A_mat = np.zeros((N, N))
    b_vec = np.zeros(N)

    for i in range(N):
        S_p = h * P * dx   # 源项系数（对流散热）
        S_u = h * P * dx * T_inf   # 源项常数

        if i == 0:
            # ---- 肋根节点 ----
            # 左侧界面：边界 T_b，距离 = dx/2
            # 右侧界面：到下一节点，距离 = dx
            a_W_boundary = k * A_c / (dx / 2.0)
            a_E = k * A_c / dx
            a_P = a_W_boundary + a_E + S_p
            A_mat[i, i] = a_P
            A_mat[i, i + 1] = -a_E
            b_vec[i] = S_u + a_W_boundary * T_b  # 已知肋根温度

        elif i == N - 1:
            # ---- 肋尖节点（绝热） ----
            # 右侧界面：dT/dx = 0 → a_E = 0
            # 左侧界面：到上一节点，距离 = dx
            a_W = k * A_c / dx
            a_E = 0.0
            a_P = a_W + a_E + S_p
            A_mat[i, i] = a_P
            A_mat[i, i - 1] = -a_W
            b_vec[i] = S_u

        else:
            # ---- 内部节点 ----
            a_W = k * A_c / dx
            a_E = k * A_c / dx
            a_P = a_W + a_E + S_p
            A_mat[i, i] = a_P
            A_mat[i, i - 1] = -a_W
            A_mat[i, i + 1] = -a_E
            b_vec[i] = S_u

    # ========================================================
    # 第二步：求解线性方程组
    # ========================================================
    T_numerical = np.linalg.solve(A_mat, b_vec)

    # ========================================================
    # 第三步：计算解析解
    # ========================================================
    theta_b = T_b - T_inf
    T_analytical = T_inf + theta_b * np.cosh(m * (L_f - x_nodes)) / np.cosh(m * L_f)

    # ========================================================
    # 第四步：计算肋片效率与工程物理量
    # ========================================================
    # 解析肋片效率
    mL = m * L_f
    eta_analytical = np.tanh(mL) / mL if mL > 1e-10 else 1.0

    # 解析散热量
    Q_fin_analytical = np.sqrt(h * P * k * A_c) * theta_b * np.tanh(mL)

    # 数值散热量（对所有 CV 的对流散热求和）
    Q_fin_numerical = float(np.sum(h * P * dx * (T_numerical - T_inf)))

    # 数值肋片效率
    Q_max = h * P * L_f * theta_b
    eta_numerical = Q_fin_numerical / Q_max if Q_max > 1e-10 else 1.0

    max_error = float(np.max(np.abs(T_numerical - T_analytical)))

    # ---------- 返回标准格式 ----------
    return {
        "indicators": {
            "肋片效率 η (数值)": round(float(eta_numerical), 4),
            "肋片效率 η (解析)": round(float(eta_analytical), 4),
            "肋片散热量 Q_fin (W, 数值)": round(float(Q_fin_numerical), 4),
            "肋片散热量 Q_fin (W, 解析)": round(float(Q_fin_analytical), 4),
            "肋片参数 m (1/m)": round(float(m), 4),
            "mL 值": round(float(mL), 4),
            "数值方法": "有限体积法 (FVM, 含源项)",
            "网格节点数": N,
            "数值解与解析解最大误差 (°C)": f"{max_error:.2e}",
        },
        "chart_data": {
            "x": x_nodes.tolist(),
            "y": T_numerical.tolist(),
            "x_label": "沿肋片方向 x (m)",
            "y_label": "温度 T (°C)",
            "title": "等截面直肋温度分布 (FVM)",
        },
    }
