{%- extends 'gradebook_base.tpl' -%}

{%- block head -%}
<script src="{{ base_url }}/formgrader/static/js/gradebook_assignments.js"></script>
{%- endblock -%}

{%- block breadcrumbs -%}
<ol class="breadcrumb">
  <li class="active">手动评分</li>
</ol>
{%- endblock -%}

{%- block table_header -%}
<tr>
  <th>Assignment ID</th>
  <th class="text-center">截止日期</th>
  <th class="text-center">Submissions</th>
  <th class="text-center">Score</th>
</tr>
{%- endblock -%}

{%- block table_body -%}
<tr><td colspan="4">加载中，请稍候...</td></tr>
{%- endblock -%}
