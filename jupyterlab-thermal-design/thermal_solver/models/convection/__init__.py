# 对流换热原理仿真 —— 子场景注册
from .flat_plate_laminar import solve_flat_plate_laminar
from .flat_plate_turbulent import solve_flat_plate_turbulent
from .vertical_plate_natural import solve_vertical_plate_natural
from .internal_tube import solve_internal_tube_convection

__all__ = [
    "solve_flat_plate_laminar",
    "solve_flat_plate_turbulent",
    "solve_vertical_plate_natural",
    "solve_internal_tube_convection",
]
