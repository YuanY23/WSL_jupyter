{%- extends 'base.tpl' -%}

{%- block head -%}
<script>
var url_prefix = "{{ url_prefix }}";
</script>

<script src="{{ base_url }}/formgrader/static/js/manage_assignments.js"></script>
{%- endblock -%}

{%- block title -%}
作业管理
{%- endblock -%}

{%- block sidebar -%}
<li role="presentation" class="active"><a href="{{ base_url }}/formgrader/manage_assignments">作业管理</a></li>
<li role="presentation"><a href="{{ base_url }}/formgrader/gradebook">手动评分</a></li>
<li role="presentation"><a href="{{ base_url }}/formgrader/manage_students">学生管理</a></li>
{%- endblock -%}

{%- block breadcrumbs -%}
<ol class="breadcrumb">
  <li class="active">作业管理</li>
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
        <ol>
          <li>要<b>创建</b>作业，请点击下方的“添加新作业...”按钮。</li>
          <li>要<b>编辑作业文件</b>，请点击作业名称。</li>
          <li>要<b>编辑作业属性</b>，请点击编辑按钮。</li>
          <li>要<b>生成</b>学生版作业，请点击生成按钮。</li>
          <li>要<b>预览</b>学生版作业，请点击预览按钮。</li>
          <li><i>仅 JupyterHub 环境</i>：要<b>发布</b>作业给学生，请点击发布按钮。
          再次点击可以取消发布，但请注意，部分学生可能已经访问过该作业。要启用发布按钮，
          需要在 <code>nbgrader_config.py</code> 中设置 <code>course_id</code> 选项。
          详情请参考 <a href="http://nbgrader.readthedocs.io/en/stable/configuration/config_options.html">配置文档</a>。</li>
          <li><i>仅 JupyterHub 环境</i>：要<b>收集</b>学生作业，请点击收集按钮。</li>
          <li>要<b>自动评分</b>，请点击已收集提交的数量。必须先对提交进行自动评分，之后才能手动评分。</li>
        </ol>
      </div>
    </div>
  </div>
</div>
{% if current_config %}
<div class="panel-group" id="config" role="tablist" aria-multiselectable="true">
  <div class="panel panel-default">
    <div class="panel-heading" role="tab" id="headingConfig">
      <h4 class="panel-title">
        <a class="collapsed" role="button" data-toggle="collapse" data-parent="#accordion" href="#collapseConfig" aria-expanded="false" aria-controls="collapseConfig">
          当前配置（点击展开）
        </a>
      </h4>
    </div>
    <div id="collapseConfig" class="panel-collapse collapse" role="tabpanel" aria-labelledby="headingConfig">
      <pre class="panel-body">{{ current_config }}</pre>
    </div>
  </div>
</div>
{% endif %}
{% if windows %}
<div class="alert alert-warning" id="warning-windows">
检测到 Windows 操作系统。请注意，“发布”和“收集”功能将不可用。
</div>
{% elif exchange_missing %}
<div class="alert alert-warning" id="warning-exchange">
交换目录 <code>{{ exchange }}</code> 不存在，且无法自动创建。“发布”和“收集”功能将不可用。
请参考
<a href="http://nbgrader.readthedocs.io/en/stable/user_guide/managing_assignment_files.html#setting-up-the-exchange">交换目录配置说明</a>
进行设置。
</div>
{% elif not course_id %}
<div class="alert alert-warning" id="warning-course-id">
尚未在 <code>nbgrader_config.py</code> 中设置课程编号。“发布”和“收集”功能将不可用。
请参考
<a href="http://nbgrader.readthedocs.io/en/stable/user_guide/managing_assignment_files.html#setting-up-the-exchange">交换目录配置说明</a>
进行设置。
</div>
{% endif %}
{%- endblock -%}

{%- block table_header -%}
<tr>
  <th>名称</th>
  <th class="text-center">截止日期</th>
  <th class="text-center">状态</th>
  <th class="text-center no-sort">编辑</th>
  <th class="text-center no-sort">生成学生版</th>
  <th class="text-center no-sort">预览</th>
  <th class="text-center no-sort">发布</th>
  <th class="text-center no-sort">收集</th>
  <th class="text-center">提交份数</th>
  <th class="text-center no-sort">生成反馈</th>
  <th class="text-center no-sort">发布反馈</th>
</tr>
{%- endblock -%}

{%- block table_body -%}
<tr><td colspan="11">加载中，请稍候...</td></tr>
{%- endblock -%}

{%- block table_footer -%}
<tr>
  <td colspan="11">
    <span class="glyphicon glyphicon-plus" aria-hidden="true"></span>
    <a href="#" onClick="createAssignmentModal();">＋ 添加新作业...</a>
  </td>
</tr>
{%- endblock -%}
