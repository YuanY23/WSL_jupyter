export interface CurrentUser {
  username: string;
  is_admin: boolean;
}

export interface TutorialSummary {
  id: string;
  public_id: string;
  title: string;
  notebook_filename: string;
  description: string;
  sort_order: number;
  current_version_id: string | null;
  comments_locked: boolean;
  status?: string;
  course_id?: string;
  section_id?: string;
}

export interface TrainingSection {
  id: string;
  course_id?: string;
  title: string;
  description: string;
  sort_order: number;
  status?: string;
  tutorials: TutorialSummary[];
}

export interface TrainingCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  sort_order: number;
  status?: string;
  sections: TrainingSection[];
}

export interface TutorialComment {
  id: string;
  tutorial_public_id: string;
  parent_id: string | null;
  author: string;
  content: string;
  is_pinned: boolean;
  is_official: boolean;
  is_deleted: boolean;
  deleted_reason: string | null;
  created_at: string;
  updated_at: string;
  like_count: number;
  liked_by_current_user: boolean;
  can_admin: boolean;
  replies: TutorialComment[];
}

export interface TutorialImportRequest {
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
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  sort_order: number;
}

export interface CreateSectionRequest {
  course_id: string;
  title: string;
  description: string;
  sort_order: number;
}

export interface PatchCourseRequest {
  title?: string;
  description?: string;
  sort_order?: number;
  status?: string;
}

export interface PatchSectionRequest {
  course_id?: string;
  title?: string;
  description?: string;
  sort_order?: number;
  status?: string;
}

export interface PatchTutorialRequest {
  course_id?: string;
  section_id?: string;
  title?: string;
  notebook_filename?: string;
  description?: string;
  sort_order?: number;
  status?: string;
  comments_locked?: boolean;
}
