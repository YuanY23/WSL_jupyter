"""
对流换热原理仿真 —— 竖板自然对流
============================================================
分析方法：经验关联式 (Churchill-Chu 关联式)

物理模型
--------
一块高度为 H 的垂直等温平板，壁面温度 T_w，
置于温度 T_∞ 的静止流体中。
由温差引起的浮力驱动自然对流换热。

    ↑ ↑      │
    ↑ ↑      │ T_w
    ↑ ↑      │
    ↑ ↑      │ H (板高)
    ↑ 热     │
    ↑ 流     │
    ↑ 体     │
             │
    T_∞ (环境)

关键无量纲数
------------
    Gr_H  = g·β·(T_w - T_∞)·H³ / ν²     Grashof 数
    Ra_H  = Gr_H · Pr                      Rayleigh 数
    β     = 1 / T_film  (K⁻¹)             体积膨胀系数 (理想气体)
    T_film = (T_w + T_∞) / 2 + 273.15     膜温 (K)

流动判据
--------
    Ra < 10⁹   → 层流自然对流
    Ra > 10⁹   → 湍流自然对流

经验关联式（Churchill-Chu 全域公式）
-------------------------------------
适用范围：所有 Pr，10⁻¹ < Ra < 10¹²

    Nu_H = { 0.825 + 0.387·Ra_H^{1/6} / [1 + (0.492/Pr)^{9/16}]^{8/27} }²

此公式的优点：
1. 覆盖层流和湍流全域
2. 适用于任意 Pr（气体、液体、液态金属）
3. 精度优于分段简化公式

局部参数分布
------------
沿板高 x 方向，用 Ra_x 代替 Ra_H 可得局部值（层流区近似有效）：
    Nu_x 按同一公式形式，将 H 替换为 x

教学要点
--------
- 自然对流的驱动力：浮力 vs 粘性力（Gr 数的物理含义）
- Ra 数综合 Gr 和 Pr 的作用
- 层流 → 湍流转捩 (Ra ≈ 10⁹) 对换热的影响
- Churchill-Chu 全域公式的工程价值
"""

import numpy as np


def solve_vertical_plate_natural(params: dict) -> dict:
    """
    竖板自然对流换热 · Churchill-Chu 关联式

    Parameters (通过 params 字典传入)
    ----------
    plate_height     : 板高 H (m), 默认 0.3
    temp_wall        : 壁面温度 T_w (°C), 默认 80
    temp_ambient     : 环境温度 T_∞ (°C), 默认 20
    fluid_k          : 流体导热系数 k_f (W/(m·K)), 默认 0.028 (空气 ~50°C)
    fluid_nu         : 运动粘度 ν (m²/s), 默认 1.8e-5 (空气 ~50°C)
    fluid_Pr         : Prandtl 数, 默认 0.71
    fluid_beta       : 体积膨胀系数 β (1/K), 默认 0 (=0时自动按理想气体计算)
    n_points         : 计算点数, 默认 100

    Returns
    -------
    dict : 包含 indicators 和 chart_data
    """
    # ---------- 读取参数 ----------
    H     = float(params.get('plate_height', 0.3))
    T_w   = float(params.get('temp_wall', 80))
    T_inf = float(params.get('temp_ambient', 20))
    k_f   = float(params.get('fluid_k', 0.028))
    nu    = float(params.get('fluid_nu', 1.8e-5))
    Pr    = float(params.get('fluid_Pr', 0.71))
    beta  = float(params.get('fluid_beta', 0))
    n_pts = int(params.get('n_points', 100))

    g = 9.81  # 重力加速度 (m/s²)

    # 膜温法：若未指定 β，按理想气体 β = 1/T_film
    T_film_C = (T_w + T_inf) / 2.0
    T_film_K = T_film_C + 273.15
    if beta <= 0:
        beta = 1.0 / T_film_K

    delta_T = T_w - T_inf

    # ========================================================
    # 第一步：计算全板 Gr, Ra, Nu
    # ========================================================
    Gr_H = g * beta * abs(delta_T) * H**3 / nu**2
    Ra_H = Gr_H * Pr

    # Churchill-Chu 全域公式
    f_Pr = (1.0 + (0.492 / Pr)**(9.0 / 16.0))**(8.0 / 27.0)
    Nu_H = (0.825 + 0.387 * Ra_H**(1.0 / 6.0) / f_Pr)**2

    h_avg = Nu_H * k_f / H
    Q_total = h_avg * H * abs(delta_T)  # 单位宽度 (W/m)

    # 流动状态判断
    flow_regime = "层流" if Ra_H < 1e9 else "湍流"

    # ========================================================
    # 第二步：沿板高计算局部参数
    # ========================================================
    x = np.linspace(H / n_pts, H, n_pts)
    Gr_x = g * beta * abs(delta_T) * x**3 / nu**2
    Ra_x = Gr_x * Pr

    Nu_x = (0.825 + 0.387 * Ra_x**(1.0 / 6.0) / f_Pr)**2
    h_x  = Nu_x * k_f / x

    # 边界层厚度估计（层流区，Ostrach 解）
    delta_approx = 3.93 * x * (0.952 + Pr)**0.25 / (Gr_x**0.25 * Pr**0.5)
    # 限制异常值
    delta_approx = np.clip(delta_approx, 0, H)

    # ========================================================
    # 第三步：返回结果
    # ========================================================
    return {
        "indicators": {
            "Grashof 数 Gr_H": f"{Gr_H:.4e}",
            "Rayleigh 数 Ra_H": f"{Ra_H:.4e}",
            "流动状态": flow_regime,
            "平均 Nusselt 数 Nu_H": round(Nu_H, 2),
            "平均换热系数 h_avg (W/(m²·K))": round(h_avg, 4),
            "单位宽度换热量 Q (W/m)": round(Q_total, 4),
            "体积膨胀系数 β (1/K)": f"{beta:.4e}",
            "膜温 T_film (°C)": round(T_film_C, 1),
            "关联式": "Churchill-Chu 全域公式",
        },
        "chart_data": {
            "x": x.tolist(),
            "y": h_x.tolist(),
            "x_label": "沿板高位置 x (m)",
            "y_label": "局部换热系数 h_x (W/(m²·K))",
            "title": f"竖板自然对流 · 局部换热系数分布 ({flow_regime})",
        },
    }
