"""
对流换热原理仿真 —— 平板湍流强制对流 (Re > 5×10⁵)
============================================================
分析方法：经验关联式 + 混合边界层理论

物理模型
--------
温度 T_∞ 的均匀来流沿水平等温平板流动。
当 Re_x 超过临界值 Re_cr ≈ 5×10⁵ 时边界层发生层流-湍流转捩。
实际平板前段为层流区，后段为湍流区（混合边界层）。

    U_∞, T_∞  →→→→→→→→→→→→→→→→→→→
    ╔══════════╤══════════════════╗
    ║  层流区   │    湍流区        ║  T_w = const
    ╚══════════╧══════════════════╝
    x=0       x_cr               x=L
              (转捩点)

湍流经验关联式
--------------
1. **纯湍流局部 Nusselt 数**：
       Nu_x = 0.0296 · Re_x^{4/5} · Pr^{1/3}

2. **混合边界层平均 Nusselt 数**（前层流 + 后湍流）：
       Nu_L = (0.037 · Re_L^{4/5} - 871) · Pr^{1/3}

   其中 871 = 0.037·Re_cr^{4/5} - 0.664·Re_cr^{1/2} 是混合修正项，
   Re_cr = 5×10⁵。

3. **纯湍流平均 Nusselt 数**（假设从前缘即为湍流）：
       Nu_L = 0.037 · Re_L^{4/5} · Pr^{1/3}

4. **湍流边界层厚度**：
       δ(x) = 0.37 · x / Re_x^{1/5}

教学要点
--------
- 层流 → 湍流转捩对换热强化的显著效果
- 混合边界层 vs 纯湍流假设的差异
- 转捩位置 x_cr 对平均换热的影响
"""

import numpy as np


def solve_flat_plate_turbulent(params: dict) -> dict:
    """
    平板湍流强制对流换热 · 混合边界层经验关联式

    Parameters (通过 params 字典传入)
    ----------
    plate_length     : 平板长度 L (m), 默认 2.0
    velocity         : 来流速度 U_∞ (m/s), 默认 10.0
    temp_wall        : 壁面温度 T_w (°C), 默认 60
    temp_fluid       : 来流温度 T_∞ (°C), 默认 20
    fluid_k          : 流体导热系数 k_f (W/(m·K)), 默认 0.026
    fluid_nu         : 运动粘度 ν (m²/s), 默认 1.6e-5
    fluid_Pr         : Prandtl 数, 默认 0.71
    Re_cr            : 临界 Reynolds 数, 默认 5e5
    n_points         : 计算点数, 默认 200

    Returns
    -------
    dict : 包含 indicators 和 chart_data
    """
    # ---------- 读取参数 ----------
    L     = float(params.get('plate_length', 2.0))
    U_inf = float(params.get('velocity', 10.0))
    T_w   = float(params.get('temp_wall', 60))
    T_inf = float(params.get('temp_fluid', 20))
    k_f   = float(params.get('fluid_k', 0.026))
    nu    = float(params.get('fluid_nu', 1.6e-5))
    Pr    = float(params.get('fluid_Pr', 0.71))
    Re_cr = float(params.get('Re_cr', 5e5))
    n_pts = int(params.get('n_points', 200))

    # ========================================================
    # 第一步：全长参数与转捩点
    # ========================================================
    Re_L = U_inf * L / nu
    x_cr = Re_cr * nu / U_inf   # 转捩位置 (m)

    if Re_L < Re_cr:
        # 全板层流，提示使用层流模型
        return {
            "indicators": {
                "提示": f"Re_L = {Re_L:.0f} < Re_cr = {Re_cr:.0f}，全板层流，请使用层流模型。"
            },
            "chart_data": {"x": [], "y": [], "title": "未达到湍流条件"},
        }

    # ========================================================
    # 第二步：混合边界层平均 Nu（考虑前段层流）
    # ========================================================
    Nu_L_mixed = (0.037 * Re_L**0.8 - 871) * Pr**(1.0 / 3.0)
    h_avg_mixed = Nu_L_mixed * k_f / L

    # 纯湍流假设（对比用）
    Nu_L_turb_only = 0.037 * Re_L**0.8 * Pr**(1.0 / 3.0)
    h_avg_turb_only = Nu_L_turb_only * k_f / L

    Q_mixed = h_avg_mixed * L * (T_w - T_inf)

    # ========================================================
    # 第三步：沿板长计算局部换热系数
    # ========================================================
    x = np.linspace(L / n_pts, L, n_pts)
    Re_x = U_inf * x / nu

    # 分段计算
    h_x = np.zeros(n_pts)
    delta = np.zeros(n_pts)

    for i in range(n_pts):
        if Re_x[i] < Re_cr:
            # 层流区
            Nu_local = 0.332 * Re_x[i]**0.5 * Pr**(1.0 / 3.0)
            delta[i] = 5.0 * x[i] / Re_x[i]**0.5
        else:
            # 湍流区
            Nu_local = 0.0296 * Re_x[i]**0.8 * Pr**(1.0 / 3.0)
            delta[i] = 0.37 * x[i] / Re_x[i]**0.2

        h_x[i] = Nu_local * k_f / x[i]

    # ========================================================
    # 第四步：组装结果
    # ========================================================
    return {
        "indicators": {
            "全长 Re_L": round(Re_L, 0),
            "转捩位置 x_cr (m)": round(x_cr, 4),
            "转捩位置占比 x_cr/L": round(x_cr / L, 4),
            "混合边界层 Nu_L": round(Nu_L_mixed, 2),
            "混合边界层 h_avg (W/(m²·K))": round(h_avg_mixed, 4),
            "纯湍流假设 Nu_L": round(Nu_L_turb_only, 2),
            "纯湍流假设 h_avg (W/(m²·K))": round(h_avg_turb_only, 4),
            "混合/纯湍流 h 比率": round(h_avg_mixed / h_avg_turb_only, 4),
            "单位宽度换热量 Q (W/m)": round(Q_mixed, 4),
            "末端边界层厚度 δ(L) (mm)": round(float(delta[-1]) * 1000, 2),
            "关联式": "Nu_L = (0.037·Re_L^{4/5} - 871)·Pr^{1/3}",
        },
        "chart_data": {
            "x": x.tolist(),
            "y": h_x.tolist(),
            "x_label": "沿板长位置 x (m)",
            "y_label": "局部换热系数 h_x (W/(m²·K))",
            "title": "平板混合边界层强制对流 · 局部换热系数分布",
        },
    }
