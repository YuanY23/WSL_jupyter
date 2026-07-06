import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { TrainingApiClient } from '../api/client';
import { TrainingCourse, TrainingSection, TutorialSummary } from '../api/types';

interface AdminManagerProps {
  api: TrainingApiClient;
}

interface UploadState {
  title: string;
  notebookFilename: string;
  description: string;
  versionLabel: string;
  importNote: string;
  publishNow: boolean;
  notebook: Record<string, unknown> | null;
  sourceFilename: string;
}

interface CourseDraft {
  title: string;
  description: string;
  status: string;
}

interface SectionDraft {
  title: string;
  description: string;
  status: string;
}

interface TutorialDraft {
  title: string;
  notebookFilename: string;
  description: string;
  status: string;
  sectionId: string;
  sortOrder: number;
  commentsLocked: boolean;
}

const initialUploadState: UploadState = {
  title: '',
  notebookFilename: '',
  description: '',
  versionLabel: '1.0',
  importNote: '',
  publishNow: true,
  notebook: null,
  sourceFilename: ''
};

export function AdminManager(props: AdminManagerProps): React.ReactElement {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>('');
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [activeTutorialId, setActiveTutorialId] = useState<string>('');
  const [newCourseTitle, setNewCourseTitle] = useState<string>('');
  const [newSectionTitle, setNewSectionTitle] = useState<string>('');
  const [uploadState, setUploadState] = useState<UploadState>(initialUploadState);
  const [courseDraft, setCourseDraft] = useState<CourseDraft>({ title: '', description: '', status: 'published' });
  const [sectionDraft, setSectionDraft] = useState<SectionDraft>({ title: '', description: '', status: 'published' });
  const [tutorialDraft, setTutorialDraft] = useState<TutorialDraft>({
    title: '',
    notebookFilename: '',
    description: '',
    status: 'published',
    sectionId: '',
    sortOrder: 0,
    commentsLocked: false
  });
  const [status, setStatus] = useState<string>('正在加载课程管理数据...');
  const [busyAction, setBusyAction] = useState<string>('');

  useEffect(() => {
    void refresh();
  }, []);

  const activeCourse = useMemo(
    () => courses.find(course => course.id === activeCourseId) ?? courses[0] ?? null,
    [courses, activeCourseId]
  );
  const activeSection = useMemo(
    () => activeCourse?.sections.find(section => section.id === activeSectionId) ?? activeCourse?.sections[0] ?? null,
    [activeCourse, activeSectionId]
  );
  const activeTutorial = useMemo(
    () => activeSection?.tutorials.find(tutorial => tutorial.public_id === activeTutorialId) ?? null,
    [activeSection, activeTutorialId]
  );
  const allSections = useMemo(
    () => courses.reduce<Array<{ course: TrainingCourse; section: TrainingSection }>>((items, course) => {
      course.sections.forEach((section: TrainingSection) => {
        items.push({ course, section });
      });
      return items;
    }, []),
    [courses]
  );

  useEffect(() => {
    if (!activeCourse) {
      setActiveSectionId('');
      return;
    }
    if (!activeCourse.sections.some(section => section.id === activeSectionId)) {
      setActiveSectionId(activeCourse.sections[0]?.id ?? '');
    }
  }, [activeCourse, activeSectionId]);

  useEffect(() => {
    if (!activeSection) {
      setActiveTutorialId('');
      return;
    }
    if (activeTutorialId && !activeSection.tutorials.some(tutorial => tutorial.public_id === activeTutorialId)) {
      setActiveTutorialId('');
    }
  }, [activeSection, activeTutorialId]);

  useEffect(() => {
    setCourseDraft({
      title: activeCourse?.title ?? '',
      description: activeCourse?.description ?? '',
      status: activeCourse?.status ?? 'published'
    });
  }, [activeCourse]);

  useEffect(() => {
    setSectionDraft({
      title: activeSection?.title ?? '',
      description: activeSection?.description ?? '',
      status: activeSection?.status ?? 'published'
    });
  }, [activeSection]);

  useEffect(() => {
    setTutorialDraft({
      title: activeTutorial?.title ?? '',
      notebookFilename: activeTutorial?.notebook_filename ?? '',
      description: activeTutorial?.description ?? '',
      status: activeTutorial?.status ?? 'published',
      sectionId: activeTutorial?.section_id ?? activeSection?.id ?? '',
      sortOrder: activeTutorial?.sort_order ?? 0,
      commentsLocked: activeTutorial?.comments_locked ?? false
    });
  }, [activeTutorial, activeSection]);

  async function runAction(action: string, work: () => Promise<void>): Promise<void> {
    setBusyAction(action);
    setStatus('');
    try {
      await work();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyAction('');
    }
  }

  async function refresh(): Promise<void> {
    try {
      const nextCourses = await props.api.adminGetCourses();
      setCourses(nextCourses);
      setActiveCourseId(current => nextCourses.find(course => course.id === current)?.id ?? nextCourses[0]?.id ?? '');
      setStatus(nextCourses.length ? '' : '暂无课程，请先创建一个课程。');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function createCourse(): Promise<void> {
    const title = newCourseTitle.trim();
    if (!title) {
      setStatus('课程名称不能为空。');
      return;
    }
    await runAction('create-course', async () => {
      const course = await props.api.adminCreateCourse({ title, description: '', sort_order: courses.length + 1 });
      setNewCourseTitle('');
      setActiveCourseId(course.id);
      await refresh();
      setStatus('课程已创建。');
    });
  }

  async function createSection(): Promise<void> {
    const title = newSectionTitle.trim();
    if (!activeCourse || !title) {
      setStatus('请选择课程并填写章节名称。');
      return;
    }
    await runAction('create-section', async () => {
      const section = await props.api.adminCreateSection({
        course_id: activeCourse.id,
        title,
        description: '',
        sort_order: activeCourse.sections.length + 1
      });
      setNewSectionTitle('');
      setActiveSectionId(section.id);
      await refresh();
      setStatus('章节已创建。');
    });
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const notebook = JSON.parse(text) as Record<string, unknown>;
      const baseTitle = file.name.replace(/\.ipynb$/i, '');
      setUploadState(current => ({
        ...current,
        notebook,
        sourceFilename: file.name,
        title: current.title || baseTitle,
        notebookFilename: current.notebookFilename || file.name
      }));
      setStatus(`已选择 ${file.name}`);
    } catch (error) {
      setStatus(error instanceof Error ? `Notebook 解析失败：${error.message}` : 'Notebook 解析失败。');
    }
  }

  function importPayload(): {
    course_id: string;
    section_id: string;
    title: string;
    notebook_filename: string;
    description: string;
    sort_order: number;
    version_label: string;
    import_note: string;
    notebook_json: Record<string, unknown>;
    publish_now: boolean;
  } | null {
    if (!activeCourse || !activeSection) {
      setStatus('请先选择课程和章节。');
      return null;
    }
    if (!uploadState.notebook) {
      setStatus('请先选择 .ipynb 文件。');
      return null;
    }
    const title = uploadState.title.trim();
    if (!title) {
      setStatus('教程标题不能为空。');
      return null;
    }
    return {
      course_id: activeCourse.id,
      section_id: activeSection.id,
      title,
      notebook_filename: uploadState.notebookFilename.trim() || `${title}.ipynb`,
      description: uploadState.description,
      sort_order: activeSection.tutorials.length + 1,
      version_label: uploadState.versionLabel.trim() || '1.0',
      import_note: uploadState.importNote,
      notebook_json: uploadState.notebook,
      publish_now: uploadState.publishNow
    };
  }

  async function uploadNewTutorial(): Promise<void> {
    const payload = importPayload();
    if (!payload) {
      return;
    }
    await runAction('upload-new', async () => {
      const tutorial = await props.api.adminImportTutorial(payload);
      setUploadState(initialUploadState);
      setActiveTutorialId(tutorial.public_id);
      await refresh();
      setStatus('教程已上传。');
    });
  }

  async function replaceSelectedTutorial(): Promise<void> {
    if (!activeTutorial) {
      setStatus('请先在中间列表选择要替换的教程。');
      return;
    }
    const payload = importPayload();
    if (!payload) {
      return;
    }
    await runAction('replace-tutorial', async () => {
      await props.api.adminUpdateTutorialVersion(activeTutorial.public_id, {
        ...payload,
        course_id: activeTutorial.course_id ?? activeCourse?.id ?? payload.course_id,
        section_id: activeTutorial.section_id ?? activeSection?.id ?? payload.section_id,
        title: activeTutorial.title,
        description: activeTutorial.description,
        sort_order: activeTutorial.sort_order,
        publish_now: activeTutorial.status !== 'draft'
      });
      setUploadState(initialUploadState);
      await refresh();
      setStatus('教程文件已替换为新版本。');
    });
  }

  async function saveCourse(): Promise<void> {
    if (!activeCourse || !courseDraft.title.trim()) {
      setStatus('课程名称不能为空。');
      return;
    }
    await runAction('save-course', async () => {
      await props.api.adminPatchCourse(activeCourse.id, {
        title: courseDraft.title,
        description: courseDraft.description,
        status: courseDraft.status
      });
      await refresh();
      setStatus('课程信息已保存。');
    });
  }

  async function archiveCourse(): Promise<void> {
    if (!activeCourse || !window.confirm(`删除课程“${activeCourse.title}”？该课程下的章节和教程都会隐藏。`)) {
      return;
    }
    await runAction('archive-course', async () => {
      await props.api.adminArchiveCourse(activeCourse.id);
      setActiveCourseId('');
      await refresh();
      setStatus('课程已删除。');
    });
  }

  async function saveSection(): Promise<void> {
    if (!activeSection || !sectionDraft.title.trim()) {
      setStatus('章节名称不能为空。');
      return;
    }
    await runAction('save-section', async () => {
      await props.api.adminPatchSection(activeSection.id, {
        title: sectionDraft.title,
        description: sectionDraft.description,
        status: sectionDraft.status
      });
      await refresh();
      setStatus('章节信息已保存。');
    });
  }

  async function archiveSection(): Promise<void> {
    if (!activeSection || !window.confirm(`删除章节“${activeSection.title}”？该章节下的教程都会隐藏。`)) {
      return;
    }
    await runAction('archive-section', async () => {
      await props.api.adminArchiveSection(activeSection.id);
      setActiveSectionId('');
      await refresh();
      setStatus('章节已删除。');
    });
  }

  async function saveTutorial(): Promise<void> {
    if (!activeTutorial || !tutorialDraft.title.trim()) {
      setStatus('教程标题不能为空。');
      return;
    }
    const target = allSections.find(item => item.section.id === tutorialDraft.sectionId);
    await runAction('save-tutorial', async () => {
      await props.api.adminPatchTutorial(activeTutorial.public_id, {
        course_id: target?.course.id,
        section_id: tutorialDraft.sectionId,
        title: tutorialDraft.title,
        notebook_filename: tutorialDraft.notebookFilename,
        description: tutorialDraft.description,
        sort_order: tutorialDraft.sortOrder,
        status: tutorialDraft.status,
        comments_locked: tutorialDraft.commentsLocked
      });
      if (target?.course.id) {
        setActiveCourseId(target.course.id);
      }
      setActiveSectionId(tutorialDraft.sectionId);
      await refresh();
      setStatus('教程信息已保存。');
    });
  }

  async function archiveTutorial(): Promise<void> {
    if (!activeTutorial || !window.confirm(`删除教程“${activeTutorial.title}”？`)) {
      return;
    }
    await runAction('archive-tutorial', async () => {
      await props.api.adminArchiveTutorial(activeTutorial.public_id);
      setActiveTutorialId('');
      await refresh();
      setStatus('教程已删除。');
    });
  }

  return (
    <div className="training-platform admin-manager training-admin-workbench">
      <aside className="training-sidebar training-course-rail">
        <div className="training-sidebar-title">课程</div>
        <div className="training-rail-create">
          <input
            value={newCourseTitle}
            onChange={event => setNewCourseTitle(event.target.value)}
            placeholder="新课程名称"
          />
          <button className="training-button primary" disabled={busyAction === 'create-course'} onClick={createCourse}>
            新建
          </button>
        </div>
        <div className="training-course-list">
          {courses.map(course => (
            <button
              className={course.id === activeCourse?.id ? 'training-nav-item active' : 'training-nav-item'}
              key={course.id}
              onClick={() => {
                setActiveCourseId(course.id);
                setActiveTutorialId('');
              }}
            >
              <span>{course.title}</span>
              <b>{countTutorials(course)}</b>
            </button>
          ))}
        </div>
      </aside>
      <main className="training-main training-admin-main">
        <header className="training-header training-admin-header">
          <div>
            <h2>课程管理</h2>
            <p>{activeCourse?.title ?? '创建课程后即可管理章节和教程文件。'}</p>
          </div>
          <button className="training-button" onClick={refresh}>刷新</button>
        </header>
        {status && <div className="training-status">{status}</div>}
        <div className="training-admin-layout">
          <section className="training-admin-column">
            <UploadPanel
              activeSection={activeSection}
              activeTutorial={activeTutorial}
              busyAction={busyAction}
              uploadState={uploadState}
              onFile={handleFile}
              onUploadChange={setUploadState}
              onUploadNew={uploadNewTutorial}
              onReplace={replaceSelectedTutorial}
            />
            <section className="training-admin-band training-structure-band">
              <div className="training-panel-heading">
                <h3>章节与教程</h3>
                <div className="training-inline-compact">
                  <input
                    value={newSectionTitle}
                    onChange={event => setNewSectionTitle(event.target.value)}
                    placeholder="新章节名称"
                  />
                  <button
                    className="training-button primary"
                    disabled={!activeCourse || busyAction === 'create-section'}
                    onClick={createSection}
                  >
                    新建章节
                  </button>
                </div>
              </div>
              {!activeCourse && <div className="training-empty">请先创建课程。</div>}
              {activeCourse?.sections.length === 0 && <div className="training-empty">该课程暂无章节。</div>}
              {activeCourse?.sections.map(section => (
                <section
                  className={section.id === activeSection?.id ? 'training-section-card active' : 'training-section-card'}
                  key={section.id}
                >
                  <button
                    className="training-section-card-head"
                    onClick={() => {
                      setActiveSectionId(section.id);
                      setActiveTutorialId('');
                    }}
                  >
                    <span>{section.title}</span>
                    <b>{section.tutorials.length}</b>
                  </button>
                  <div className="training-admin-tutorial-list">
                    {section.tutorials.length === 0 && <div className="training-empty compact">暂无教程</div>}
                    {section.tutorials.map(tutorial => (
                      <button
                        className={tutorial.public_id === activeTutorial?.public_id ? 'training-admin-tutorial active' : 'training-admin-tutorial'}
                        key={tutorial.public_id}
                        onClick={() => {
                          setActiveSectionId(section.id);
                          setActiveTutorialId(tutorial.public_id);
                        }}
                      >
                        <span>
                          <strong>{tutorial.title}</strong>
                          <em>{tutorial.notebook_filename || `${tutorial.sort_order}-${tutorial.title}.ipynb`}</em>
                        </span>
                        <StatusBadge status={tutorial.status ?? 'published'} />
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </section>
          </section>
          <InspectorPanel
            activeCourse={activeCourse}
            activeSection={activeSection}
            activeTutorial={activeTutorial}
            allSections={allSections}
            busyAction={busyAction}
            courseDraft={courseDraft}
            sectionDraft={sectionDraft}
            tutorialDraft={tutorialDraft}
            setCourseDraft={setCourseDraft}
            setSectionDraft={setSectionDraft}
            setTutorialDraft={setTutorialDraft}
            saveCourse={saveCourse}
            saveSection={saveSection}
            saveTutorial={saveTutorial}
            archiveCourse={archiveCourse}
            archiveSection={archiveSection}
            archiveTutorial={archiveTutorial}
          />
        </div>
      </main>
    </div>
  );
}

function UploadPanel(props: {
  activeSection: TrainingSection | null;
  activeTutorial: TutorialSummary | null;
  busyAction: string;
  uploadState: UploadState;
  onFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onUploadChange: (state: UploadState) => void;
  onUploadNew: () => Promise<void>;
  onReplace: () => Promise<void>;
}): React.ReactElement {
  const { uploadState } = props;
  return (
    <section className="training-admin-band training-upload-band">
      <div className="training-panel-heading">
        <div>
          <h3>上传教程文件</h3>
          <p>{props.activeSection ? `目标章节：${props.activeSection.title}` : '请先选择目标章节'}</p>
        </div>
        {uploadState.sourceFilename && <span className="training-file-chip">{uploadState.sourceFilename}</span>}
      </div>
      <div className="training-upload-grid">
        <input type="file" accept=".ipynb,application/json" onChange={props.onFile} />
        <input
          value={uploadState.title}
          onChange={event => props.onUploadChange({ ...uploadState, title: event.target.value })}
          placeholder="展示标题"
        />
        <input
          value={uploadState.notebookFilename}
          onChange={event => props.onUploadChange({ ...uploadState, notebookFilename: event.target.value })}
          placeholder="Notebook 文件名，如 1-1.ipynb"
        />
        <input
          value={uploadState.versionLabel}
          onChange={event => props.onUploadChange({ ...uploadState, versionLabel: event.target.value })}
          placeholder="版本号"
        />
      </div>
      <textarea
        value={uploadState.description}
        onChange={event => props.onUploadChange({ ...uploadState, description: event.target.value })}
        placeholder="教程简介"
      />
      <div className="training-upload-actions">
        <label className="training-checkbox">
          <input
            type="checkbox"
            checked={uploadState.publishNow}
            onChange={event => props.onUploadChange({ ...uploadState, publishNow: event.target.checked })}
          />
          立即发布
        </label>
        <button
          className="training-button primary"
          disabled={!props.activeSection || props.busyAction === 'upload-new'}
          onClick={props.onUploadNew}
        >
          上传为新教程
        </button>
        <button
          className="training-button"
          disabled={!props.activeTutorial || props.busyAction === 'replace-tutorial'}
          onClick={props.onReplace}
        >
          替换选中教程文件
        </button>
      </div>
    </section>
  );
}

function InspectorPanel(props: {
  activeCourse: TrainingCourse | null;
  activeSection: TrainingSection | null;
  activeTutorial: TutorialSummary | null;
  allSections: Array<{ course: TrainingCourse; section: TrainingSection }>;
  busyAction: string;
  courseDraft: CourseDraft;
  sectionDraft: SectionDraft;
  tutorialDraft: TutorialDraft;
  setCourseDraft: (draft: CourseDraft) => void;
  setSectionDraft: (draft: SectionDraft) => void;
  setTutorialDraft: (draft: TutorialDraft) => void;
  saveCourse: () => Promise<void>;
  saveSection: () => Promise<void>;
  saveTutorial: () => Promise<void>;
  archiveCourse: () => Promise<void>;
  archiveSection: () => Promise<void>;
  archiveTutorial: () => Promise<void>;
}): React.ReactElement {
  if (props.activeTutorial) {
    return (
      <aside className="training-admin-band training-inspector">
        <h3>教程属性</h3>
        <LabeledInput label="展示标题">
          <input
            value={props.tutorialDraft.title}
            onChange={event => props.setTutorialDraft({ ...props.tutorialDraft, title: event.target.value })}
          />
        </LabeledInput>
        <LabeledInput label="Notebook 文件名">
          <input
            value={props.tutorialDraft.notebookFilename}
            onChange={event => props.setTutorialDraft({ ...props.tutorialDraft, notebookFilename: event.target.value })}
          />
        </LabeledInput>
        <LabeledInput label="所属章节">
          <select
            value={props.tutorialDraft.sectionId}
            onChange={event => props.setTutorialDraft({ ...props.tutorialDraft, sectionId: event.target.value })}
          >
            {props.allSections.map(item => (
              <option key={item.section.id} value={item.section.id}>
                {item.course.title} / {item.section.title}
              </option>
            ))}
          </select>
        </LabeledInput>
        <div className="training-two-field">
          <LabeledInput label="排序">
            <input
              type="number"
              value={props.tutorialDraft.sortOrder}
              onChange={event => props.setTutorialDraft({ ...props.tutorialDraft, sortOrder: Number(event.target.value) })}
            />
          </LabeledInput>
          <LabeledInput label="状态">
            <StatusSelect
              value={props.tutorialDraft.status}
              onChange={status => props.setTutorialDraft({ ...props.tutorialDraft, status })}
            />
          </LabeledInput>
        </div>
        <LabeledInput label="简介">
          <textarea
            value={props.tutorialDraft.description}
            onChange={event => props.setTutorialDraft({ ...props.tutorialDraft, description: event.target.value })}
          />
        </LabeledInput>
        <label className="training-checkbox training-lock-row">
          <input
            type="checkbox"
            checked={props.tutorialDraft.commentsLocked}
            onChange={event => props.setTutorialDraft({ ...props.tutorialDraft, commentsLocked: event.target.checked })}
          />
          锁定评论
        </label>
        <div className="training-inspector-actions">
          <button className="training-button primary" disabled={props.busyAction === 'save-tutorial'} onClick={props.saveTutorial}>
            保存教程
          </button>
          <button className="training-button danger" onClick={props.archiveTutorial}>删除教程</button>
        </div>
      </aside>
    );
  }

  if (props.activeSection) {
    return (
      <aside className="training-admin-band training-inspector">
        <h3>章节属性</h3>
        <LabeledInput label="章节名称">
          <input
            value={props.sectionDraft.title}
            onChange={event => props.setSectionDraft({ ...props.sectionDraft, title: event.target.value })}
          />
        </LabeledInput>
        <LabeledInput label="状态">
          <StatusSelect
            value={props.sectionDraft.status}
            onChange={status => props.setSectionDraft({ ...props.sectionDraft, status })}
          />
        </LabeledInput>
        <LabeledInput label="章节说明">
          <textarea
            value={props.sectionDraft.description}
            onChange={event => props.setSectionDraft({ ...props.sectionDraft, description: event.target.value })}
          />
        </LabeledInput>
        <div className="training-inspector-actions">
          <button className="training-button primary" disabled={props.busyAction === 'save-section'} onClick={props.saveSection}>
            保存章节
          </button>
          <button className="training-button danger" onClick={props.archiveSection}>删除章节</button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="training-admin-band training-inspector">
      <h3>课程属性</h3>
      <LabeledInput label="课程名称">
        <input
          value={props.courseDraft.title}
          onChange={event => props.setCourseDraft({ ...props.courseDraft, title: event.target.value })}
        />
      </LabeledInput>
      <LabeledInput label="状态">
        <StatusSelect
          value={props.courseDraft.status}
          onChange={status => props.setCourseDraft({ ...props.courseDraft, status })}
        />
      </LabeledInput>
      <LabeledInput label="课程说明">
        <textarea
          value={props.courseDraft.description}
          onChange={event => props.setCourseDraft({ ...props.courseDraft, description: event.target.value })}
        />
      </LabeledInput>
      <div className="training-inspector-actions">
        <button
          className="training-button primary"
          disabled={!props.activeCourse || props.busyAction === 'save-course'}
          onClick={props.saveCourse}
        >
          保存课程
        </button>
        <button className="training-button danger" disabled={!props.activeCourse} onClick={props.archiveCourse}>
          删除课程
        </button>
      </div>
    </aside>
  );
}

function LabeledInput(props: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <label className="training-field">
      <span>{props.label}</span>
      {props.children}
    </label>
  );
}

function StatusSelect(props: { value: string; onChange: (value: string) => void }): React.ReactElement {
  return (
    <select value={props.value} onChange={event => props.onChange(event.target.value)}>
      <option value="published">发布</option>
      <option value="draft">草稿</option>
    </select>
  );
}

function StatusBadge(props: { status: string }): React.ReactElement {
  return <em className={props.status === 'published' ? 'training-status-badge published' : 'training-status-badge'}>{props.status === 'published' ? '已发布' : '草稿'}</em>;
}

function countTutorials(course: TrainingCourse): number {
  return course.sections.reduce((total, section) => total + section.tutorials.length, 0);
}
