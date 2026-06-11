{%- extends 'manage_students_base.tpl' -%}

{%- block head -%}
<script>
var student_id = "{{ student_id }}";
</script>

<script src="{{ base_url }}/formgrader/static/js/manage_students_assignments.js"></script>
{%- endblock head -%}

{%- block breadcrumbs -%}
<ol class="breadcrumb">
  <li><a href="{{ base_url }}/formgrader/manage_students">学生管理</a></li>
  <li class="active">{{ student_id }}</li>
</ol>
{%- endblock -%}

{%- block table_header -%}
<tr>
  <th>作业编号</th>
  <th class="text-center">总分</th>
  <th class="text-center">代码分数</th>
  <th class="text-center">文字题分数</th>
  <th class="text-center">任务题分数</th>
  <th class="text-center">需要手动评分？</th>
</tr>
{%- endblock -%}

{%- block table_body -%}
<tr><td colspan="5">加载中，请稍候...</td></tr>
{%- endblock -%}
