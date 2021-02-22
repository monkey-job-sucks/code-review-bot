/* eslint-disable no-unused-vars */
/* eslint-disable import/prefer-default-export */
/* eslint-disable camelcase */

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

export interface IGitlabMergeRequest {
    info: IGitlabMergeRequestUrlInfo;
    url: string;
    repository: string;
    detail: IGitlabMergeRequestDetail;
}

export interface IGitlabMergeRequestChanges {
    additions: number;
    deletions: number;
}

export interface IGitlabMergeRequestDetail {
    id: number;
    iid: number;
    project_id: number;
    title: string;
    description: string;
    state: string;
    created_at: string;
    updated_at: string;
    merged_by?: IGitlabUser;
    merged_at?: string;
    closed_by?: IGitlabUser;
    closed_at?: string;
    target_branch: string;
    source_branch: string;
    upvotes: number;
    downvotes: number;
    author: IGitlabUser;
    assignee?: IGitlabUser;
    source_project_id: number;
    target_project_id: number;
    labels: string[];
    work_in_progress: boolean;
    milestone?: IGitlabMergeRequestDetailMilestone;
    merge_when_pipeline_succeeds: boolean;
    merge_status: string;
    sha: string;
    merge_commit_sha?: string;
    user_notes_count: number;
    discussion_locked?: boolean;
    should_remove_source_branch?: boolean;
    force_remove_source_branch: boolean;
    web_url: string;
    time_stats: IGitlabMergeRequestDetailTimeStats;
    squash: boolean;
    subscribed: boolean;
    changes_count: string;
    latest_build_started_at?: any;
    latest_build_finished_at?: any;
    first_deployed_to_production_at?: any;
    pipeline?: IGitlabMergeRequestDetailPipeline;
    diff_refs: IGitlabMergeRequestDetailDiffRefs;
    merge_error?: string;
    approvals_before_merge?: number;
}

export interface IGitlabUser {
    id: number;
    name: string;
    username: string;
    state: string;
    avatar_url: string;
    web_url: string;
}

export interface IGitlabMergeRequestDetailTimeStats {
    time_estimate: number;
    total_time_spent: number;
    human_time_estimate: string;
    human_total_time_spent: string;
}

export interface IGitlabMergeRequestDetailMilestone {
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

export interface IGitlabMergeRequestDetailDiffRefs {
    base_sha: string;
    head_sha: string;
    start_sha: string;
}

export interface IGitlabMergeRequestDetailPipeline {
    id: number;
    sha: string;
    ref: string;
    status: string;
    web_url: string;
}

export interface IGitlabMergeRequestUrlInfo {
    repository: string;
    id: string;
}

export interface IGitlabMergeRequestReaction {
    id: number;
    name: string;
    user: IGitlabUser;
    created_at: Date;
    updated_at: Date;
    awardable_id: number;
    awardable_type: string;
}

export interface IGitlabMergeRequestDiscussionNotePosition {
    base_sha: string;
    start_sha: string;
    head_sha: string;
    old_path: string;
    new_path: string;
    position_type: string;
    old_line?: number;
    new_line: number;
}

export interface IGitlabMergeRequestDiscussionNote {
    id: number;
    type: string;
    body: string;
    attachment?: any;
    author: IGitlabUser;
    created_at: Date;
    updated_at: Date;
    system: boolean;
    noteable_id: number;
    noteable_type: string;
    position: IGitlabMergeRequestDiscussionNotePosition;
    resolvable: boolean;
    resolved: boolean;
    resolved_by?: IGitlabUser;
    noteable_iid: number;
}

export interface IGitlabMergeRequestDiscussion {
    id: string;
    individual_note: boolean;
    notes: IGitlabMergeRequestDiscussionNote[];
}
