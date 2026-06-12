from nbgrader.auth import JupyterHubAuthPlugin

c = get_config()  # noqa: F821

# ============================================================
# Global nbgrader Configuration for Docker Container
# ============================================================

# Use JupyterHub auth plugin so nbgrader checks Hub groups for permissions
# This allows teachers in formgrade-{course_id} to manage assignments,
# and students in nbgrader-{course_id} to fetch them.
c.Authenticator.plugin_class = JupyterHubAuthPlugin

# Exchange directory - shared location for assignment distribution
c.Exchange.root = '/srv/nbgrader/exchange'

# Crucial for multi-course support: ensure paths in exchange are prefixed with course_id
c.Exchange.path_includes_course = True

# When running in JupyterHub, we do NOT set a global `c.CourseDirectory.course_id`
# because a student could be in multiple courses, and a teacher could teach multiple courses.
# The nbgrader extensions (Assignment List & Course List) will automatically determine
# the course_id from the JupyterHub groups the user belongs to.

import os
course_id = os.environ.get('NBGRADER_COURSE_ID')
if course_id:
    # Set the course ID and remap the working directory dynamically when started
    c.CourseDirectory.course_id = course_id
    c.CourseDirectory.root = f'/home/jovyan/{course_id}'

# NBGRADER_ADMIN_API_TOKEN is handled directly inside the auth plugin and API handlers
# without overwriting JUPYTERHUB_API_TOKEN globally.

