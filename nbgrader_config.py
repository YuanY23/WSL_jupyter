from nbgrader.auth import JupyterHubAuthPlugin

c = get_config()  # noqa: F821

# ============================================================
# nbgrader Configuration
# ============================================================

# Course ID - must match the group naming convention:
# Teacher group: formgrade-{course_id}
# Student group: nbgrader-{course_id}
c.CourseDirectory.course_id = 'course_test'

# Root directory for the course (where source/ release/ submitted/ etc. live)
c.CourseDirectory.root = '/home/yuan/my_project/course_test'

# Exchange directory - shared location for assignment distribution
c.Exchange.root = '/srv/nbgrader/exchange'

# Use JupyterHub auth plugin so nbgrader checks Hub groups for permissions
c.Authenticator.plugin_class = JupyterHubAuthPlugin
