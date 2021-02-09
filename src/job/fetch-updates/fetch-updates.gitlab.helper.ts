import * as _ from 'lodash';

/* eslint-disable no-unused-vars */
import { IFinishedReaction, IUpvoteReactions, IDiscussionReaction } from './fetch-updates.interface';
import { IReviewRequestModel, ISettingsModel } from '../../api/mongo';
import { IGitlabMergeRequestDetail, IGitlabMergeRequestReaction, IGitlabMergeRequestDiscussion } from '../../api/gitlab';
/* eslint-enable no-unused-vars */
import slackHelper from '../../api/slack/slack.helper';

const getUpvoteReactions = (
    currentMR: IReviewRequestModel,
    remoteReactions: IGitlabMergeRequestReaction[],
): IUpvoteReactions => {
    const upvote: IUpvoteReactions = {
        'reactions': {
            'add': [],
            'remove': [],
        },
    };

    const remoteUpvoters = remoteReactions
        .reduce((names: string[], reaction: IGitlabMergeRequestReaction) => {
            if (reaction.name === 'thumbsup') names.push(reaction.user.username);

            return names;
        }, []);

    // if remote has no upvoters then mongo and slack should be cleaned
    // else if mongo and remote have different upvotes, update both mongo and slack
    if (remoteUpvoters.length === 0) {
        upvote.reactions.remove = currentMR.slack.reactions.splice(
            0, currentMR.slack.reactions.length,
        );
    } else if (_.difference(remoteUpvoters, currentMR.analytics.upvoters).length > 0) {
        const upvotersChanges = remoteUpvoters.length - currentMR.analytics.upvoters.length;

        upvote.upvoters = remoteUpvoters;

        // if has more upvotes on git, add reactions
        // otherwise remove it
        if (upvotersChanges > 0) {
            upvote.reactions.add = slackHelper.randomizeThumbsup(
                currentMR.slack.reactions, upvotersChanges,
            );
        } else {
            upvote.reactions.remove = currentMR.slack.reactions.splice(0, upvotersChanges * -1);
        }
    }

    return upvote;
};

const getDiscussionReaction = (
    settings: ISettingsModel,
    currentMR: IReviewRequestModel,
    remoteDiscussions: IGitlabMergeRequestDiscussion[],
): IDiscussionReaction => {
    const discussion: IDiscussionReaction = {
        'reactions': {
            'add': [],
            'remove': [],
        },
    };

    const userInteractions = remoteDiscussions.filter((d) => !d.individual_note);

    // get username of first discussion on each thread
    const reviewers = [...new Set(
        userInteractions.map((interaction) => interaction.notes[0].author.username),
    )];

    const hasOpenDiscussion = userInteractions
        .some((interaction) => interaction.notes.some((note) => note.resolvable && !note.resolved));

    // if someone added a new discussion, update it
    if (_.difference(reviewers, currentMR.analytics.reviewers).length > 0) {
        discussion.reviewers = reviewers;
    }

    // if has an open discussion, add reaction
    // otherwise remove it
    const hasDiscussionReaction = currentMR.slack.reactions.includes(
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
    settings: ISettingsModel,
    remoteMR: IGitlabMergeRequestDetail,
): IFinishedReaction => {
    const finished: IFinishedReaction = {};

    // check if already finished
    switch (remoteMR.state) {
        case 'merged':
            finished.reaction = settings.slack.reactions.merged;
            finished.merged = {
                'at': new Date(remoteMR.merged_at),
                'by': remoteMR.merged_by.username,
            };
            break;
        case 'closed':
            finished.reaction = settings.slack.reactions.closed;
            finished.closed = {
                'at': new Date(remoteMR.closed_at),
                'by': remoteMR.closed_by.username,
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
