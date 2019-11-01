import _ from 'lodash';

import slackHelper from '../../api/slack/slack.helper';

/* eslint-disable no-unused-vars */
import { IReactions } from './fetch-updates.interface';
import { IMergeRequestModel } from '../../api/mongo';
import { IGitlabMergeRequestDetail, IGitlabMergeRequestReaction, IGitlabMergeRequestDiscussion } from '../../api/gitlab';
/* eslint-enable no-unused-vars */

const CLOSED_MR_REACTION = process.env.CLOSED_MR_REACTION || 'x';
const MERGED_MR_REACTION = process.env.MERGED_MR_REACTION || 'heavy_check_mark';
const DISCUSSION_MR_REACTION = process.env.DISCUSSION_MR_REACTION || 'speech_balloon';

const getUpvoteReactions = (
    currentMR: IMergeRequestModel,
    remoteReactions: IGitlabMergeRequestReaction[],
): IReactions => {
    const reactions: IReactions = {
        'add': [],
        'remove': [],
    };

    const remoteUpvoters = remoteReactions
        .reduce((names: string[], reaction: IGitlabMergeRequestReaction) => {
            if (reaction.name === 'thumbsup') names.push(reaction.user.username);

            return names;
        }, []);

    // if someone added a new upvote, update it
    if (remoteUpvoters.length === 0) {
        reactions.remove = currentMR.slack.reactions.splice(0, currentMR.slack.reactions.length);
    } else if (_.difference(remoteUpvoters, currentMR.analytics.upvoters).length > 0) {
        const upvotersChanges = remoteUpvoters.length - currentMR.analytics.upvoters.length;

        // eslint-disable-next-line no-param-reassign
        currentMR.analytics.upvoters = remoteUpvoters;

        // if has more upvotes on git, add reactions
        // otherwise remove it
        if (upvotersChanges > 0) {
            reactions.add = slackHelper.randomizeThumbsup(
                currentMR.slack.reactions, upvotersChanges,
            );
        } else {
            reactions.remove = currentMR.slack.reactions.splice(0, upvotersChanges * -1);
        }
    }

    return reactions;
};

const getDiscussionReaction = (
    currentMR: IMergeRequestModel,
    remoteDiscussions: IGitlabMergeRequestDiscussion[],
): IReactions => {
    const reactions: IReactions = {
        'add': [],
        'remove': [],
    };

    const userInteractions = remoteDiscussions.filter((discussion) => !discussion.individual_note);

    // get username of first discussion on each thread
    const reviewers = [...new Set(
        userInteractions.map((discussion) => discussion.notes[0].author.username),
    )];

    const hasOpenDiscussion = userInteractions
        .some((discussion) => discussion.notes.some((note) => note.resolvable && !note.resolved));

    // if someone added a new discussion, update it
    if (_.difference(reviewers, currentMR.analytics.reviewers).length > 0) {
        // eslint-disable-next-line no-param-reassign
        currentMR.analytics.reviewers = reviewers;
    }

    // if has an open discussion, add reaction
    // otherwise remove it
    if (hasOpenDiscussion && !currentMR.slack.reactions.includes(DISCUSSION_MR_REACTION)) {
        reactions.add.push(DISCUSSION_MR_REACTION);
    } else if (!hasOpenDiscussion && currentMR.slack.reactions.includes(DISCUSSION_MR_REACTION)) {
        reactions.remove.push(DISCUSSION_MR_REACTION);
    }

    return reactions;
};

const getFinishedReaction = (
    currentMR: IMergeRequestModel,
    remoteMR: IGitlabMergeRequestDetail,
): string => {
    let finishedReaction: string;

    /* eslint-disable no-param-reassign */
    // check if already finished
    switch (remoteMR.state) {
        case 'merged':
            currentMR.done = true;
            currentMR.merged = {
                'at': new Date(remoteMR.merged_at),
                'by': remoteMR.merged_by.username,
            };
            finishedReaction = MERGED_MR_REACTION;
            break;
        case 'closed':
            currentMR.done = true;
            currentMR.closed = {
                'at': new Date(remoteMR.closed_at),
                'by': remoteMR.closed_by.username,
            };
            finishedReaction = CLOSED_MR_REACTION;
            break;
        default:
            break;
    }
    /* eslint-enable no-param-reassign */

    return finishedReaction;
};

export default {
    getUpvoteReactions,
    getFinishedReaction,
    getDiscussionReaction,
};
