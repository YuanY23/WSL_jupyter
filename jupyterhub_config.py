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
# Groups are created dynamically by CustomNativeAuthenticator.
# No need to predefine them here.

# Admin API token for nbgrader to manage groups (add/remove students)
import secrets
_nbgrader_api_token = secrets.token_hex(32)
c.JupyterHub.services = [
    {
        'name': 'nbgrader',
        'api_token': _nbgrader_api_token,
        'admin': True,
    }
]

# --- Spawner Configuration (DockerSpawner) ---
import dockerspawner

c.JupyterHub.spawner_class = dockerspawner.DockerSpawner
c.DockerSpawner.image = 'my_jupyterhub:latest'

# Explicitly tell containers how to reach the Hub (Docker default bridge IP)
c.JupyterHub.hub_ip = '0.0.0.0'
c.JupyterHub.hub_connect_ip = '172.17.0.1'

c.DockerSpawner.default_url = '/lab'
c.DockerSpawner.notebook_dir = '/home/jovyan'

# Base Volumes for EVERY user
c.DockerSpawner.volumes = {
    # 1. Persist user home directories across restarts
    'jupyterhub-user-{username}': '/home/jovyan',
    
    # 2. Global shared exchange directory for assignment distribution
    '/srv/nbgrader/exchange': '/srv/nbgrader/exchange',
    
    # Source-mount development mode for extension testing.
    # '/home/yuan/my_project/nbgrader': '/src/nbgrader',
    # '/home/yuan/my_project/jupyterlab': '/opt/jupyterlab',
    # '/home/yuan/my_project/jupyterlab-param-binding': '/src/jupyterlab-param-binding',
    # 'jupyterlab-param-binding-node-modules': '/src/jupyterlab-param-binding/node_modules',
    # '/home/yuan/my_project/jupyterlab-simulation-platform': '/src/jupyterlab-simulation-platform',
    # 'jupyterlab-simulation-platform-node-modules': '/src/jupyterlab-simulation-platform/node_modules',
    # '/home/yuan/my_project/jupyterlab-thermal-design': '/src/jupyterlab-thermal-design',
    # 'jupyterlab-thermal-design-node-modules': '/src/jupyterlab-thermal-design/node_modules',
}

# ================= 开发模式临时加的配置 =================
# c.DockerSpawner.args = ['--dev-mode', '--watch'] # 暂时注释掉这行，它会导致启动崩溃
# ========================================================

# Automatically remove Docker containers when stopped
c.DockerSpawner.remove = True

# Dynamically add volumes for teachers based on their groups
def pre_spawn_hook(spawner):
    username = spawner.user.name
    user_groups = [g.name for g in spawner.user.groups]
    
    is_teacher = False
    for group in user_groups:
        if group.startswith('formgrade-'):
            is_teacher = True
            course_id = group.split('-', 1)[1]
            # Auto-create course directory on host if it doesn't exist
            host_course_dir = f'/home/yuan/my_project/courses/{course_id}'
            os.makedirs(host_course_dir, exist_ok=True)
            # Ensure the directory is writable by jovyan (UID 1000, GID 100) in the container
            os.chown(host_course_dir, 1000, 100)
            # Mount it into the teacher's container
            spawner.volumes[host_course_dir] = f'/home/jovyan/{course_id}'
            # Pass course ID to the container for nbgrader root mapping
            spawner.environment['NBGRADER_COURSE_ID'] = course_id

    if is_teacher:
        # Inject admin-level API token so formgrader can manage JupyterHub groups
        # (add/remove students to nbgrader-{course_id} groups).
        # NOTE: We do NOT overwrite JUPYTERHUB_API_TOKEN here (that breaks OAuth).
        # Instead we pass a separate env var that docker_nbgrader_config.py will use.
        spawner.environment['NBGRADER_ADMIN_API_TOKEN'] = _nbgrader_api_token

c.DockerSpawner.pre_spawn_hook = pre_spawn_hook

# timeouts
c.Spawner.http_timeout = 120   # 等待服务器响应的超时（秒）
c.Spawner.start_timeout = 120  # 等待服务器启动的超时（秒）

# --- Template Paths ---
c.JupyterHub.template_paths = ['/home/yuan/my_project/templates']

# --- RBAC Configuration for nbgrader ---
# Allow teachers to read users and groups to populate student lists
c.JupyterHub.load_roles = [
    {
        "name": "formgrade-teacher",
        # list:users allows seeing the list of users
        # read:users allows seeing user details
        # read:groups allows seeing group members
        "scopes": ["list:users", "read:users", "read:groups", "list:groups", "admin:groups", "access:services"],
        "groups": ["teachers"] 
    }
]
