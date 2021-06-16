import { ReviewRequestModelActionLog } from '../../api/mongo';

export interface Reactions {
    add: string[];
    remove: string[];
}

export interface Discussion {
    reviewers?: string[];
}

export interface Upvote {
    upvoters?: string[];
}

export interface Finished {
    merged?: ReviewRequestModelActionLog;
    closed?: ReviewRequestModelActionLog;
}

export interface RemoteInfo extends Finished, Upvote, Discussion {
    reactions: Reactions;
}

export interface UpvoteReactions extends Upvote {
    reactions: Reactions;
}

export interface DiscussionReaction extends Discussion {
    reactions: Reactions;
}

export interface FinishedReaction extends Finished {
    reaction?: string;
}
