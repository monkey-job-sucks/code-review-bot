export interface IAzurePullRequestDetailProject {
    id: string;
    name: string;
    description: string;
    url: string;
    state: string;
    revision: number;
    visibility: string;
    lastUpdateTime: Date;
}

export interface IAzurePullRequestDetailRepository {
    id: string;
    name: string;
    url: string;
    project: IAzurePullRequestDetailProject;
    size: number;
    remoteUrl: string;
    sshUrl: string;
    webUrl: string;
}

export interface IAzurePullRequestDetailAuthor {
    displayName: string;
    url: string;
    _links: IAzureThreadAvatar;
    id: string;
    uniqueName: string;
    imageUrl: string;
    descriptor: string;
}

export interface IAzurePullRequestDetailLastMergeCommit {
    commitId: string;
    url: string;
}

export interface IAzurePullRequestDetailReviewerVotedFor {
    reviewerUrl: string;
    vote: number;
    displayName: string;
    url: string;
    _links: IAzureThreadAvatar;
    id: string;
    uniqueName: string;
    imageUrl: string;
    isContainer: boolean;
}

export interface IAzurePullRequestDetailReviewer {
    reviewerUrl: string;
    vote: number;
    hasDeclined: boolean;
    isRequired: boolean;
    isFlagged: boolean;
    displayName: string;
    url: string;
    _links: IAzureThreadAvatar;
    id: string;
    uniqueName: string;
    imageUrl: string;
    isContainer: boolean;
    votedFor: IAzurePullRequestDetailReviewerVotedFor[];
}

export interface IAzurePullRequestDetail {
    repository: IAzurePullRequestDetailRepository;
    pullRequestId: number;
    codeReviewId: number;
    status: string;
    createdBy: IAzurePullRequestDetailAuthor;
    closedBy?: IAzurePullRequestDetailAuthor;
    creationDate: Date;
    closedDate: Date;
    title: string;
    sourceRefName: string;
    targetRefName: string;
    isDraft: boolean;
    mergeId: string;
    lastMergeSourceCommit: IAzurePullRequestDetailLastMergeCommit;
    lastMergeTargetCommit: IAzurePullRequestDetailLastMergeCommit;
    reviewers: IAzurePullRequestDetailReviewer[];
    url: string;
    supportsIterations: boolean;
    artifactId: string;
}

export interface IAzurePullRequest {
    info: IAzurePullRequestUrlInfo;
    url: string;
    repository: string;
    detail: IAzurePullRequestDetail;
}

export interface IAzurePullRequestUrlInfo {
    organization: string;
    project: string;
    repository: string;
    id: number;
}

export interface IAzurePullRequestReviewer {
    vote: number;
    uniqueName: string;
}

export interface IAzurePullRequestThreadComment {
    id: number;
    author: string;
    content: string;
}

export interface IAzurePullRequestThread {
    status: string;
    comments: IAzurePullRequestThreadComment[];
}

export interface IAzureThreadValuePullRequestThreadContextIterationContext {
    firstComparingIteration: number;
    secondComparingIteration: number;
}

export interface IAzureThreadValuePullRequestThreadContext {
    iterationContext: IAzureThreadValuePullRequestThreadContextIterationContext;
    changeTrackingId: number;
}

export interface AuthorLinks {
    avatar: IAzureThreadValueHref;
}

export interface Author {
    displayName: string;
    url: string;
    _links: AuthorLinks;
    id: string;
    uniqueName: string;
    imageUrl: string;
    descriptor: string;
}

export interface IAzureThreadValueCommentLinks {
    self: IAzureThreadValueHref;
    repository: IAzureThreadValueHref;
    threads: IAzureThreadValueHref;
    pullRequests: IAzureThreadValueHref;
}

export interface IAzureThreadValueComment {
    id: number;
    parentCommentId: number;
    author: Author;
    content: string;
    publishedDate: Date;
    lastUpdatedDate: Date;
    lastContentUpdatedDate: Date;
    commentType: string;
    usersLiked: any[];
    _links: IAzureThreadValueCommentLinks;
}

export interface IAzureThreadValueThreadContextFile {
    line: number;
    offset: number;
}

export interface IAzureThreadValueThreadContext {
    filePath: string;
    rightFileStart: IAzureThreadValueThreadContextFile;
    rightFileEnd: IAzureThreadValueThreadContextFile;
    leftFileStart: IAzureThreadValueThreadContextFile;
    leftFileEnd: IAzureThreadValueThreadContextFile;
}

export interface IAzureThreadValueTypeValue {
    $type: string;
    $value: number;
}

export interface IAzureThreadValueProperties {
    'Microsoft.TeamFoundation.Discussion.SupportsMarkdown': IAzureThreadValueTypeValue;
    'Microsoft.TeamFoundation.Discussion.UniqueID': IAzureThreadValueTypeValue;
    CodeReviewThreadType: IAzureThreadValueTypeValue;
    CodeReviewReviewersUpdatedNumAdded: IAzureThreadValueTypeValue;
    CodeReviewReviewersUpdatedNumChanged: IAzureThreadValueTypeValue;
    CodeReviewReviewersUpdatedNumDeclined: IAzureThreadValueTypeValue;
    CodeReviewReviewersUpdatedNumRemoved: IAzureThreadValueTypeValue;
    CodeReviewReviewersUpdatedAddedIdentity: IAzureThreadValueTypeValue;
    CodeReviewReviewersUpdatedByIdentity: IAzureThreadValueTypeValue;
    CodeReviewVoteResult: IAzureThreadValueTypeValue;
    CodeReviewVotedByInitiatorIdentity: IAzureThreadValueTypeValue;
    CodeReviewVotedByIdentity: IAzureThreadValueTypeValue;
}

export interface IAzureThreadAvatar {
    avatar: IAzureThreadValueHref;
}

export interface IAzureThreadValueLinks4 {
    self: IAzureThreadValueHref;
    repository: IAzureThreadValueHref;
}

export interface IAzureThreadValueHref {
    href: string;
}

export interface IAzureThreadValue {
    pullRequestThreadContext: IAzureThreadValuePullRequestThreadContext;
    id: number;
    publishedDate: Date;
    lastUpdatedDate: Date;
    comments: IAzureThreadValueComment[];
    status: string;
    threadContext: IAzureThreadValueThreadContext;
    properties: IAzureThreadValueProperties;
    isDeleted: boolean;
    _links: IAzureThreadValueLinks4;
}

export interface IAzureThread {
    value: IAzureThreadValue[];
    count: number;
}
