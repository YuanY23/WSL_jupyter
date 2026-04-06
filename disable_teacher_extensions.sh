#!/bin/bash
# =============================================================
# Dynamic extension control: disable teacher-only extensions
# for student containers (where NBGRADER_COURSE_ID is not set).
# This runs via /usr/local/bin/before-notebook.d/ before the
# Jupyter server starts.
# =============================================================

if [ -z "$NBGRADER_COURSE_ID" ]; then
    echo "[disable_teacher_extensions] Student container detected, disabling teacher extensions..."
    mkdir -p /opt/conda/share/jupyter/lab/settings
    cat > /opt/conda/share/jupyter/lab/settings/page_config.json <<EOF
{
  "disabledExtensions": [
    "@jupyter/nbgrader:formgrader",
    "@jupyter/nbgrader:create-assignment"
  ]
}
EOF
else
    echo "[disable_teacher_extensions] Teacher container detected, all extensions enabled."
    # Remove any leftover page_config.json from a previous student session
    rm -f /opt/conda/share/jupyter/lab/settings/page_config.json
fi

# =============================================================
# Force clear Matplotlib font cache 
# Prevents stale font lists when the underlying Docker Image adds new fonts
# =============================================================
if [ -d "/home/jovyan/.cache/matplotlib" ]; then
    rm -rf /home/jovyan/.cache/matplotlib
    echo "[disable_teacher_extensions] Cleared old matplotlib font cache to detect new system fonts."
fi
