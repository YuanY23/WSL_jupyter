{%- extends 'base.tpl' -%}

{%- block head -%}
<script>
var assignment_id = "{{ assignment_id }}";
</script>

<script src="{{ base_url }}/formgrader/static/js/manage_submissions.js"></script>
{%- endblock head -%}

{%- block title -%}
Manage Submissions
{%- endblock -%}

{%- block sidebar -%}
<li role="presentation" class="active"><a href="{{ base_url }}/formgrader/manage_assignments">作业管理</a></li>
<li role="presentation"><a href="{{ base_url }}/formgrader/gradebook">手动评分</a></li>
<li role="presentation"><a href="{{ base_url }}/formgrader/manage_students">学生管理</a></li>
{%- endblock -%}

{%- block breadcrumbs -%}
<ol class="breadcrumb">
  <li><a href="{{ base_url }}/formgrader/manage_assignments">Assignments</a></li>
  <li class="active">{{ assignment_id }}</li>
</ol>
{%- endblock -%}

{%- block messages -%}
<div class="panel-group" id="accordion" role="tablist" aria-multiselectable="true">
  <div class="panel panel-default">
    <div class="panel-heading" role="tab" id="headingOne">
      <h4 class="panel-title">
        <a class="collapsed" role="button" data-toggle="collapse" data-parent="#accordion" href="#collapseOne" aria-expanded="false" aria-controls="collapseOne">
          操作说明（点击展开）
        </a>
      </h4>
    </div>
    <div id="collapseOne" class="panel-collapse collapse" role="tabpanel" aria-labelledby="headingOne">
      <div class="panel-body">
        <p>
          <b>Note:</b> Here you can autograde individual students' submissions by
          clicking on the autograde icons below. If you want to autograde
          all submissions at once, you will need to do this via the
          <a target="_blank" href="{{ base_url }}/terminals/1">command line</a>:
        </p>
        <p>
        <pre>
cd "{{ course_dir }}"
nbgrader autograde "{{ assignment_id }}"</pre>
        </p>
      </div>
    </div>
  </div>
</div>
{%- endblock -%}

{%- block table_header -%}
<tr>
  <th>Student Name</th>
  <th class="text-center">Student ID</th>
  <th class="text-center">Timestamp</th>
  <th class="text-center">状态</th>
  <th class="text-center">Score</th>
  <th class="text-center no-sort">Autograde</th>
  <th class="text-center no-sort">生成反馈</th>
  <th class="text-center no-sort">发布反馈</th>
</tr>
{%- endblock -%}

{%- block table_body -%}
<tr>
  <td>加载中，请稍候...</td>
  <td></td>
  <td></td>
  <td></td>
  <td></td>
  <td></td>
  <td></td>
  <td></td>
</tr>
{%- endblock -%}
