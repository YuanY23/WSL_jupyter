const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertFileExists(relativePath) {
  assert.ok(fs.existsSync(path.join(root, relativePath)), `expected ${relativePath} to exist`);
}

function readAllTextFiles(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  assert.ok(fs.existsSync(absoluteDir), `expected ${relativeDir} to exist`);
  return fs
    .readdirSync(absoluteDir)
    .filter(file => file.endsWith('.js'))
    .map(file => fs.readFileSync(path.join(absoluteDir, file), 'utf8'))
    .join('\n');
}

function compact(text) {
  return text.replace(/\s+/g, '');
}

function sliceBetween(text, start, end) {
  const startIndex = text.indexOf(start);
  assert.notEqual(startIndex, -1, `expected to find ${start}`);
  const endIndex = text.indexOf(end, startIndex);
  assert.notEqual(endIndex, -1, `expected to find ${end}`);
  return text.slice(startIndex, endIndex);
}

const simulationIndex = read('jupyterlab-simulation-platform/src/index.ts');
const templateSelector = read('jupyterlab-simulation-platform/src/components/TemplateSelector.tsx');
const thermalIndex = read('jupyterlab-thermal-design/src/index.ts');
const thermalControlPanel = read('jupyterlab-thermal-design/src/components/ControlPanel.tsx');
const officialThermalIndex = read('jupyterlab-official-thermal-examples/src/index.ts');
const officialThermalApp = read('jupyterlab-official-thermal-examples/src/components/OfficialThermalExamplesApp.tsx');
const nbgraderIndex = read('nbgrader/src/index.ts');
const mainMenuSchema = JSON.parse(read('jupyterlab/packages/mainmenu-extension/schema/plugin.json'));
const hubConfig = read('jupyterhub_config.py');
const hubLoginTemplate = read('templates/native-login.html');
const hubSignupTemplate = read('templates/signup.html');
const hubSpawnPendingTemplate = read('templates/spawn_pending.html');
const hubHomeTemplate = read('templates/home.html');
const formgraderBaseTemplate = read('nbgrader/nbgrader/server_extensions/formgrader/templates/base.tpl');
const manageAssignmentsTemplate = read('nbgrader/nbgrader/server_extensions/formgrader/templates/manage_assignments.tpl');
const formgraderUtils = read('nbgrader/nbgrader/server_extensions/formgrader/static/js/utils.js');
const manageAssignmentsJs = read('nbgrader/nbgrader/server_extensions/formgrader/static/js/manage_assignments.js');
const gradebookNotebookSubmissionsJs = read('nbgrader/nbgrader/server_extensions/formgrader/static/js/gradebook_notebook_submissions.js');
const formgradeKeyboardManagerJs = read('nbgrader/nbgrader/server_extensions/formgrader/static/js/formgrade_keyboardmanager.js');
const validateAssignmentIndex = read('nbgrader/src/validate_assignment/index.ts');
const commonValidate = read('nbgrader/src/common/validate.ts');
const createAssignmentExtension = read('nbgrader/src/create_assignment/create_assignment_extension.ts');
const nbgraderLabextensionStatic = readAllTextFiles('nbgrader/nbgrader/labextension/static');
const simulationLabextensionStatic = readAllTextFiles('jupyterlab-simulation-platform/jupyterlab_simulation_platform/labextension/static');
const thermalLabextensionStatic = readAllTextFiles('jupyterlab-thermal-design/jupyterlab_thermal_design/labextension/static');
const officialThermalLabextensionStatic = readAllTextFiles('jupyterlab-official-thermal-examples/jupyterlab_official_thermal_examples/labextension/static');
const dockerfile = read('Dockerfile-nbgrader');
const applicationBaseCss = read('jupyterlab/packages/application-extension/style/base.css');
const fileIconSvg = read('jupyterlab/packages/ui-components/style/icons/filetype/file.svg');
const folderIconSvg = read('jupyterlab/packages/ui-components/style/icons/filetype/folder.svg');
const folderFavoriteIconSvg = read('jupyterlab/packages/ui-components/style/icons/filetype/folder-favorite.svg');

