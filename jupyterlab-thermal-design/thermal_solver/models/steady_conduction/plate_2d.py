import numpy as np

def solve_2d_steady_conduction(params: dict) -> dict:
    """
    二维矩形平板稳态导热 (有限差分法 FDM)
    
    Parameters
    ----------
    length               : 平板长度 L (m), 默认 1.0
    width                : 平板宽度 W (m), 默认 1.0
    temp_top             : 上边界温度 (°C), 默认 100
    temp_bottom          : 下边界温度 (°C), 默认 20
    temp_left            : 左边界温度 (°C), 默认 20
    temp_right           : 右边界温度 (°C), 默认 20
    nx                   : x方向节点数, 默认 30
    ny                   : y方向节点数, 默认 30
    """
    L = float(params.get('length', 1.0))
    W = float(params.get('width', 1.0))
    T_top = float(params.get('temp_top', 100))
    T_bottom = float(params.get('temp_bottom', 20))
    T_left = float(params.get('temp_left', 20))
    T_right = float(params.get('temp_right', 20))
    nx = int(params.get('nx', 30))
    ny = int(params.get('ny', 30))
    
    # 限制网格数以防止矩阵过大导致内存溢出
    nx = max(3, min(nx, 50))
    ny = max(3, min(ny, 50))
    
    dx = L / (nx - 1)
    dy = W / (ny - 1)
    
    dx2 = dx * dx
    dy2 = dy * dy
    denom = 2 * (dx2 + dy2)
    
    n_total = nx * ny
    A = np.zeros((n_total, n_total))
    b = np.zeros(n_total)
    
    def get_index(i, j):
        return i + j * nx

    # 组装线性方程组
    for j in range(ny):
        for i in range(nx):
            idx = get_index(i, j)
            
            # 边界条件 (第一类Dirichlet)
            if j == 0:  # Bottom
                A[idx, idx] = 1.0
                b[idx] = T_bottom
            elif j == ny - 1:  # Top
                A[idx, idx] = 1.0
                b[idx] = T_top
            elif i == 0:  # Left
                A[idx, idx] = 1.0
                b[idx] = T_left
            elif i == nx - 1:  # Right
                A[idx, idx] = 1.0
                b[idx] = T_right
            else:
                # 内部节点
                A[idx, idx] = -denom
                A[idx, get_index(i-1, j)] = dy2
                A[idx, get_index(i+1, j)] = dy2
                A[idx, get_index(i, j-1)] = dx2
                A[idx, get_index(i, j+1)] = dx2
                b[idx] = 0.0

    # 求解 T
    T_vec = np.linalg.solve(A, b)
    T_mat = T_vec.reshape((ny, nx))
    
    x_coords = np.linspace(0, L, nx)
    y_coords = np.linspace(0, W, ny)
    
    # 角点温度是两侧边界的平均值或其中之一，这在上面代码中被覆盖了，
    # 第一类边界条件下角点取值不影响内部，但为了图形美观处理一下:
    T_mat[0, 0] = (T_bottom + T_left) / 2
    T_mat[0, nx-1] = (T_bottom + T_right) / 2
    T_mat[ny-1, 0] = (T_top + T_left) / 2
    T_mat[ny-1, nx-1] = (T_top + T_right) / 2

    return {
        "indicators": {
            "中心点温度 (°C)": round(float(T_mat[ny//2, nx//2]), 2),
            "平均温度 (°C)": round(float(np.mean(T_mat)), 2),
            "最高边界温度 (°C)": max(T_top, T_bottom, T_left, T_right),
            "最低边界温度 (°C)": min(T_top, T_bottom, T_left, T_right),
            "网格尺寸": f"{nx} x {ny}"
        },
        "chart_data": {
            "type": "heatmap",
            "x": x_coords.tolist(),
            "y": y_coords.tolist(),
            "z": T_mat.tolist(),
            "x_label": "位置 x (m)",
            "y_label": "位置 y (m)",
            "title": "二维矩形平板稳态导热温度场"
        }
    }
