import numpy as np

def solve_internal_heat_generation(params: dict) -> dict:
    """
    一维平壁内热源稳态导热解析解
    
    Parameters
    ----------
    thickness            : 平板厚度 L (m), 默认 0.1
    thermal_conductivity : 导热系数 k (W/(m·K)), 默认 400
    internal_heat_rate   : 内热源强度 qv (W/m^3), 默认 1e6
    temp_left            : 左侧壁温 T1 (°C), 默认 100
    temp_right           : 右侧壁温 T2 (°C), 默认 100
    n_nodes              : 采样点数, 默认 100
    """
    L   = float(params.get('thickness', 0.1))
    k   = float(params.get('thermal_conductivity', 400))
    qv  = float(params.get('internal_heat_rate', 1e6))
    T1  = float(params.get('temp_left', 100))
    T2  = float(params.get('temp_right', 100))
    n   = int(params.get('n_nodes', 100))

    x = np.linspace(0, L, n)
    
    # 解析解公式: T(x) = (-qv / 2k) * x^2 + [ (T2 - T1) / L + (qv * L) / 2k ] * x + T1
    C1 = (T2 - T1) / L + (qv * L) / (2 * k)
    T = (-qv / (2 * k)) * x**2 + C1 * x + T1
    
    # 极值点计算
    # dT/dx = (-qv / k) * x + C1 = 0 => x_max = C1 * k / qv
    x_extremum = C1 * k / qv
    T_extremum = T1 if qv == 0 else (-qv / (2 * k)) * x_extremum**2 + C1 * x_extremum + T1
    
    # 判断极值点是否在平板内部
    if 0 <= x_extremum <= L:
        max_temp = T_extremum
        max_temp_pos = x_extremum
    else:
        if T1 > T2:
            max_temp = T1
            max_temp_pos = 0.0
        else:
            max_temp = T2
            max_temp_pos = L

    q_left = k * C1 # 热流密度向右为正
    q_right = -k * ((-qv / k) * L + C1)

    return {
        "indicators": {
            "最高温度 T_max (°C)": round(float(max_temp), 2),
            "最高温度位置 x (m)": round(float(max_temp_pos), 4),
            "左侧热流密度 q_left (W/m^2)": round(float(q_left), 2),
            "右侧热流密度 q_right (W/m^2)": round(float(q_right), 2),
            "热平衡检查 (qv * L)": round(float(qv * L), 2)
        },
        "chart_data": {
            "type": "line",
            "x": x.tolist(),
            "y": T.tolist(),
            "x_label": "位置 x (m)",
            "y_label": "温度 T (°C)",
            "title": "一维平壁内热源稳态导热"
        }
    }