const mainMenuDefaults = mainMenuSchema['jupyter.lab.menus'].main;
function menuById(id) {
  const menu = mainMenuDefaults.find(item => item.id === id);
  assert.ok(menu, `expected ${id} menu to exist in main menu schema`);
  return menu;
}

assert.ok(simulationIndex.includes("category: '通用仿真平台'"));
assert.ok(simulationIndex.includes("label: '打开通用仿真平台'"));
assert.ok(simulationIndex.includes("content.title.label = '通用仿真平台'"));
assert.ok(simulationIndex.includes("widget.title.label = '通用仿真平台'"));
assert.ok(simulationIndex.includes("simulationMenu.title.label = '通用仿真平台'"));
assert.ok(simulationIndex.includes('mainMenu.addMenu(simulationMenu, true, { rank: 5 })'));
assert.ok(templateSelector.includes('>通用仿真平台</h2>'));
assert.equal(simulationIndex.includes("category: '仿真平台'"), false);
assert.equal(simulationIndex.includes("label: '仿真模板生成器'"), false);
assert.equal(simulationIndex.includes("content.title.label = '仿真模板生成器'"), false);
assert.equal(simulationIndex.includes("widget.title.label = '仿真模板生成器'"), false);
assert.equal(simulationIndex.includes("simulationMenu.title.label = '仿真平台'"), false);
assert.equal(templateSelector.includes('>仿真平台</h2>'), false);

assert.ok(thermalIndex.includes("label: '打开传热仿真平台'"));
assert.ok(thermalIndex.includes("content.title.label = '传热仿真平台'"));
assert.ok(thermalIndex.includes("widget.title.label = '传热仿真平台'"));
assert.ok(thermalIndex.includes("thermalMenu.title.label = '传热仿真平台'"));
assert.ok(thermalIndex.includes('mainMenu.addMenu(thermalMenu, true, { rank: 6 })'));
assert.ok(thermalControlPanel.includes('>传热仿真平台</p>'));
assert.ok(thermalControlPanel.includes('>传热仿真平台</h2>'));
assert.equal(thermalIndex.includes('热设计仿真系统'), false);
assert.equal(thermalIndex.includes('热设计原理仿真工作台'), false);
assert.equal(thermalControlPanel.includes('热设计平台'), false);
assert.equal(thermalControlPanel.includes('热设计原理仿真工作台'), false);

assert.ok(officialThermalIndex.includes("category: '官方热力建模示例'"));
assert.ok(officialThermalIndex.includes("label: '打开官方热力建模示例'"));
assert.ok(officialThermalIndex.includes("content.title.label = '官方热力建模示例'"));
assert.ok(officialThermalIndex.includes("widget.title.label = '官方热力建模示例'"));
assert.ok(officialThermalIndex.includes("officialMenu.title.label = '官方热力建模示例'"));
assert.ok(officialThermalIndex.includes('mainMenu.addMenu(officialMenu, true, { rank: 7 })'));
assert.ok(officialThermalApp.includes('>官方热力建模示例</p>'));
assert.ok(officialThermalApp.includes('>槽式太阳能光热发电集热-储热-发电联合过程</h2>'));

assert.ok(nbgraderIndex.includes("nbgraderMenu.title.label = '作业评测平台'"));
assert.ok(nbgraderIndex.includes('mainMenu.addMenu(nbgraderMenu, true, { rank: 8 })'));
assert.equal(nbgraderIndex.includes("nbgraderMenu.title.label = 'Nbgrader 评分系统'"), false);
assert.ok(nbgraderIndex.includes("panel.title.label = '创建作业'"));
assert.ok(nbgraderIndex.includes("panel.title.caption = '作业评测平台创建作业'"));
assert.equal(nbgraderIndex.includes("panel.title.label = 'Create Assignment'"), false);
assert.equal(nbgraderIndex.includes("panel.title.caption = 'Nbgrader Create Assignment'"), false);

