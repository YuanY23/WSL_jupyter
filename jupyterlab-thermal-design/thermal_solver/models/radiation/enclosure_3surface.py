import numpy as np

def solve_3surface_enclosure_radiation(params: dict) -> dict:
    """
    包含重辐射面的三表面空腔辐射换热网络求解
    
    Parameters
    ----------
    temp_1              : 表面1温度 (°C)
    emissivity_1        : 表面1发射率
    area_1              : 表面1面积 (m²)
    temp_2              : 表面2温度 (°C)
    emissivity_2        : 表面2发射率
    area_2              : 表面2面积 (m²)
    view_factor_12      : 角系数 F_12
    """
    sigma = 5.67e-8
    
    T1_C = float(params.get('temp_1', 500.0))
    eps1 = float(params.get('emissivity_1', 0.8))
    A1 = float(params.get('area_1', 1.0))
    
    T2_C = float(params.get('temp_2', 30.0))
    eps2 = float(params.get('emissivity_2', 0.8))
    A2 = float(params.get('area_2', 1.0))
    
    F12 = float(params.get('view_factor_12', 0.2))
    
    T1 = T1_C + 273.15
    T2 = T2_C + 273.15
    E_b1 = sigma * T1**4
    E_b2 = sigma * T2**4
    
    # 假设表面为平面或凸面 (F11 = 0, F22 = 0)
    F13 = 1.0 - F12
    # F21 = F12 * A1 / A2
    F21 = F12 * A1 / A2
    if F21 > 1.0:
        # 非法几何或参数输入, 取最大限制 1.0
        F21 = 1.0
    F23 = 1.0 - F21
    
    # 构建表面热阻 + 空间热阻网络
    # R_s1 = (1 - eps1) / (eps1 * A1)
    # R_s2 = (1 - eps2) / (eps2 * A2)
    # 空间阻力有直接路径 R_v12 和间接路径 R_v13 + R_v23
    
    R_s1 = (1.0 - eps1) / (eps1 * A1) if eps1 > 0 else 1e10
    R_s2 = (1.0 - eps2) / (eps2 * A2) if eps2 > 0 else 1e10
    
    R_12 = 1.0 / (A1 * F12) if F12 > 0 else 1e10
    R_13 = 1.0 / (A1 * F13) if F13 > 0 else 1e10
    R_23 = 1.0 / (A2 * F23) if F23 > 0 else 1e10
    
    # 等效空间热阻 (直接项1-2 和 经3项1-3-2 的并联)
    R_space = 1.0 / ( (1.0 / R_12) + 1.0 / (R_13 + R_23) )
    
    R_total = R_s1 + R_space + R_s2
    
    q1 = (E_b1 - E_b2) / R_total
    q2 = -q1
    
    # 节点有效辐射 (Radiosity) J1, J2
    J1 = E_b1 - q1 * R_s1
    J2 = E_b2 - (-q2) * R_s2
    
    # 重辐射面 (表面3) 位于纯空间网络的中点
    # (J1 - J3)/R_13 + (J2 - J3)/R_23 = 0 (对于面3，净换热为 0)
    J3 = (J1 / R_13 + J2 / R_23) / (1 / R_13 + 1 / R_23)
    T3 = (J3 / sigma) ** 0.25 - 273.15
    
    # 如果没有重辐射面进行对照
    R_total_no_3 = R_s1 + R_12 + R_s2
    q1_no_3 = (E_b1 - E_b2) / R_total_no_3
    
    return {
        "indicators": {
            "包含重辐射面净换热量 q1 (W)": round(float(q1), 2),
            "无重辐射面时净换热量 (W)": round(float(q1_no_3), 2),
            "增强比例 (%)": round(float((q1 / q1_no_3 - 1) * 100) if q1_no_3 !=0 else 0, 2),
            "重辐射面平衡温度 T3 (°C)": round(float(T3), 2),
            "空间等效热阻": round(float(R_space), 6)
        },
        "chart_data": {
            "type": "bar",
            "categories": ["面1 T", "面1 J", "重辐射面3 J(T)", "面2 J", "面2 T"],
            "values": [E_b1, J1, J3, J2, E_b2],
            "x_label": "网络节点",
            "y_label": "辐射力/有效辐射 (W/m²)",
            "title": "两等温面与重辐射面网络节点状态分配"
        }
    }
