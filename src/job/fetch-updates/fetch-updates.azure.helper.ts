import * as _ from 'lodash';

import { FinishedReaction, UpvoteReactions, DiscussionReaction } from './fetch-updates.interface';
import { ReviewRequestModel, SettingsModel } from '../../api/mongo';
import { AzurePullRequestDetail, AzurePullRequestReviewer, AzurePullRequestThread } from '../../api/azure';
import slackHelper from '../../api/slack/slack.helper';

const getUpvoteReactions = (
    currentPR: ReviewRequestModel,
    remoteReactions: AzurePullRequestReviewer[],
): UpvoteReactions => {
    const upvote: UpvoteReactions = {
        'reactions': {
            'add': [],
            'remove': [],
        },
    };

    const remoteUpvoters = remoteReactions
        .reduce((names: string[], reaction: AzurePullRequestReviewer) => {
            /*
                10 - approved
                5 - approved with suggestions
                0 - no vote
                -5 - waiting for author
                -10 - rejected
            */
            if (reaction.vote === 10) names.push(reaction.uniqueName);

            return names;
        }, []);

    // if remote has no upvoters then mongo and slack should be cleaned
    // else if mongo and remote have different upvotes, update both mongo and slack
    if (remoteUpvoters.length === 0) {
        upvote.reactions.remove = currentPR.slack.reactions.splice(
            0, currentPR.slack.reactions.length,
        );
    } else if (_.difference(remoteUpvoters, currentPR.analytics.upvoters).length > 0) {
        const upvotersChanges = remoteUpvoters.length - currentPR.analytics.upvoters.length;

        upvote.upvoters = remoteUpvoters;

        // if has more upvotes on git, add reactions
        // otherwise remove it
        if (upvotersChanges > 0) {
            upvote.reactions.add = slackHelper.randomizeThumbsup(
                currentPR.slack.reactions, upvotersChanges,
            );
        } else {
            upvote.reactions.remove = currentPR.slack.reactions.splice(0, upvotersChanges * -1);
        }
    }

    return upvote;
};

const getDiscussionReaction = (
    settings: SettingsModel,
    currentPR: ReviewRequestModel,
    remoteDiscussions: AzurePullRequestThread[],
): DiscussionReaction => {
    const discussion: DiscussionReaction = {
        'reactions': {
            'add': [],
            'remove': [],
        },
    };

    // get username of first discussion on each thread
    const reviewers = [...new Set(
        remoteDiscussions.map((remoteDiscussion) => remoteDiscussion.comments[0].author),
    )];

    const hasOpenDiscussion = remoteDiscussions
        .some((remoteDiscussion) => remoteDiscussion.status === 'active');

    // if someone added a new discussion, update it
    if (_.difference(reviewers, currentPR.analytics.reviewers).length > 0) {
        discussion.reviewers = reviewers;
    }

    // if has an open discussion, add reaction
    // otherwise remove it
    const hasDiscussionReaction = currentPR.slack.reactions.includes(
        settings.slack.reactions.discussion,
    );

    if (hasOpenDiscussion && !hasDiscussionReaction) {
        discussion.reactions.add.push(settings.slack.reactions.discussion);
    } else if (!hasOpenDiscussion && hasDiscussionReaction) {
        discussion.reactions.remove.push(settings.slack.reactions.discussion);
    }

    return discussion;
};

const getFinishedReaction = (
    settings: SettingsModel,
    remotePR: AzurePullRequestDetail,
): FinishedReaction => {
    const finished: FinishedReaction = {};

    switch (remotePR.status) {
        case 'completed':
            finished.reaction = settings.slack.reactions.merged;
            finished.merged = {
                'at': new Date(remotePR.closedDate),
                'by': remotePR.closedBy.uniqueName,
            };
            break;
        case 'abandoned':
            finished.reaction = settings.slack.reactions.closed;
            finished.closed = {
                'at': new Date(remotePR.closedDate),
                // TODO: achar onde pega isso
                'by': 'SYSTEM',
                // 'by': remoteMR.closed_by.username,
            };
            break;
        default:
            break;
    }

    return finished;
};

export default {
    getUpvoteReactions,
    getFinishedReaction,
    getDiscussionReaction,
};