assert.ok(nbgraderLabextensionStatic.includes("nbgraderMenu.title.label = '作业评测平台'"));
assert.ok(compact(nbgraderLabextensionStatic).includes('mainMenu.addMenu(nbgraderMenu,true,{rank:8})'));
assert.equal(nbgraderLabextensionStatic.includes("nbgraderMenu.title.label = 'Nbgrader 评分系统'"), false);
assert.equal(compact(nbgraderLabextensionStatic).includes('mainMenu.addMenu(nbgraderMenu);'), false);

assert.ok(compact(simulationLabextensionStatic).includes('mainMenu.addMenu(simulationMenu,true,{rank:5})'));
assert.equal(compact(simulationLabextensionStatic).includes('mainMenu.addMenu(simulationMenu);'), false);
assert.ok(compact(thermalLabextensionStatic).includes('mainMenu.addMenu(thermalMenu,true,{rank:6})'));
assert.equal(compact(thermalLabextensionStatic).includes('mainMenu.addMenu(thermalMenu);'), false);
assert.ok(compact(officialThermalLabextensionStatic).includes('mainMenu.addMenu(officialMenu,true,{rank:7})'));
assert.equal(compact(officialThermalLabextensionStatic).includes('mainMenu.addMenu(officialMenu);'), false);

assert.equal(menuById('jp-mainmenu-view').disabled, true);
assert.equal(menuById('jp-mainmenu-kernel').disabled, true);
assert.equal(menuById('jp-mainmenu-tabs').disabled, true);
assert.equal(menuById('jp-mainmenu-help').disabled, true);

assert.ok(hubConfig.includes('simlab_favicon_href'));
assert.ok(hubConfig.includes("'logo'"));
assert.ok(hubConfig.includes("'simlab-favicon.svg'"));
for (const template of [
  hubLoginTemplate,
  hubSignupTemplate,
  hubSpawnPendingTemplate,
  hubHomeTemplate
]) {
  assert.ok(template.includes('rel="icon"'));
  assert.ok(template.includes('simlab_favicon_href'));
}

assert.ok(formgraderBaseTemplate.includes('<title>作业评测平台</title>'));
assert.ok(formgraderBaseTemplate.includes('<h1>作业评测平台</h1>'));
assert.equal(formgraderBaseTemplate.includes('<h1>nbgrader</h1>'), false);
assert.equal(formgraderBaseTemplate.includes('jupyter-logo'), false);

assert.ok(manageAssignmentsTemplate.includes('作业管理'));
assert.equal(manageAssignmentsTemplate.includes('Manage Assignments'), false);
assert.equal(manageAssignmentsTemplate.includes('Assignments</li>'), false);
assert.equal(manageAssignmentsTemplate.includes('JupyterHub only'), false);
assert.equal(manageAssignmentsTemplate.includes('Windows operating system detected'), false);

assert.ok(formgraderUtils.includes('search: "搜索："'));
assert.ok(formgraderUtils.includes('emptyTable: "表中无可用数据"'));
assert.ok(formgraderUtils.includes('.attr("aria-label", "关闭")'));
assert.equal(formgraderUtils.includes('Search:'), false);
assert.equal(formgraderUtils.includes('No data available in table'), false);
assert.equal(formgraderUtils.includes('.attr("aria-label", "Close")'), false);

assert.ok(manageAssignmentsJs.includes('协调世界时偏移（可选）'));
assert.equal(manageAssignmentsJs.includes('时区偏移UTC（可选）'), false);

assert.ok(gradebookNotebookSubmissionsJs.includes('.text("提交 #"'));
assert.ok(gradebookNotebookSubmissionsJs.includes('title: "显示学生姓名"'));
assert.ok(gradebookNotebookSubmissionsJs.includes('title: "隐藏学生姓名"'));
assert.equal(gradebookNotebookSubmissionsJs.includes('Submission #'), false);
assert.equal(gradebookNotebookSubmissionsJs.includes('Show student name'), false);
assert.equal(gradebookNotebookSubmissionsJs.includes('Hide student name'), false);

