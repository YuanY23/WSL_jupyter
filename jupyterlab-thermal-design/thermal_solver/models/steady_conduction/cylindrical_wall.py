"""
一维稳态导热 —— 圆筒壁径向导热
============================================================
数值方法：有限差分法 (Finite Difference Method, FDM)

物理模型
--------
一个内半径 r_i、外半径 r_o 的无限长圆筒壁，导热系数 k 为常数。
内壁温度 T_i，外壁温度 T_o（第一类边界条件）。

         ╭───────╮
        ╱  T_o    ╲
       │ ╭─────╮   │
       │ │ T_i │   │  k = const
       │ ╰─────╯   │
        ╲  r_i  r_o╱
         ╰───────╯

控制方程（柱坐标、仅径向导热、稳态、无内热源）
----------------------------------------------
    1/r · d/dr(r · dT/dr) = 0       (r_i < r < r_o)

展开形式：
    d²T/dr² + (1/r) · dT/dr = 0

边界条件：
    T(r_i) = T_i
    T(r_o) = T_o

解析解
------
    T(r) = T_i + (T_o - T_i) · ln(r/r_i) / ln(r_o/r_i)
    q_r  = k · (T_i - T_o) / (r · ln(r_o/r_i))     (径向热流密度, W/m²)
    Q    = 2π·k·L_cyl·(T_i - T_o) / ln(r_o/r_i)    (单位长度热流, W/m)
    R    = ln(r_o/r_i) / (2π·k)                      (单位长度热阻, K·m/W)

FDM 离散过程（柱坐标特殊处理）
------------------------------
将 [r_i, r_o] 均匀划分为 N-1 段，节点间距 Δr = (r_o - r_i)/(N-1)。

对展开形式用中心差分：

    d²T/dr²  ≈ (T_{i-1} - 2T_i + T_{i+1}) / Δr²
    dT/dr    ≈ (T_{i+1} - T_{i-1}) / (2Δr)

代入控制方程并乘以 Δr²：

    (T_{i-1} - 2T_i + T_{i+1}) + (Δr/(2r_i)) · (T_{i+1} - T_{i-1}) = 0

整理系数：
    a_W = 1 - Δr/(2r_i)
    a_P = -2
    a_E = 1 + Δr/(2r_i)

注意：与平板导热不同，此处系数不再对称，反映了柱坐标的几何效应。
外侧面积大于内侧，导致 a_E > a_W。
"""

import numpy as np


def solve_cylindrical_wall(params: dict) -> dict:
    """
    圆筒壁径向稳态导热 · 有限差分法 (FDM) 求解

    Parameters (通过 params 字典传入)
    ----------
    r_inner              : 内半径 (m), 默认 0.05
    r_outer              : 外半径 (m), 默认 0.10
    thermal_conductivity : 导热系数 k (W/(m·K)), 默认 50
    temp_inner           : 内壁温度 T_i (°C), 默认 200
    temp_outer           : 外壁温度 T_o (°C), 默认 50
    n_nodes              : 网格节点数 (可选), 默认 50

    Returns
    -------
    dict : 包含 indicators 和 chart_data
    """
    # ---------- 读取参数 ----------
    r_i = float(params.get('r_inner', 0.05))
    r_o = float(params.get('r_outer', 0.10))
    k   = float(params.get('thermal_conductivity', 50))
    T_i = float(params.get('temp_inner', 200))
    T_o = float(params.get('temp_outer', 50))
    n   = int(params.get('n_nodes', 50))

    dr = (r_o - r_i) / (n - 1)
    r  = np.linspace(r_i, r_o, n)

    # ========================================================
    # 第一步：组装系数矩阵（柱坐标三对角）
    # ========================================================
    A = np.zeros((n, n))
    b = np.zeros(n)

    # 边界节点
    A[0, 0]   = 1.0
    b[0]      = T_i

    A[-1, -1] = 1.0
    b[-1]     = T_o

    # 内部节点 —— 柱坐标修正差分
    for j in range(1, n - 1):
        r_j = r[j]
        # a_W = 1 - Δr/(2r_j);   a_P = -2;   a_E = 1 + Δr/(2r_j)
        coeff = dr / (2.0 * r_j)
        A[j, j - 1] = 1.0 - coeff    # 西侧（内侧）
        A[j, j]     = -2.0           # 中心
        A[j, j + 1] = 1.0 + coeff    # 东侧（外侧）
        b[j]        = 0.0

    # ========================================================
    # 第二步：求解
    # ========================================================
    T_numerical = np.linalg.solve(A, b)

    # ========================================================
    # 第三步：计算解析解
    # ========================================================
    ln_ratio = np.log(r_o / r_i)
    T_analytical = T_i + (T_o - T_i) * np.log(r / r_i) / ln_ratio

    # ========================================================
    # 第四步：计算工程物理量
    # ========================================================
    Q_per_length = 2.0 * np.pi * k * (T_i - T_o) / ln_ratio   # 单位长度热流 (W/m)
    R_per_length = ln_ratio / (2.0 * np.pi * k)                # 单位长度热阻 (K·m/W)
    max_error = float(np.max(np.abs(T_numerical - T_analytical)))

    # ---------- 返回标准格式 ----------
    return {
        "indicators": {
            "单位长度径向热流 Q (W/m)": round(float(Q_per_length), 4),
            "单位长度热阻 R (K·m/W)": round(float(R_per_length), 6),
            "内壁半径 r_i (m)": r_i,
            "外壁半径 r_o (m)": r_o,
            "数值方法": "有限差分法 (FDM, 柱坐标)",
            "网格节点数": n,
            "数值解与解析解最大误差 (°C)": f"{max_error:.2e}",
        },
        "chart_data": {
            "x": r.tolist(),
            "y": T_numerical.tolist(),
            "x_label": "径向位置 r (m)",
            "y_label": "温度 T (°C)",
            "title": "圆筒壁径向稳态导热温度分布 (FDM)",
        },
    }
