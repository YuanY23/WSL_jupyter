# 5月20日 Gemini 项目内容总结

本项目是一个面向教学与科研实验场景的**可执行代码/白箱式热力仿真系统与教学管理集成平台**。它没有采用传统的“黑箱式”GUI仿真工具（即用户只输入参数、点击按钮并直接获取结果），而是将**热力学建模、数值求解、求解代码展示、结果可视化以及教学作业管理**完全贯通，通过自动生成可运行、可二次修改的 Jupyter Notebook，使学生和科研人员能够直观理解“物理对象 — 数学方程 — 计算程序 — 仿真结果”的完整全景。

---

## 1. 项目的核心定位与设计理念

*   **白箱化仿真 (White-box Simulation)**：传统的仿真软件将求解逻辑封装在底层（黑箱），本项目通过前端 React 可视化面板收集参数，动态生成包含完整物理方程公式、数值离散方法说明以及 Python 求解代码的 Jupyter Notebook 单元格。用户不仅能得到图像结果，还能直接在 Notebook 中阅读、运行和修改底层计算代码。
*   **多开源框架融合 (Multi-framework Integration)**：项目并非从零开发单体 Web 应用，而是将 **JupyterHub + DockerSpawner + JupyterLab + nbgrader** 与**自研业务扩展插件**进行深度的工程化打包与集成。
*   **角色化与多课程支持 (Role-based & Multi-course Multi-tenant)**：通过对接 JupyterHub 的 ORM 分组机制，系统在注册、容器启动、目录挂载、前端扩展展示等各个维度实现了教师与学生角色的隔离，并支持一站式管理多门课程的作业分发与评分。

---

## 2. 系统技术架构与核心分层

系统在运行时采用的是**“宿主机管理管控层 + 容器化用户执行层”**的分布式架构，整体可以分为以下五个层级：

```text
                     【 用户交互与登录门户 】
         浏览器 (登录/注册/控制面板/JupyterLab IDE)
                           │
                           ▼
                 ConfigurableHTTPProxy
                           │
                           ▼
【 宿主机管控层 】     JupyterHub 进程 (Hub Core)
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   自定义认证器       内置数据库 (sqlite)   DockerSpawner
(Custom Native Auth)    (角色与分组数据)    (容器生命周期)
          │                                 │
          └───────────────┬─────────────────┘
                          │ 动态创建/挂载/注入
                          ▼
【 容器执行层 】      单用户 Docker 容器
                          │
      ┌───────────────────┼───────────────────┐
      ▼                   ▼                   ▼
Jupyter Server       JupyterLab 4.x       nbgrader
(扩展路由/API)     (IDE核心/插件宿主)   (作业流转/评分)
      │                   │                   │
      ▼                   ▼                   ▼
 Python Kernel     自研仿真扩展组件     中文化与权限裁剪
(NumPy/SciPy/Numba) (热设计/仿真平台)    (学生端功能隐藏)
```

