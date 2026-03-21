import os
import sys

# ============================================================
# JupyterHub Configuration for nbgrader Integration
# ============================================================

# Add current directory to path so CustomNativeAuthenticator can be imported
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from custom_authenticator import CustomNativeAuthenticator

c = get_config()  # noqa: F821

# --- Authenticator Configuration ---
c.JupyterHub.authenticator_class = CustomNativeAuthenticator

# NativeAuthenticator settings
c.CustomNativeAuthenticator.enable_signup = True
c.CustomNativeAuthenticator.open_signup = True  # No admin approval needed
c.CustomNativeAuthenticator.minimum_password_length = 1  # For testing

# Custom groups for nbgrader role assignment
c.CustomNativeAuthenticator.teacher_group = 'formgrade-course_test'
c.CustomNativeAuthenticator.student_group = 'nbgrader-course_test'

# Admin users
c.Authenticator.admin_users = {'yuan'}
c.Authenticator.allow_all = True

# --- Hub Configuration ---
c.JupyterHub.ip = '0.0.0.0'
c.JupyterHub.port = 8000

# --- Proxy Configuration ---
# Point to the configurable-http-proxy binary installed by conda
c.ConfigurableHTTPProxy.command = [
    '/home/yuan/miniconda3/envs/jupyter/bin/configurable-http-proxy'
]

# --- nbgrader Integration ---
# Define groups (JupyterHub 3.2+ format)
c.JupyterHub.load_groups = {
    'formgrade-course_test': {'users': []},    # Teachers
    'nbgrader-course_test': {'users': []},     # Students
}

# --- Spawner Configuration ---
# Use SimpleLocalProcessSpawner: does NOT require system users.
# All notebook servers run as the current user (yuan).
from jupyterhub.spawner import SimpleLocalProcessSpawner
c.JupyterHub.spawner_class = SimpleLocalProcessSpawner
c.Spawner.default_url = '/lab'
c.Spawner.cmd = ['/home/yuan/miniconda3/envs/jupyter/bin/jupyterhub-singleuser']
c.Spawner.environment = {'PATH': '/home/yuan/miniconda3/envs/jupyter/bin:' + os.environ.get('PATH', '')}

# 设置 notebook 目录为项目目录，确保 nbgrader 能找到配置文件
c.Spawner.notebook_dir = '/home/yuan/my_project'

# 增加超时时间：nbgrader + 可编辑安装的 JupyterLab 启动较慢
c.Spawner.http_timeout = 120   # 等待服务器响应的超时（秒）
c.Spawner.start_timeout = 120  # 等待服务器启动的超时（秒）
c.Spawner.args = ['--LabApp.custom_css=True']

# --- Template Paths ---
c.JupyterHub.template_paths = ['/home/yuan/my_project/templates']

