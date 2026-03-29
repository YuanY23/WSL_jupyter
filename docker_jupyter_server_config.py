import os

c = get_config()  # noqa: F821

# ============================================================
# Dynamic Extension Control for Docker Container
# ============================================================
# If NBGRADER_COURSE_ID is NOT set, this container belongs to a student.
# Disable teacher-only extensions (Formgrader, Course List) so students
# cannot create or manage assignments.

if not os.environ.get('NBGRADER_COURSE_ID'):
    # Disable server extensions (backend API) for students
    c.ServerApp.jpserver_extensions['nbgrader.server_extensions.formgrader'] = False
    c.ServerApp.jpserver_extensions['nbgrader.server_extensions.course_list'] = False
    # NOTE: Frontend labextension UI is disabled via disable_teacher_extensions.sh
    # startup script which writes page_config.json before the server starts.
