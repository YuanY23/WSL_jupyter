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
