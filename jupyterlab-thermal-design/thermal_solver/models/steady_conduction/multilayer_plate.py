"""
一维稳态导热 —— 多层复合平板导热（热阻串联）
============================================================
数值方法：有限体积法 (Finite Volume Method, FVM)

物理模型
--------
N 层不同材料依次紧密接触组成一块复合平板。
左侧温度 T_h，右侧温度 T_c。各层导热系数不同。
默认示例为三层结构：钢 / 隔热材料 / 铝。

    T_h ┃ 钢 (k₁) ┃ 隔热层 (k₂) ┃ 铝 (k₃) ┃ T_c
        ┃  L₁     ┃    L₂       ┃   L₃    ┃
    x=0                                      x=L_total

热阻串联原理
------------
    q = (T_h - T_c) / R_total
    R_total = L₁/k₁ + L₂/k₂ + L₃/k₃

FVM 离散过程
------------
1. 将每一层均匀离散为若干控制体积 (Control Volume, CV)。
2. 每个 CV 的中心放置一个节点。
3. 对每个 CV 做能量守恒（稳态、无内热源）：

       q_w · A - q_e · A = 0
       即：k_w · (T_W - T_P) / δ_wP - k_e · (T_P - T_E) / δ_PE = 0

   其中 k_w、k_e 为界面处的等效导热系数。

4. **界面调和平均**：当相邻节点导热系数不同 (k_P ≠ k_E) 时，
   界面等效导热系数取调和平均值，以保证热流连续：

       k_e = 2 · k_P · k_E / (k_P + k_E)

   物理含义：两段串联热阻的等效导热系数。

5. 组装线性方程组 [A]{T} = {b}，求解即得温度场。
"""

import numpy as np


def solve_multilayer_plate(params: dict) -> dict:
    """
    多层复合平板稳态导热 · 有限体积法 (FVM) 求解

    Parameters (通过 params 字典传入)
    ----------
    L1, L2, L3         : 各层厚度 (m)
    k1, k2, k3         : 各层导热系数 (W/(m·K))
    temp_left           : 左侧温度 T_h (°C)
    temp_right          : 右侧温度 T_c (°C)
    nodes_per_layer     : 每层节点数 (可选), 默认 20

    Returns
    -------
    dict : 包含 indicators 和 chart_data
    """
    # ---------- 读取参数 ----------
    layers = [
        {"L": float(params.get("L1", 0.01)),  "k": float(params.get("k1", 50))},    # 钢
        {"L": float(params.get("L2", 0.05)),  "k": float(params.get("k2", 0.04))},  # 隔热层
        {"L": float(params.get("L3", 0.01)),  "k": float(params.get("k3", 200))},   # 铝
    ]
    T_h = float(params.get("temp_left", 200))
    T_c = float(params.get("temp_right", 20))
    nodes_per_layer = int(params.get("nodes_per_layer", 20))

    # ========================================================
    # 第一步：生成全局网格与导热系数数组
    # ========================================================
    x_nodes = []      # 节点坐标
    k_nodes = []      # 节点导热系数
    dx_nodes = []     # 节点所属 CV 宽度

    x_offset = 0.0
    for layer in layers:
        L_layer = layer["L"]
        k_layer = layer["k"]
        n = nodes_per_layer
        dx = L_layer / n
        for j in range(n):
            x_center = x_offset + (j + 0.5) * dx
            x_nodes.append(x_center)
            k_nodes.append(k_layer)
            dx_nodes.append(dx)
        x_offset += L_layer

    x_nodes  = np.array(x_nodes)
    k_nodes  = np.array(k_nodes)
    dx_nodes = np.array(dx_nodes)
    N = len(x_nodes)
    L_total = sum(layer["L"] for layer in layers)

    # ========================================================
    # 第二步：组装 FVM 系数矩阵
    # ========================================================
    A = np.zeros((N, N))
    b = np.zeros(N)

    for i in range(N):
        # --- 西侧 (左侧) 界面 ---
        if i == 0:
            # 左边界：半个 CV，左侧面直接是边界 T_h
            d_wP = dx_nodes[i] / 2.0          # 边界面到节点距离
            k_w  = k_nodes[i]                  # 边界侧用本节点导热系数
            a_W  = k_w / d_wP                  # 左侧系数
            b[i] += a_W * T_h                  # 已知温度进入右端项
        else:
            d_wP = (dx_nodes[i - 1] + dx_nodes[i]) / 2.0
            # 调和平均导热系数 —— FVM 核心技巧
            k_w = 2.0 * k_nodes[i - 1] * k_nodes[i] / (k_nodes[i - 1] + k_nodes[i])
            a_W = k_w / d_wP
            A[i, i - 1] = -a_W

        # --- 东侧 (右侧) 界面 ---
        if i == N - 1:
            # 右边界：半个 CV，右侧面直接是边界 T_c
            d_Pe = dx_nodes[i] / 2.0
            k_e  = k_nodes[i]
            a_E  = k_e / d_Pe
            b[i] += a_E * T_c
        else:
            d_Pe = (dx_nodes[i] + dx_nodes[i + 1]) / 2.0
            # 调和平均
            k_e = 2.0 * k_nodes[i] * k_nodes[i + 1] / (k_nodes[i] + k_nodes[i + 1])
            a_E = k_e / d_Pe
            A[i, i + 1] = -a_E

        # --- 中心系数 ---
        A[i, i] = a_W + a_E

    # ========================================================
    # 第三步：求解线性方程组
    # ========================================================
    T_numerical = np.linalg.solve(A, b)

    # ========================================================
    # 第四步：计算解析解（分段线性）与工程量
    # ========================================================
    # 热阻串联解析解
    R_layers = [layer["L"] / layer["k"] for layer in layers]
    R_total  = sum(R_layers)
    q = (T_h - T_c) / R_total  # 热流密度 (W/m²)

    # 解析温度分布：每层内线性，层间连续
    T_analytical = np.zeros(N)
    T_current = T_h
    idx = 0
    for li, layer in enumerate(layers):
        n = nodes_per_layer
        delta_T_layer = q * layer["L"] / layer["k"]
        for j in range(n):
            frac = (j + 0.5) / n
            T_analytical[idx] = T_current - delta_T_layer * frac
            idx += 1
        T_current -= delta_T_layer

    max_error = float(np.max(np.abs(T_numerical - T_analytical)))

    # ---- 层界面位置（用于前端标注） ----
    layer_boundaries = []
    x_acc = 0.0
    for layer in layers:
        x_acc += layer["L"]
        layer_boundaries.append(round(x_acc, 6))

    # ---------- 返回标准格式 ----------
    return {
        "indicators": {
            "热流密度 q (W/m²)": round(float(q), 4),
            "总热阻 R_total (K·m²/W)": round(float(R_total), 6),
            **{f"第{i+1}层热阻 R{i+1} (K·m²/W)": round(r, 6) for i, r in enumerate(R_layers)},
            "数值方法": "有限体积法 (FVM)",
            "总节点数": N,
            "数值解与解析解最大误差 (°C)": f"{max_error:.2e}",
        },
        "chart_data": {
            "x": x_nodes.tolist(),
            "y": T_numerical.tolist(),
            "x_label": "位置 x (m)",
            "y_label": "温度 T (°C)",
            "title": "多层复合平板稳态导热温度分布 (FVM)",
        },
    }
