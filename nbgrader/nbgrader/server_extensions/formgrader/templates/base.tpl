<!doctype html>
<head>
  <title>作业评测平台</title>

  <script src="{{ base_url }}/formgrader/static/node_modules/jquery/dist/jquery.min.js"></script>
  <script src="{{ base_url }}/formgrader/static/node_modules/underscore/underscore-min.js"></script>
  <script src="{{ base_url }}/formgrader/static/node_modules/backbone/backbone-min.js"></script>
  <script src="{{ base_url }}/formgrader/static/node_modules/bootstrap/dist/js/bootstrap.min.js"></script>
  <script src="{{ base_url }}/formgrader/static/node_modules/datatables.net/js/jquery.dataTables.js"></script>
  <script src="{{ base_url }}/formgrader/static/node_modules/datatables.net-bs/js/dataTables.bootstrap.js"></script>
  <script src="{{ base_url }}/formgrader/static/js/backbone_xsrf.js"></script>
  <script src="{{ base_url }}/formgrader/static/js/utils.js"></script>

  <link rel="stylesheet" href="{{ base_url }}/formgrader/static/node_modules/bootstrap/dist/css/bootstrap.min.css" />
  <link rel="stylesheet" href="{{ base_url }}/formgrader/static/node_modules/datatables.net-bs/css/dataTables.bootstrap.css">
  <link rel="stylesheet" href="{{ base_url }}/formgrader/static/css/nbgrader.css">

  <script>
  var base_url = "{{ base_url }}";
  </script>

  {%- block head -%}
  {%- endblock -%}
</head>

<body>
  <div class="container-fluid">
    <div class="row">
      <div class="col-md-2">
        <div class="page-header">
          <h1>作业评测平台</h1>
        </div>
      </div>
      <div class="col-md-10">
        <div class="page-header">
          <h1>
          {%- block title -%}
          {%- endblock -%}
          </h1>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-2">
        <ul class="nav nav-pills nav-stacked">
          {%- block sidebar -%}
          <li role="presentation"><a href="{{ base_url }}/formgrader/manage_assignments">作业管理</a></li>
          <li role="presentation"><a href="{{ base_url }}/formgrader/gradebook">手动评分</a></li>
          <li role="presentation"><a href="{{ base_url }}/formgrader/manage_students">学生管理</a></li>
          {%- endblock -%}
        </ul>
      </div>
      <div class="col-md-10">
        {%- block body -%}
        {%- block breadcrumbs -%}
        {%- endblock -%}
        {%- block messages -%}
        {%- endblock -%}
        <table class="table table-hover">
          <thead>
            {%- block table_header -%}
            {%- endblock -%}
          </thead>
          <tbody id="main-table">
            {%- block table_body -%}
            {%- endblock -%}
          </tbody>
          <tfoot>
            {%- block table_footer -%}
            {%- endblock -%}
          </tfoot>
        </table>
        {%- endblock -%}
      </div>
    </div>
  </div>
  {%- block script -%}
  {%- endblock -%}
</body>
