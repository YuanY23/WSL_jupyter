{%- extends 'manage_students_base.tpl' -%}

{%- block head -%}
<script>
var student_id = "{{ student_id }}";
var assignment_id = "{{ assignment_id }}";
</script>

<script src="{{ base_url }}/formgrader/static/js/manage_students_notebook_submissions.js"></script>
{%- endblock head -%}

{%- block breadcrumbs -%}
<ol class="breadcrumb">
  <li><a href="{{ base_url }}/formgrader/manage_students">学生管理</a></li>
  <li><a href="{{ base_url }}/formgrader/manage_students/{{ student_id }}">{{ student_id }}</a></li>
  <li class="active">{{ assignment_id }}</li>
</ol>
{%- endblock -%}

{%- block table_header -%}
<tr>
  <th>笔记本编号</th>
  <th class="text-center">总分</th>
  <th class="text-center">代码分数</th>
  <th class="text-center">文字题分数</th>
  <th class="text-center">任务题分数</th>
  <th class="text-center">需要手动评分？</th>
  <th class="text-center">测试失败？</th>
  <th class="text-center">已标记？</th>
</tr>
{%- endblock -%}

{%- block table_body -%}
<tr><td colspan="7">加载中，请稍候...</td></tr>
{%- endblock -%}
