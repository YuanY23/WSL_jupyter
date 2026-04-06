"""
热辐射基础仿真 —— 两无限大平行平板间辐射换热
============================================================
分析方法：辐射传热基础理论 + 多参数对比分析

物理模型
--------
两块无限大平行平板，面积远大于间距，相互正对。
板 1 温度 T_1，发射率 ε₁；板 2 温度 T_2，发射率 ε₂。
两板间为真空或不参与辐射的透明介质。

    ╔═══════════════════════╗  ← 板1: T_1, ε₁
    ║                       ║
    ║   真空 / 透明介质      ║  间距 d（对无限大平板无影响）
    ║                       ║
    ╔═══════════════════════╗  ← 板2: T_2, ε₂

基础物理定律
------------
1. **Stefan-Boltzmann 定律**：
       E_b = σ · T⁴
       σ = 5.67 × 10⁻⁸ W/(m²·K⁴)

2. **角系数**：
   对无限大平行平板，角系数 F₁₂ = F₂₁ = 1

3. **净辐射换热量（灰体）**：
       q₁₂ = σ · (T₁⁴ - T₂⁴) / (1/ε₁ + 1/ε₂ - 1)

   推导过程：
   - 有效辐射 = 发射 + 反射
   - 对两个无限大平行灰体平板，利用多次反射的几何级数求和
   - 最终等效发射率 ε_eff = 1/(1/ε₁ + 1/ε₂ - 1)

4. **辐射热阻**：
       R_rad = (1/ε₁ + 1/ε₂ - 1) / (σ · (T₁² + T₂²) · (T₁ + T₂))
   其中 T₁, T₂ 为绝对温度 (K)

5. **等效辐射换热系数**：
       h_r = σ · ε_eff · (T₁² + T₂²) · (T₁ + T₂)

特殊情况
--------
- ε₁ = ε₂ = 1（黑体）：q₁₂ = σ·(T₁⁴ - T₂⁴)，最大换热量
- ε₁ → 0 或 ε₂ → 0：q₁₂ → 0，辐射屏蔽效果
- 插入辐射遮热板：可大幅降低辐射换热

教学要点
--------
- Stefan-Boltzmann 定律的 T⁴ 非线性效应
- 发射率对辐射换热的巨大影响
- 等效发射率 ε_eff 的物理含义
- 辐射与对流换热系数的量级对比
- 辐射遮热板（radiation shield）的原理
"""

import numpy as np


def solve_parallel_plates_radiation(params: dict) -> dict:
    """
    两无限大平行平板间辐射换热

    Parameters (通过 params 字典传入)
    ----------
    temp_plate1      : 板1温度 T₁ (°C), 默认 500
    temp_plate2      : 板2温度 T₂ (°C), 默认 30
    emissivity1      : 板1发射率 ε₁, 默认 0.8
    emissivity2      : 板2发射率 ε₂, 默认 0.6
    n_shield         : 遮热板数量 (可选), 默认 0
    emissivity_shield: 遮热板发射率 (可选), 默认 0.05 (抛光金属)

    Returns
    -------
    dict : 包含 indicators 和 chart_data
    """
    # ---------- 读取参数 ----------
    T1_C = float(params.get('temp_plate1', 500))
    T2_C = float(params.get('temp_plate2', 30))
    eps1 = float(params.get('emissivity1', 0.8))
    eps2 = float(params.get('emissivity2', 0.6))
    n_shield = int(params.get('n_shield', 0))
    eps_s = float(params.get('emissivity_shield', 0.05))

    sigma = 5.67e-8   # Stefan-Boltzmann 常数

    # 转换为绝对温度
    T1 = T1_C + 273.15
    T2 = T2_C + 273.15

    # ========================================================
    # 第一步：无遮热板情况
    # ========================================================
    eps_eff = 1.0 / (1.0 / eps1 + 1.0 / eps2 - 1.0)
    q_no_shield = sigma * eps_eff * (T1**4 - T2**4)

    # 黑体极限
    q_blackbody = sigma * (T1**4 - T2**4)

    # 等效辐射换热系数
    h_r = sigma * eps_eff * (T1**2 + T2**2) * (T1 + T2)

    # ========================================================
    # 第二步：有遮热板情况
    # ========================================================
    # N 个相同遮热板插入后，总热阻增加
    # q_shield = σ(T1⁴ - T2⁴) / [(1/ε₁ + 1/ε₂ - 1) + N×(2/ε_s - 1)]
    if n_shield > 0:
        denom = (1.0 / eps1 + 1.0 / eps2 - 1.0) + n_shield * (2.0 / eps_s - 1.0)
        q_with_shield = sigma * (T1**4 - T2**4) / denom
        shield_reduction = (1.0 - q_with_shield / q_no_shield) * 100
    else:
        q_with_shield = q_no_shield
        shield_reduction = 0.0

    # ========================================================
    # 第三步：发射率敏感性分析（用于绘图）
    # ========================================================
    # 固定 T1, T2, eps2，变化 eps1 从 0.05 到 1.0
    eps1_range = np.linspace(0.05, 1.0, 50)
    q_vs_eps1 = np.zeros(50)
    for i, e1 in enumerate(eps1_range):
        e_eff = 1.0 / (1.0 / e1 + 1.0 / eps2 - 1.0)
        q_vs_eps1[i] = sigma * e_eff * (T1**4 - T2**4)

    # ========================================================
    # 第四步：各板辐射力计算
    # ========================================================
    E_b1 = sigma * T1**4   # 板1黑体辐射力
    E_b2 = sigma * T2**4   # 板2黑体辐射力
    J1 = eps1 * E_b1 + (1 - eps1) * (eps_eff * E_b1 + (1 - eps_eff) * E_b2)  # 简化

    # ========================================================
    # 第五步：返回结果
    # ========================================================
    indicators = {
        "等效发射率 ε_eff": round(eps_eff, 4),
        "净辐射热流密度 q (W/m²)": round(q_no_shield, 2),
        "黑体辐射极限 q_bb (W/m²)": round(q_blackbody, 2),
        "q/q_bb 比率": round(q_no_shield / q_blackbody, 4) if q_blackbody != 0 else 0,
        "等效辐射换热系数 h_r (W/(m²·K))": round(h_r, 4),
        "板1黑体辐射力 E_b1 (W/m²)": round(E_b1, 2),
        "板2黑体辐射力 E_b2 (W/m²)": round(E_b2, 2),
        "Stefan-Boltzmann 常数 σ": f"{sigma:.2e}",
    }

    if n_shield > 0:
        indicators["遮热板数量"] = n_shield
        indicators["遮热板发射率 ε_s"] = eps_s
        indicators["有遮热板热流 q_shield (W/m²)"] = round(q_with_shield, 2)
        indicators["遮热板减热率 (%)"] = round(shield_reduction, 2)

    return {
        "indicators": indicators,
        "chart_data": {
            "x": eps1_range.tolist(),
            "y": q_vs_eps1.tolist(),
            "x_label": "板1发射率 ε₁",
            "y_label": "净辐射热流密度 q (W/m²)",
            "title": "发射率对辐射换热的影响",
        },
    }
