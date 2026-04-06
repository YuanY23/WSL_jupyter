import numpy as np

def solve_internal_tube_convection(params: dict) -> dict:
    """
    圆管内强迫对流 (恒定壁温)
    
    Parameters
    ----------
    tube_length         : 管长 L (m)
    tube_diameter       : 管径 D (m)
    velocity            : 来流速度 um (m/s)
    temp_inlet          : 入口温度 T_m,i (°C)
    temp_wall           : 壁面恒温 T_s (°C)
    fluid_k             : 流体导热系数 k (W/(m·K))
    fluid_nu            : 运动粘度 nu (m²/s)
    fluid_Pr            : Prandtl数 Pr
    fluid_rho           : 密度 rho (kg/m³)
    fluid_cp            : 定压比热 cp (J/(kg·K))
    """
    L = float(params.get('tube_length', 5.0))
    D = float(params.get('tube_diameter', 0.05))
    u_m = float(params.get('velocity', 2.0))
    T_mi = float(params.get('temp_inlet', 20.0))
    T_s = float(params.get('temp_wall', 100.0))
    k = float(params.get('fluid_k', 0.6))         # 默认水附近的值
    nu = float(params.get('fluid_nu', 1e-6))
    Pr = float(params.get('fluid_Pr', 7.0))
    rho = float(params.get('fluid_rho', 1000.0))
    cp = float(params.get('fluid_cp', 4180.0))
    
    # 1. 计算雷诺数判断流态
    Re_D = u_m * D / nu
    is_laminar = Re_D < 2300
    
    # 2. 计算 Nu 和 h
    if is_laminar:
        Nu_D = 3.66  # 圆管恒温层流全段充分发展近似
    else:
        # Dittus-Boelter
        n = 0.4 if T_s > T_mi else 0.3
        Nu_D = 0.023 * (Re_D ** 0.8) * (Pr ** n)
        
    h = Nu_D * k / D
    
    # 3. 沿程温度计算
    P = np.pi * D
    A_c = np.pi * (D ** 2) / 4.0
    m_dot = rho * u_m * A_c
    
    lam = (P * h) / (m_dot * cp)
    x = np.linspace(0, L, 100)
    
    # T_m(x) = T_s - (T_s - T_mi) * exp(-lam * x)
    T_m = T_s - (T_s - T_mi) * np.exp(-lam * x)
    T_mo = T_m[-1]
    
    q_total = m_dot * cp * (T_mo - T_mi)
    lmtd = ((T_s - T_mi) - (T_s - T_mo)) / np.log((T_s - T_mi) / (T_s - T_mo)) if T_mo != T_mi else 0
    
    return {
        "indicators": {
            "雷诺数 Re_D": round(float(Re_D), 0),
            "流态": "层流" if is_laminar else "湍流",
            "努塞尔数 Nu_D": round(float(Nu_D), 2),
            "换热系数 h (W/(m²·K))": round(float(h), 2),
            "出口温度 T_mo (°C)": round(float(T_mo), 2),
            "总换热量 q (W)": round(float(q_total), 2),
            "对数平均温差 LMTD (°C)": round(float(lmtd), 2)
        },
        "chart_data": {
            "type": "line",
            "x": x.tolist(),
            "y": T_m.tolist(),
            "x_label": "管长 x (m)",
            "y_label": "主流平均温度 T_m (°C)",
            "title": "圆管内强迫对流温度分布"
        }
    }
