# 一维稳态导热过程仿真 —— 子场景注册
from .flat_plate import solve_flat_plate
from .multilayer_plate import solve_multilayer_plate
from .cylindrical_wall import solve_cylindrical_wall
from .straight_fin import solve_straight_fin
from .internal_heat import solve_internal_heat_generation
from .plate_2d import solve_2d_steady_conduction

__all__ = [
    "solve_flat_plate",
    "solve_multilayer_plate",
    "solve_cylindrical_wall",
    "solve_straight_fin",
    "solve_internal_heat_generation",
    "solve_2d_steady_conduction",
]
