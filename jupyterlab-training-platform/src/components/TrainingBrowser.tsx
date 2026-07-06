import React, { useEffect, useMemo, useState } from 'react';
import { TrainingApiClient } from '../api/client';
import { TrainingCourse, TrainingSection, TutorialSummary } from '../api/types';

interface TrainingBrowserProps {
  api: TrainingApiClient;
  onOpenTutorial: (course: TrainingCourse, section: TrainingSection, tutorial: TutorialSummary) => Promise<void>;
}

export function TrainingBrowser(props: TrainingBrowserProps): React.ReactElement {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>('');
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [status, setStatus] = useState<string>('正在加载学习课程...');
  const [openingId, setOpeningId] = useState<string>('');

  useEffect(() => {
    void loadCourses();
  }, []);

  const activeCourse = useMemo(
    () => courses.find(course => course.id === activeCourseId) ?? courses[0] ?? null,
    [courses, activeCourseId]
  );
  const activeSection = useMemo(
    () => activeCourse?.sections.find(section => section.id === activeSectionId) ?? activeCourse?.sections[0] ?? null,
    [activeCourse, activeSectionId]
  );

  async function loadCourses(): Promise<void> {
    try {
      const nextCourses = await props.api.getCourses();
      setCourses(nextCourses);
      setActiveCourseId(nextCourses[0]?.id ?? '');
      setActiveSectionId(nextCourses[0]?.sections[0]?.id ?? '');
      setStatus(nextCourses.length ? '' : '暂无已发布学习课程。');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function openTutorial(course: TrainingCourse, section: TrainingSection, tutorial: TutorialSummary): Promise<void> {
    setOpeningId(tutorial.public_id);
    setStatus('');
    try {
      await props.onOpenTutorial(course, section, tutorial);
      setStatus('教程已复制并打开。');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setOpeningId('');
    }
  }

  return (
    <div className="training-platform training-browser">
      <aside className="training-sidebar">
        <div className="training-sidebar-title">学习课程</div>
        {courses.map(course => (
          <button
            className={course.id === activeCourse?.id ? 'training-nav-item active' : 'training-nav-item'}
            key={course.id}
            onClick={() => {
              setActiveCourseId(course.id);
              setActiveSectionId(course.sections[0]?.id ?? '');
            }}
          >
            <span>{course.title}</span>
            <b>{course.sections.length}</b>
          </button>
        ))}
      </aside>
      <main className="training-main">
        <header className="training-header">
          <div>
            <h2>{activeCourse?.title ?? '学习课程'}</h2>
            <p>{activeCourse?.description || '选择课程、章节和教程文件开始学习。'}</p>
          </div>
          <button className="training-button" onClick={loadCourses}>刷新</button>
        </header>
        {status && <div className="training-status">{status}</div>}
        {activeCourse && (
          <div className="training-section-tabs">
            {activeCourse.sections.map(section => (
              <button
                className={section.id === activeSection?.id ? 'active' : ''}
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
              >
                {section.title}
              </button>
            ))}
          </div>
        )}
        <div className="training-tutorial-list">
          {activeSection?.tutorials.length === 0 && <div className="training-empty">该章节暂无教程。</div>}
          {activeCourse && activeSection?.tutorials.map(tutorial => (
            <article className="training-tutorial-row" key={tutorial.public_id}>
              <div>
                <h3>{tutorial.title}</h3>
                <p>{tutorial.description || '打开后系统会复制最新版 Notebook 到你的工作区。'}</p>
              </div>
              <button
                className="training-button primary"
                disabled={openingId === tutorial.public_id}
                onClick={() => openTutorial(activeCourse, activeSection, tutorial)}
              >
                {openingId === tutorial.public_id ? '打开中...' : '打开教程'}
              </button>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
