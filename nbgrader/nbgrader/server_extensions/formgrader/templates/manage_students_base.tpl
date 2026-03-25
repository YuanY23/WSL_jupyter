{%- extends 'base.tpl' -%}

{%- block title -%}
Manage Students
{%- endblock -%}

{%- block sidebar -%}
<li role="presentation"><a href="{{ base_url }}/formgrader/manage_assignments">作业管理</a></li>
<li role="presentation"><a href="{{ base_url }}/formgrader/gradebook">手动评分</a></li>
<li role="presentation" class="active"><a href="{{ base_url }}/formgrader/manage_students">学生管理</a></li>
{%- endblock -%}
