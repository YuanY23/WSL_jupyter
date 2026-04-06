"""
对流换热原理仿真 —— 平板层流强制对流 (Re < 5×10⁵)
============================================================
分析方法：经验关联式 + 边界层理论数值积分

物理模型
--------
温度 T_∞ 的均匀来流以速度 U_∞ 沿水平等温平板流动。
平板壁面温度 T_w，平板长度 L。
来流条件维持层流状态（Re_L < 5×10⁵）。

         U_∞, T_∞  →→→→→→→→→→→→
    ╔═══════════════════════════╗
    ║     T_w = const           ║  平板
    ╚═══════════════════════════╝
    x=0                         x=L

基本参数
--------
    Re_x = U_∞ · x / ν           局部 Reynolds 数
    Re_L = U_∞ · L / ν           全长 Reynolds 数
    Pr   = ν / α = μ·cp / k      Prandtl 数

层流经验关联式
--------------
1. **局部 Nusselt 数**（Blasius 解 / Pohlhausen 解）：
       Nu_x = 0.332 · Re_x^{1/2} · Pr^{1/3}        (Pr ≥ 0.6)

2. **平均 Nusselt 数**（对全板长积分）：
       Nu_L = 0.664 · Re_L^{1/2} · Pr^{1/3}

3. **局部 / 平均换热系数**：
       h_x = Nu_x · k_f / x
       h_avg = Nu_L · k_f / L

4. **边界层厚度**：
       δ(x) = 5.0 · x / Re_x^{1/2}                  (速度边界层)
       δ_t(x) = δ(x) / Pr^{1/3}                      (热边界层)

本求解器的教学目标
------------------
- 展示如何使用经验关联式计算对流换热系数
- 沿平板方向绘制 h_x、Nu_x、δ(x) 的变化曲线
- 理解 Re 和 Pr 对换热的影响
- 对比局部值与平均值的关系（h_avg = 2·h_x|_{x=L}）
"""

import numpy as np


def solve_flat_plate_laminar(params: dict) -> dict:
    """
    平板层流强制对流换热 · 经验关联式求解

    Parameters (通过 params 字典传入)
    ----------
    plate_length     : 平板长度 L (m), 默认 0.5
    velocity         : 来流速度 U_∞ (m/s), 默认 2.0
    temp_wall        : 壁面温度 T_w (°C), 默认 60
    temp_fluid       : 来流温度 T_∞ (°C), 默认 20
    fluid_k          : 流体导热系数 k_f (W/(m·K)), 默认 0.026 (空气)
    fluid_nu         : 流体运动粘度 ν (m²/s), 默认 1.6e-5 (空气 ~25°C)
    fluid_Pr         : Prandtl 数, 默认 0.71 (空气)
    n_points         : 沿板长计算点数, 默认 100

    Returns
    -------
    dict : 包含 indicators 和 chart_data
    """
    # ---------- 读取参数 ----------
    L     = float(params.get('plate_length', 0.5))
    U_inf = float(params.get('velocity', 2.0))
    T_w   = float(params.get('temp_wall', 60))
    T_inf = float(params.get('temp_fluid', 20))
    k_f   = float(params.get('fluid_k', 0.026))
    nu    = float(params.get('fluid_nu', 1.6e-5))
    Pr    = float(params.get('fluid_Pr', 0.71))
    n_pts = int(params.get('n_points', 100))

    # ========================================================
    # 第一步：计算全长参数
    # ========================================================
    Re_L = U_inf * L / nu

    # 检查层流条件
    if Re_L > 5e5:
        return {
            "indicators": {
                "错误": f"Re_L = {Re_L:.0f} > 5×10⁵，不满足层流条件，请使用湍流模型。"
            },
            "chart_data": {"x": [], "y": [], "title": "层流条件不满足"},
        }

    Nu_L  = 0.664 * Re_L**0.5 * Pr**(1.0 / 3.0)
    h_avg = Nu_L * k_f / L
    Q_total = h_avg * L * (T_w - T_inf)  # 单位宽度总换热量 (W/m)

    # ========================================================
    # 第二步：沿板长计算局部参数分布
    # ========================================================
    # 避免 x=0 的奇异点
    x = np.linspace(L / n_pts, L, n_pts)

    Re_x  = U_inf * x / nu
    Nu_x  = 0.332 * Re_x**0.5 * Pr**(1.0 / 3.0)
    h_x   = Nu_x * k_f / x
    delta = 5.0 * x / Re_x**0.5                 # 速度边界层厚度
    delta_t = delta / Pr**(1.0 / 3.0)           # 热边界层厚度

    # ========================================================
    # 第三步：验证关系 h_avg = 2 · h_x(x=L)
    # ========================================================
    h_at_L = float(h_x[-1])
    ratio  = h_avg / h_at_L  # 理论应为 2.0

    # ---------- 返回标准格式 ----------
    return {
        "indicators": {
            "全长 Re_L": round(Re_L, 0),
            "Prandtl 数 Pr": Pr,
            "平均 Nusselt 数 Nu_L": round(Nu_L, 2),
            "平均换热系数 h_avg (W/(m²·K))": round(h_avg, 4),
            "末端局部 h_x(L) (W/(m²·K))": round(h_at_L, 4),
            "h_avg / h_x(L) (理论=2)": round(ratio, 4),
            "单位宽度总换热量 Q (W/m)": round(Q_total, 4),
            "末端速度边界层厚度 δ(L) (mm)": round(float(delta[-1]) * 1000, 2),
            "末端热边界层厚度 δ_t(L) (mm)": round(float(delta_t[-1]) * 1000, 2),
            "关联式": "Nu_x = 0.332·Re_x^{1/2}·Pr^{1/3}",
        },
        "chart_data": {
            "x": x.tolist(),
            "y": h_x.tolist(),
            "x_label": "沿板长位置 x (m)",
            "y_label": "局部换热系数 h_x (W/(m²·K))",
            "title": "平板层流强制对流 · 局部换热系数分布",
        },
    }