### 2.1 JupyterHub 层 (管控面)
*   **职责**：负责用户身份认证、用户注册、多课程分组关系维护、用户角色权限控制（RBAC）以及用户容器的调度与启动。
*   **关键定制文件**：
    *   [jupyterhub_config.py](file:///home/yuan/my_project/jupyterhub_config.py)：JupyterHub 的全局配置文件，定义了自定义 Authenticator、DockerSpawner、RBAC 角色授权（赋予教师组组管理等 scoped 权限）、模板路径和超时参数等。
    *   [custom_authenticator.py](file:///home/yuan/my_project/custom_authenticator.py)：继承自 `NativeAuthenticator`，定制了注册 Handler。在注册时允许用户选择角色（教师/学生）并输入课程 ID (`course_id`)。在用户创建后，自动将其划分至对应的 JupyterHub 组（如教师加入 `formgrade-{course_id}` 和 `teachers`，学生加入 `nbgrader-{course_id}`）。
    *   `templates/`：定制了登录页 (`native-login.html`)、注册页 (`signup.html`)、控制面板主页 (`home.html`) 和启动等待页 (`spawn_pending.html`)，使平台视觉更加品牌化、教学化。

### 2.2 DockerSpawner 层 (资源隔离与调度)
*   **职责**：当用户在 JupyterHub 登录成功后，DockerSpawner 在宿主机上动态为该用户拉取并启动一个独立的 Docker 容器 (`my_jupyterhub:latest`)。
*   **挂载与注入策略 (pre_spawn_hook)**：
    *   **通用挂载**：所有用户容器均挂载 `jupyterhub-user-{username}` 实现个人家目录持久化，并挂载 `/srv/nbgrader/exchange` 共享交换目录用于作业分发与提交。
    *   **教师挂载与注入**：
        *   在宿主机动态创建并挂载课程根目录 `/home/yuan/my_project/courses/{course_id}` 到容器内的 `/home/jovyan/{course_id}`。
        *   注入环境变量 `NBGRADER_COURSE_ID={course_id}`。
        *   注入管理员级别的 `NBGRADER_ADMIN_API_TOKEN`，使教师容器内的评分服务能够反向调用 Hub API 进行学生分组的自动增删。

### 2.3 JupyterLab 平台层 (前端交互宿主)
*   **职责**：在单用户容器内运行，为用户提供浏览器端的交互式 IDE。
*   **深度定制**：
    *   **源码引入**：直接把 JupyterLab 官方源码副本 [jupyterlab/](file:///home/yuan/my_project/jupyterlab) 放入项目，实现了在源码级替换品牌资源（将官方 Logo 替换为黄色“Y”字 Logo）、定制静态资源、覆盖默认设置（如默认启用中文语言包、禁用插件管理器和目录树）以及对主题 CSS 进行注入兜底。
    *   **角色化裁剪**：通过容器启动脚本 [disable_teacher_extensions.sh](file:///home/yuan/my_project/disable_teacher_extensions.sh)，当检测到当前为学生容器时，自动在 `page_config.json` 中配置禁用教师端专属的扩展（如 `@jupyter/nbgrader:formgrader` 和 `@jupyter/nbgrader:create-assignment`），从前后端两层确保学生无法接触评分和建档逻辑。

### 2.4 nbgrader 教学流程层 (教学业务骨架)
*   **职责**：实现课程目录规范、作业生命周期管理（发布、下载、完成、提交、收集、自动评分、手动批改和反馈发送）。
*   **关键定制**：
    *   [nbgrader/](file:///home/yuan/my_project/nbgrader) 官方源码的副本，在本项目中进行了二次开发：
        *   **认证同步绑定**：修改了认证插件 `JupyterHubAuthPlugin`，使其直接读取 JupyterHub 的 group 信息来判断用户的课程可见性与权限。
        *   **反向同步 Hub 组**：当教师在 nbgrader 的 Formgrader 管理页面添加学生时，后端会通过 API 反向在宿主机的 JupyterHub 中将该学生加入对应的 `nbgrader-{course_id}` 组。
        *   **中文化本地定制**：对所有 nbgrader 的前端插件、菜单名称、作业列表模板进行了彻底的简体中文汉化。

---

## 3. 自研核心业务扩展 (仿真求解与 Notebook 生成器)

项目内置了两个高价值的自研 JupyterLab 扩展插件，实现了将仿真业务与 Notebook 环境的无缝接合：

### 3.1 热设计原理仿真插件 (`jupyterlab-thermal-design`)
*   **定位**：针对热物理与传热学典型场景的专业级仿真验证工具。
*   **代码结构**：
    *   [setup.py](file:///home/yuan/my_project/jupyterlab-thermal-design/setup.py) / `package.json`：Python 后端与 JS 前端的打包配置文件。
    *   `src/`：TypeScript/React 前端代码，在 JupyterLab 顶部注册“热设计仿真系统”菜单。
    *   `src/components/ControlPanel.tsx`：前端 React 参数配置面板，内置了 4 大类（稳态导热、瞬态导热、对流换热、热辐射）共 14 个物理仿真场景的默认参数、上下限验证及单位展示。
    *   `src/utils/NotebookGenerator.ts`：Notebook 生成核心逻辑。当用户点击“执行”时，前端直接构建包含数学公式、物性、网格离散及数值求解代码的 `.ipynb` 结构体，通过 `ContentsManager` 将其保存到容器内的 `仿真结果归档/` 目录并用 `docmanager` 自动打开。
    *   `thermal_solver/`：Python 编写的物理数值求解器。提供了各类稳态、瞬态、辐射等传热问题的高性能计算函数（例如一维稳态平板导热、多层平板导热、圆筒壁导热、肋片传热等），并作为算法沉淀为未来的 Kernel 直接调用奠定基础。

### 3.2 仿真模板生成器 (`jupyterlab-simulation-platform`)
*   **定位**：一个更具通用性、以模板为导向的白箱式 Notebook 生成器。
*   **模板库注册 (`src/templates/registry.ts`)**：
    1.  **代数方程/经验公式 (algebraic-formula)**：例如“光伏组件输出功率计算”，支持参数扫描和多曲线图/柱状图输出。
    2.  **一阶动态系统 (first-order-dynamic)**：例如“储能 SOC 一阶动态仿真”，展示一阶常微分方程的显式欧拉离散。
    3.  **二阶动态系统 (second-order-dynamic)**：例如“弹簧质量阻尼系统响应”，模拟经典机械振动方程响应。
    4.  **线性方程组/网络平衡 (linear-system)**：例如“三节点网络平衡求解”，组装矩阵并调用 `np.linalg.solve` 求解。
    5.  **一维传热/扩散 (one-dimensional-transfer)**：提供一维稳态或瞬态的有限差分温度场数值计算模板。
    6.  **时序能量平衡 (time-series-energy-balance)**：模拟“光伏-储能-负荷”逐时能量流动和充放电状态更新规则。
    7.  **简单优化调度 (optimization-dispatch)**：利用线性规划求解多时段在分时电价下的储能充放电与购电成本优化调度。
*   **工作流**：在前端 React 面板选择模板 -> 输入物理问题描述与假设 -> 自定义变量、矩阵、控制方程或时序序列 -> 校验参数完整性与维度冲突 -> 生成对应的 Notebook 并自动打开。

---

## 4. 平台集成与数据流向

系统在运行时，主要靠以下三条“统一数据/身份主线”保持闭环：

| 统一主线 | 宿主机/Hub 表现 | 容器内表现 | 业务流转作用 |
| :--- | :--- | :--- | :--- |
| **身份与角色主线** | 宿主机 ORM 存在 `teachers` 组；<br>以及 `formgrade-{course_id}` / `nbgrader-{course_id}` 等组。 | 学生容器自动禁用教师端插件；<br>教师容器注入 `NBGRADER_ADMIN_API_TOKEN`。 | 决定了用户在 IDE 中的功能完整性，并防范越权行为。 |
| **课程与关联主线** | `course_id` 驱动课程组命名与宿主机课程文件夹 `/courses/{course_id}` 的物理隔离。 | 教师容器中映射 `NBGRADER_COURSE_ID`，固定 `c.CourseDirectory.course_id`。 | 使得一套多租户 Jupyter 实例可以并行承载多门课程的教学与作业。 |
| **文件与数据主线** | `/srv/nbgrader/exchange` 共享交换目录；<br>多课程的物理存储根目录 `courses/`。 | 教师读写 `/home/jovyan/{course_id}` 下的 `source` / `release` 等目录；<br>学生通过 `assignment-list` 读写 `/home/jovyan` 的作业文件。 | 提供了“教师发布作业 -> 学生拉取并运行 -> 学生提交 -> 教师收集并评分”的物理通路。 |

---

## 5. 项目镜像构建与部署说明 (`Dockerfile-nbgrader`)

项目的所有底层运行环境（单用户工作台环境）均打包在 [Dockerfile-nbgrader](file:///home/yuan/my_project/Dockerfile-nbgrader) 中。构建和部署时的关键动作包括：

1.  **依赖安装**：安装核心环境（Ubuntu 22.04 + Node.js 18 + NPM + 简体中文中文字体 `fonts-wqy-zenhei`），并通过清华 PyPI 镜像安装 Python 库，包含 `jupyterlab==4.2.7`、`jupyterhub`、数值计算库（`numpy`、`scipy`、`matplotlib`、`numba`）等。
2.  **前端及插件编译安装**：
    *   以可编辑模式（`pip install -e .`）安装项目内的自定义 [jupyterlab](file:///home/yuan/my_project/jupyterlab) 及 [nbgrader](file:///home/yuan/my_project/nbgrader)。
    *   以开发模式编译并链接自研插件 [jupyterlab-thermal-design](file:///home/yuan/my_project/jupyterlab-thermal-design) 和 [jupyterlab-simulation-platform](file:///home/yuan/my_project/jupyterlab-simulation-platform)。
3.  **视觉覆写与构建**：
    *   在构建前复制自研的 SVG 矢量图，替换官方默认的 Jupyter 标识。
    *   执行 `jupyter lab build` 彻底重新打包前端资源。
    *   向 JupyterLab 主题 index.css 文件追加样式，强制将页面主 logo 替换为带有渐变黄色背景的“Y”字母标识。
    *   生成默认配置 `overrides.json`，将容器内默认语言锁死为 `zh_CN` (中文简体)。

---

## 6. PPT 答辩内容与演示资产

项目文件夹下包含了相关的学术/技术汇报 PPTX 资产及生成脚本：
*   **生成脚本**：[create_midterm_6slides.py](file:///home/yuan/my_project/create_midterm_6slides.py) 使用 `python-pptx` 库动态组装包含排版、图形和逻辑块的答辩幻灯片，最终输出为 [中期答辩-6页修改.pptx](file:///home/yuan/my_project/中期答辩-6页修改.pptx)。
*   **答辩主题**：围绕**“显示计算代码的热力仿真系统总体研究框架”**，将物理传热问题建模（导热、对流、辐射）、一维稳态导热的有限差分数值求解（组装系数矩阵 $[A]\{T\} = \{b\}$ 与 Python 求解代码）、以及基于 Jupyter 体系的实验教学管理和自动评分评价机制做了全面的科学汇报展示。

---

## 7. 总结

本项目是一个极具工程实践水平的**教学仿真一体化平台**。它突破了传统仿真系统“重结果、轻过程”的黑箱局限，利用 JupyterLab 的插件扩展性在最上层提供了极佳的白箱化交互式公式配置与仿真 Notebook 生成面板，在中间层依靠 JupyterHub 和 DockerSpawner 实现了企业级的多租户安全隔离、目录动态映射以及自动的分组认证，在底层通过定制 nbgrader 跑通了课程作业的发布和闭环评测流。这一套系统兼顾了教学的易用性与专业物理求解的高校学术水准。
