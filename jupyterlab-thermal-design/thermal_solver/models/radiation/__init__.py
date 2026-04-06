# 热辐射基础仿真 —— 子场景注册
from .parallel_plates import solve_parallel_plates_radiation
from .enclosure_3surface import solve_3surface_enclosure_radiation

__all__ = [
    "solve_parallel_plates_radiation",
    "solve_3surface_enclosure_radiation",
]
