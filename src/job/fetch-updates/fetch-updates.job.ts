/* eslint-disable import/no-cycle */
/* eslint-disable no-unused-vars */
import * as _ from 'lodash';

import { MergeRequest, IMergeRequestModel } from '../../api/mongo';
import { service as slack, helper as slackHelper } from '../../api/slack';
import { service as gitlab, IGitlabMergeRequestDetail, IGitlabMergeRequestReaction } from '../../api/gitlab';
import logger from '../../helpers/Logger';
import { IJobConfig } from '../job.interface';
/* eslint-enable no-unused-vars */

const { FETCH_MR_UPDATES_CRON } = process.env;

interface IReviewers {
    reviewers: string[];
    hasOpenDiscussion: boolean;
}

const fetchOpenMRs = () => MergeRequest.find({ 'done': false });

const fetchSingleMR = async (mr: IMergeRequestModel) => gitlab.getMergeRequestDetail(mr.url);

const fetchUpvoters = async (mr: IMergeRequestModel): Promise<string[]> => {
    const reactions: IGitlabMergeRequestReaction[] = await gitlab.getMergeRequestReactions(mr.url);

    const upvoters = reactions
        .reduce((names: string[], reaction: IGitlabMergeRequestReaction) => {
            if (reaction.name === 'thumbsup') names.push(reaction.user.username);

            return names;
        }, []);

    return upvoters;
};

const updateUpvoters = async (
    mr: IMergeRequestModel,
    current: IGitlabMergeRequestDetail,
): Promise<string[]> => {
    const slackReactions: string[] = [];

    // get mr upvoters
    const upvoters = await fetchUpvoters(mr);

    // if someone added a new upvote, save it
    if (_.difference(upvoters, mr.analytics.upvoters).length > 0) {
        const upvotersChanges = current.upvotes - mr.analytics.upvoters.length;

        // eslint-disable-next-line no-param-reassign
        mr.analytics.upvoters = upvoters;

        // if has more upvotes on git, add reactions
        // otherwise remove it
        if (upvotersChanges > 0) {
            return slackHelper.randomizeThumbsup(mr.slack.reactions, upvotersChanges);
        }

        const remove = mr.slack.reactions.splice(0, upvotersChanges * -1);

        await slack.removeReaction(
            JSON.parse(mr.rawSlackMessage), mr.slack.messageId, remove,
        );
    }

    return slackReactions;
};

const fetchDiscussions = async (mr: IMergeRequestModel): Promise<IReviewers> => {
    const discussions = await gitlab.getMergeRequestDiscussions(mr.url);

    const userInteractions = discussions.filter((discussion) => !discussion.individual_note);

    // get username of first discussion on each thread
    const reviewers = userInteractions.map((discussion) => discussion.notes[0].author.username);

    const hasOpenDiscussion = userInteractions
        .some((discussion) => discussion.notes.some((note) => note.resolvable && !note.resolved));

    return {
        'reviewers': reviewers,
        'hasOpenDiscussion': hasOpenDiscussion,
    };
};

const updateReviewers = async (mr: IMergeRequestModel): Promise<string[]> => {
    const slackReactions: string[] = [];

    // get mr reviewers
    const discussions = await fetchDiscussions(mr);

    // if someone added a new discussion, save it
    if (_.difference(discussions.reviewers, mr.analytics.reviewers).length > 0) {
        // eslint-disable-next-line no-param-reassign
        mr.analytics.reviewers = discussions.reviewers;
    }

    // if has an open discussion, add reaction
    if (discussions.hasOpenDiscussion && !mr.slack.reactions.includes('speech_balloon')) {
        slackReactions.push('speech_balloon');

        return slackReactions;
    }

    // otherwise remove it
    if (mr.slack.reactions.includes('speech_balloon')) {
        // eslint-disable-next-line no-param-reassign
        mr.slack.reactions = mr.slack.reactions.filter((reaction) => reaction !== 'speech_balloon');

        await slack.removeReaction(
            JSON.parse(mr.rawSlackMessage), mr.slack.messageId, 'speech_balloon',
        );
    }

    return slackReactions;
};

const updateMR = async (mr: IMergeRequestModel, current: IGitlabMergeRequestDetail) => {
    try {
        let slackReactions: string[] = [];

        /* eslint-disable no-param-reassign */
        // valida se mr pode ser fechado
        switch (current.state) {
            case 'merged':
                mr.done = true;
                mr.merged = {
                    'at': new Date(current.merged_at),
                    'by': current.merged_by.username,
                };
                slackReactions.push('heavy_check_mark');
                break;
            case 'closed':
                mr.done = true;
                mr.closed = {
                    'at': new Date(current.closed_at),
                    'by': current.closed_by.username,
                };
                slackReactions.push('heavy_check_mark');
                break;
            default:
                break;
        }

        const [upvoteReactions, discussionReaction] = await Promise.all([
            updateUpvoters(mr, current),
            updateReviewers(mr),
        ]);

        // add reactions only if mr is still open
        if (!mr.done) {
            slackReactions = [
                ...slackReactions,
                ...upvoteReactions,
                ...discussionReaction,
            ];
        }

        if (slackReactions.length > 0) {
            await slack.addReaction(
                JSON.parse(mr.rawSlackMessage),
                mr.slack.messageId,
                slackReactions,
            );

            mr.slack.reactions = [...mr.slack.reactions, ...slackReactions];
        }
        /* eslint-enable no-param-reassign */

        return mr.save();
    } catch (err) {
        return logger.error(err);
    }
};

const updateOpenMRs = async (): Promise<number> => {
    const openMRs: IMergeRequestModel[] = await fetchOpenMRs();

    if (openMRs.length === 0) return 0;

    const currentMRStatus = await Promise.all(openMRs.map(fetchSingleMR));

    await Promise.all(openMRs.map((mr, i) => updateMR(mr, currentMRStatus[i].detail)));

    return openMRs.length;
};

const fetchMRUpdatesJob: IJobConfig = {
    'isEnabled': () => !!FETCH_MR_UPDATES_CRON,
    'when': FETCH_MR_UPDATES_CRON,
    'function': async function fetchMRUpdates() {
        logger.info('[fetchMRUpdates] Starting job');

        const openMRsAmount = await updateOpenMRs();

        logger.info(`[fetchMRUpdates] Got ${openMRsAmount} mrs`);

        return logger.info('[fetchMRUpdates] Job ended');
    },
};

export default fetchMRUpdatesJob;
