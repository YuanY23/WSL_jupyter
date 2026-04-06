from setuptools import setup, find_packages
import os

def get_data_files():
    data_files = []
    # 递归获取前端打包出来的 labextension 静态资源
    for root, dirs, files in os.walk('jupyterlab_thermal_design/labextension'):
        file_paths = [os.path.join(root, f) for f in files]
        # 映射到 jupyter 的共享目录
        rel_path = os.path.relpath(root, 'jupyterlab_thermal_design/labextension')
        if rel_path == '.':
            install_path = 'share/jupyter/labextensions/jupyterlab-thermal-design'
        else:
            install_path = os.path.join('share/jupyter/labextensions/jupyterlab-thermal-design', rel_path)
        data_files.append((install_path, file_paths))
    
    # 将包配置文件也带上
    data_files.append(('share/jupyter/labextensions/jupyterlab-thermal-design', ['package.json']))
    return data_files

setup(
    name="jupyterlab_thermal_design",
    version="0.1.0",
    description="Thermal Design Simulation Frontend",
    packages=["jupyterlab_thermal_design", "thermal_solver", "thermal_solver.core", "thermal_solver.models", "thermal_solver.models.steady_conduction", "thermal_solver.models.convection", "thermal_solver.models.radiation"],
    data_files=get_data_files(),
    zip_safe=False,
)
