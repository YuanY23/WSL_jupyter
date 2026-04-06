# 一维瞬态导热过程仿真 —— 子场景注册
from .plate_constant_temp import solve_plate_constant_temp
from .plate_constant_flux import solve_plate_constant_flux

__all__ = [
    "solve_plate_constant_temp",
    "solve_plate_constant_flux",
]