assert.ok(formgradeKeyboardManagerJs.includes('.attr("aria-label", "关闭")'));
assert.equal(formgradeKeyboardManagerJs.includes('.attr("aria-label", "Close")'), false);

assert.ok(validateAssignmentIndex.includes("label: '验证作业'"));
assert.ok(validateAssignmentIndex.includes("tooltip: '验证作业'"));
assert.ok(validateAssignmentIndex.includes("this.setButtonLabel('保存中...')"));
assert.ok(validateAssignmentIndex.includes("this.setButtonLabel('验证中...')"));
assert.equal(validateAssignmentIndex.includes("label: 'Validate'"), false);
assert.equal(validateAssignmentIndex.includes('Validate Assignment'), false);
assert.equal(validateAssignmentIndex.includes('Saving...'), false);
assert.equal(validateAssignmentIndex.includes('Validating...'), false);

assert.ok(commonValidate.includes('验证结果'));
assert.ok(commonValidate.includes('验证通过！该笔记本通过了全部测试。'));
assert.equal(commonValidate.includes('Validation Results'), false);
assert.equal(commonValidate.includes('Success! Your notebook passes all the tests.'), false);
assert.equal(commonValidate.includes('There was an error running the validate command:'), false);

assert.ok(createAssignmentExtension.includes("listElement.title = '学生修改将被覆盖'"));
assert.equal(createAssignmentExtension.includes('Student changes will be overwritten'), false);

assert.ok(dockerfile.includes('WORKDIR /src/nbgrader'));
assert.ok(dockerfile.includes('jlpm run build && \\\n    jupyter labextension develop . --overwrite'));
assert.ok(dockerfile.includes('grep -R "作业评测平台" /src/nbgrader/nbgrader/labextension/static/*.js'));
assert.ok(dockerfile.includes('grep -R "mainMenu.addMenu(nbgraderMenu, true, { rank: 8 })" /src/nbgrader/nbgrader/labextension/static/*.js'));
assert.ok(dockerfile.includes('simlab-folder.svg'));
assert.ok(dockerfile.includes('simlab-file.svg'));
const nbgraderDockerSection = sliceBetween(
  dockerfile,
  '# Install custom nbgrader',
  '# Install thermal design plugin'
);
assert.ok(nbgraderDockerSection.includes('WORKDIR /src/nbgrader'));
assert.ok(nbgraderDockerSection.includes('jlpm run build && \\\n    jupyter labextension develop . --overwrite'));

assert.ok(hubConfig.includes('SIMLAB_DEV_MOUNTS'));
assert.ok(hubConfig.includes("if os.environ.get('SIMLAB_DEV_MOUNTS') == '1':"));
assert.ok(hubConfig.includes('dev_source_volumes'));

assertFileExists('logo/simlab-folder.svg');
assertFileExists('logo/simlab-folder-favorite.svg');
assertFileExists('logo/simlab-file.svg');
assert.ok(fileIconSvg.includes('simlab-file-grad'));
assert.ok(folderIconSvg.includes('simlab-folder-grad'));
assert.ok(folderFavoriteIconSvg.includes('simlab-folder-favorite-grad'));

assert.ok(applicationBaseCss.includes('visibility: visible'));
assert.ok(applicationBaseCss.includes('opacity: 1'));
assert.ok(applicationBaseCss.includes('#jp-MainLogo button'));

assert.equal(nbgraderLabextensionStatic.includes('Validate Assignment'), false);
assert.equal(nbgraderLabextensionStatic.includes('Saving...'), false);
assert.equal(nbgraderLabextensionStatic.includes('Validating...'), false);
assert.equal(nbgraderLabextensionStatic.includes('Validation Results'), false);
assert.equal(nbgraderLabextensionStatic.includes('Success! Your notebook passes all the tests.'), false);
assert.equal(nbgraderLabextensionStatic.includes('There was an error running the validate command:'), false);
assert.equal(nbgraderLabextensionStatic.includes('Student changes will be overwritten'), false);

console.log('ui label tests passed');
