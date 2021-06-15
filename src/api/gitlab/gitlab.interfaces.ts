export enum EGitlabMergeRequestResource {
    DETAIL = '',
    COMMITS = 'commits',
    EMOJIS = 'award_emoji',
    DISCUSSIONS = 'discussions',
}

export enum EGitlabMergeRequestStatus {
    ALL = 'all',
    OPENED = 'opened',
    CLOSED = 'closed',
    LOCKED = 'locked',
    MERGED = 'merged',
}

export interface GitlabMergeRequest {
    info: GitlabMergeRequestUrlInfo;
    url: string;
    repository: string;
    detail: GitlabMergeRequestDetail;
}

export interface GitlabMergeRequestChanges {
    additions: number;
    deletions: number;
}

export interface GitlabMergeRequestDetail {
    id: number;
    iid: number;
    project_id: number;
    title: string;
    description: string;
    state: string;
    created_at: string;
    updated_at: string;
    merged_by?: GitlabUser;
    merged_at?: string;
    closed_by?: GitlabUser;
    closed_at?: string;
    target_branch: string;
    source_branch: string;
    upvotes: number;
    downvotes: number;
    author: GitlabUser;
    assignee?: GitlabUser;
    source_project_id: number;
    target_project_id: number;
    labels: string[];
    work_in_progress: boolean;
    milestone?: GitlabMergeRequestDetailMilestone;
    merge_when_pipeline_succeeds: boolean;
    merge_status: string;
    sha: string;
    merge_commit_sha?: string;
    user_notes_count: number;
    discussion_locked?: boolean;
    should_remove_source_branch?: boolean;
    force_remove_source_branch: boolean;
    web_url: string;
    time_stats: GitlabMergeRequestDetailTimeStats;
    squash: boolean;
    subscribed: boolean;
    changes_count: string;
    latest_build_started_at?: any;
    latest_build_finished_at?: any;
    first_deployed_to_production_at?: any;
    pipeline?: GitlabMergeRequestDetailPipeline;
    diff_refs: GitlabMergeRequestDetailDiffRefs;
    merge_error?: string;
    approvals_before_merge?: number;
}

export interface GitlabUser {
    id: number;
    name: string;
    username: string;
    state: string;
    avatar_url: string;
    web_url: string;
}

export interface GitlabMergeRequestDetailTimeStats {
    time_estimate: number;
    total_time_spent: number;
    human_time_estimate: string;
    human_total_time_spent: string;
}

export interface GitlabMergeRequestDetailMilestone {
    id: number;
    iid: number;
    project_id: number;
    title: string;
    description: string;
    state: string;
    created_at: string;
    updated_at: string;
    due_date: string;
    start_date: string;
    web_url: string;
}

export interface GitlabMergeRequestDetailDiffRefs {
    base_sha: string;
    head_sha: string;
    start_sha: string;
}

export interface GitlabMergeRequestDetailPipeline {
    id: number;
    sha: string;
    ref: string;
    status: string;
    web_url: string;
}

export interface GitlabMergeRequestUrlInfo {
    repository: string;
    id: string;
}

export interface GitlabMergeRequestReaction {
    id: number;
    name: string;
    user: GitlabUser;
    created_at: Date;
    updated_at: Date;
    awardable_id: number;
    awardable_type: string;
}

export interface GitlabMergeRequestDiscussionNotePosition {
    base_sha: string;
    start_sha: string;
    head_sha: string;
    old_path: string;
    new_path: string;
    position_type: string;
    old_line?: number;
    new_line: number;
}

export interface GitlabMergeRequestDiscussionNote {
    id: number;
    type: string;
    body: string;
    attachment?: any;
    author: GitlabUser;
    created_at: Date;
    updated_at: Date;
    system: boolean;
    noteable_id: number;
    noteable_type: string;
    position: GitlabMergeRequestDiscussionNotePosition;
    resolvable: boolean;
    resolved: boolean;
    resolved_by?: GitlabUser;
    noteable_iid: number;
}

export interface GitlabMergeRequestDiscussion {
    id: string;
    individual_note: boolean;
    notes: GitlabMergeRequestDiscussionNote[];
}
