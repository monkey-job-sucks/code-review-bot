// eslint-disable-next-line no-unused-vars
import { IReviewRequestModelActionLog } from '../../api/mongo';

export interface IReactions {
    add: string[];
    remove: string[];
}

export interface IDiscussion {
    reviewers?: string[];
}

export interface IUpvote {
    upvoters?: string[];
}

export interface IFinished {
    merged?: IReviewRequestModelActionLog;
    closed?: IReviewRequestModelActionLog;
}

export interface IRemoteInfo extends IFinished, IUpvote, IDiscussion {
    reactions: IReactions;
}

export interface IUpvoteReactions extends IUpvote {
    reactions: IReactions;
}

export interface IDiscussionReaction extends IDiscussion {
    reactions: IReactions;
}

export interface IFinishedReaction extends IFinished {
    reaction?: string;
}
