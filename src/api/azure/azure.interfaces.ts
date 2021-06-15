export interface AzurePullRequestDetailProject {
    id: string;
    name: string;
    description: string;
    url: string;
    state: string;
    revision: number;
    visibility: string;
    lastUpdateTime: Date;
}

export interface AzurePullRequestDetailRepository {
    id: string;
    name: string;
    url: string;
    project: AzurePullRequestDetailProject;
    size: number;
    remoteUrl: string;
    sshUrl: string;
    webUrl: string;
}

export interface AzurePullRequestDetailAuthor {
    displayName: string;
    url: string;
    _links: AzureThreadAvatar;
    id: string;
    uniqueName: string;
    imageUrl: string;
    descriptor: string;
}

export interface AzurePullRequestDetailLastMergeCommit {
    commitId: string;
    url: string;
}

export interface AzurePullRequestDetailReviewerVotedFor {
    reviewerUrl: string;
    vote: number;
    displayName: string;
    url: string;
    _links: AzureThreadAvatar;
    id: string;
    uniqueName: string;
    imageUrl: string;
    isContainer: boolean;
}

export interface AzurePullRequestDetailReviewer {
    reviewerUrl: string;
    vote: number;
    hasDeclined: boolean;
    isRequired: boolean;
    isFlagged: boolean;
    displayName: string;
    url: string;
    _links: AzureThreadAvatar;
    id: string;
    uniqueName: string;
    imageUrl: string;
    isContainer: boolean;
    votedFor: AzurePullRequestDetailReviewerVotedFor[];
}

export interface AzurePullRequestDetail {
    repository: AzurePullRequestDetailRepository;
    pullRequestId: number;
    codeReviewId: number;
    status: string;
    createdBy: AzurePullRequestDetailAuthor;
    closedBy?: AzurePullRequestDetailAuthor;
    creationDate: Date;
    closedDate: Date;
    title: string;
    sourceRefName: string;
    targetRefName: string;
    isDraft: boolean;
    mergeId: string;
    lastMergeSourceCommit: AzurePullRequestDetailLastMergeCommit;
    lastMergeTargetCommit: AzurePullRequestDetailLastMergeCommit;
    reviewers: AzurePullRequestDetailReviewer[];
    url: string;
    supportsIterations: boolean;
    artifactId: string;
}

export interface AzurePullRequest {
    info: AzurePullRequestUrlInfo;
    url: string;
    repository: string;
    detail: AzurePullRequestDetail;
}

export interface AzurePullRequestUrlInfo {
    organization: string;
    project: string;
    repository: string;
    id: number;
}

export interface AzurePullRequestReviewer {
    vote: number;
    uniqueName: string;
}

export interface AzurePullRequestThreadComment {
    id: number;
    author: string;
    content: string;
}

export interface AzurePullRequestThread {
    status: string;
    comments: AzurePullRequestThreadComment[];
}

export interface AzureThreadValuePullRequestThreadContextIterationContext {
    firstComparingIteration: number;
    secondComparingIteration: number;
}

export interface AzureThreadValuePullRequestThreadContext {
    iterationContext: AzureThreadValuePullRequestThreadContextIterationContext;
    changeTrackingId: number;
}

export interface AuthorLinks {
    avatar: AzureThreadValueHref;
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

export interface AzureThreadValueCommentLinks {
    self: AzureThreadValueHref;
    repository: AzureThreadValueHref;
    threads: AzureThreadValueHref;
    pullRequests: AzureThreadValueHref;
}

export interface AzureThreadValueComment {
    id: number;
    parentCommentId: number;
    author: Author;
    content: string;
    publishedDate: Date;
    lastUpdatedDate: Date;
    lastContentUpdatedDate: Date;
    commentType: string;
    usersLiked: any[];
    _links: AzureThreadValueCommentLinks;
}

export interface AzureThreadValueThreadContextFile {
    line: number;
    offset: number;
}

export interface AzureThreadValueThreadContext {
    filePath: string;
    rightFileStart: AzureThreadValueThreadContextFile;
    rightFileEnd: AzureThreadValueThreadContextFile;
    leftFileStart: AzureThreadValueThreadContextFile;
    leftFileEnd: AzureThreadValueThreadContextFile;
}

export interface AzureThreadValueTypeValue {
    $type: string;
    $value: number;
}

export interface AzureThreadValueProperties {
    'Microsoft.TeamFoundation.Discussion.SupportsMarkdown': AzureThreadValueTypeValue;
    'Microsoft.TeamFoundation.Discussion.UniqueID': AzureThreadValueTypeValue;
    CodeReviewThreadType: AzureThreadValueTypeValue;
    CodeReviewReviewersUpdatedNumAdded: AzureThreadValueTypeValue;
    CodeReviewReviewersUpdatedNumChanged: AzureThreadValueTypeValue;
    CodeReviewReviewersUpdatedNumDeclined: AzureThreadValueTypeValue;
    CodeReviewReviewersUpdatedNumRemoved: AzureThreadValueTypeValue;
    CodeReviewReviewersUpdatedAddedIdentity: AzureThreadValueTypeValue;
    CodeReviewReviewersUpdatedByIdentity: AzureThreadValueTypeValue;
    CodeReviewVoteResult: AzureThreadValueTypeValue;
    CodeReviewVotedByInitiatorIdentity: AzureThreadValueTypeValue;
    CodeReviewVotedByIdentity: AzureThreadValueTypeValue;
}

export interface AzureThreadAvatar {
    avatar: AzureThreadValueHref;
}

export interface AzureThreadValueLinks4 {
    self: AzureThreadValueHref;
    repository: AzureThreadValueHref;
}

export interface AzureThreadValueHref {
    href: string;
}

export interface AzureThreadValue {
    pullRequestThreadContext: AzureThreadValuePullRequestThreadContext;
    id: number;
    publishedDate: Date;
    lastUpdatedDate: Date;
    comments: AzureThreadValueComment[];
    status: string;
    threadContext: AzureThreadValueThreadContext;
    properties: AzureThreadValueProperties;
    isDeleted: boolean;
    _links: AzureThreadValueLinks4;
}

export interface AzureThread {
    value: AzureThreadValue[];
    count: number;
}
