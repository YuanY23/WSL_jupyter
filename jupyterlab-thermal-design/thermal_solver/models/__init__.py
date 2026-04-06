# 注册所有模型求解器
from .steady_conduction import (
    solve_flat_plate,
    solve_multilayer_plate,
    solve_cylindrical_wall,
    solve_straight_fin,
    solve_internal_heat_generation,
    solve_2d_steady_conduction,
)
from .transient_conduction import (
    solve_plate_constant_temp,
    solve_plate_constant_flux,
)
from .convection import (
    solve_flat_plate_laminar,
    solve_flat_plate_turbulent,
    solve_vertical_plate_natural,
    solve_internal_tube_convection,
)
from .radiation import (
    solve_parallel_plates_radiation,
    solve_3surface_enclosure_radiation,
)

ROUTER = {
    # ---- 一维稳态导热 ----
    'steady_flat_plate': solve_flat_plate,
    'steady_multilayer_plate': solve_multilayer_plate,
    'steady_cylindrical_wall': solve_cylindrical_wall,
    'steady_straight_fin': solve_straight_fin,
    'steady_internal_heat': solve_internal_heat_generation,
    'steady_2d_plate': solve_2d_steady_conduction,
    # ---- 一维瞬态导热 ----
    'transient_plate_const_temp': solve_plate_constant_temp,
    'transient_plate_const_flux': solve_plate_constant_flux,
    # ---- 对流换热 ----
    'convection_laminar_plate': solve_flat_plate_laminar,
    'convection_turbulent_plate': solve_flat_plate_turbulent,
    'convection_natural_vertical': solve_vertical_plate_natural,
    'convection_internal_tube': solve_internal_tube_convection,
    # ---- 热辐射 ----
    'radiation_parallel_plates': solve_parallel_plates_radiation,
    'radiation_3surface': solve_3surface_enclosure_radiation,
}
