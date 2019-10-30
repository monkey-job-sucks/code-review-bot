/* eslint-disable import/no-cycle */
/* eslint-disable no-unused-vars */
import * as _ from 'lodash';

import { MergeRequest, IMergeRequestModel } from '../../api/mongo';
import { service as slack, helper as slackHelper } from '../../api/slack';
import { service as gitlab, IGitlabMergeRequestDetail, IGitlabMergeRequestReaction } from '../../api/gitlab';
import logger from '../../helpers/Logger';
import { IJobConfig } from '../job.interface';
/* eslint-enable no-unused-vars */

const CLOSED_MR_REACTION = process.env.CLOSED_MR_REACTION || 'heavy_check_mark';

interface IReviewers {
    reviewers: string[];
    hasOpenDiscussion: boolean;
}

const fetchOpenMRs = () => MergeRequest.find({ 'done': false });

const fetchSingleMR = (mr: IMergeRequestModel) => gitlab.getMergeRequestDetail(mr.url);

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
    const reviewers = new Set(
        userInteractions.map((discussion) => discussion.notes[0].author.username),
    );

    const hasOpenDiscussion = userInteractions
        .some((discussion) => discussion.notes.some((note) => note.resolvable && !note.resolved));

    return {
        'reviewers': [...reviewers],
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
    if (!discussions.hasOpenDiscussion && mr.slack.reactions.includes('speech_balloon')) {
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
        /* eslint-disable no-param-reassign */
        // valida se mr pode ser fechado
        switch (current.state) {
            case 'merged':
                mr.done = true;
                mr.merged = {
                    'at': new Date(current.merged_at),
                    'by': current.merged_by.username,
                };
                break;
            case 'closed':
                mr.done = true;
                mr.closed = {
                    'at': new Date(current.closed_at),
                    'by': current.closed_by.username,
                };
                break;
            default:
                break;
        }

        const [upvoteReactions, discussionReaction] = await Promise.all([
            updateUpvoters(mr, current),
            updateReviewers(mr),
        ]);

        const slackReactions = [...discussionReaction, ...upvoteReactions];

        // always like before close
        if (slackReactions.length > 0) {
            await slack.addReaction(
                JSON.parse(mr.rawSlackMessage),
                mr.slack.messageId,
                slackReactions,
            );
        }

        if (mr.done && !mr.slack.reactions.includes(CLOSED_MR_REACTION)) {
            const reaction = CLOSED_MR_REACTION || 'heavy_check_mark';

            await slack.addReaction(
                JSON.parse(mr.rawSlackMessage),
                mr.slack.messageId,
                reaction,
            );

            slackReactions.push(reaction);
        }

        mr.slack.reactions = [...mr.slack.reactions, ...slackReactions];
        /* eslint-enable no-param-reassign */

        return mr.save();
    } catch (err) {
        logger.info(mr);

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
    'isEnabled': () => !!process.env.FETCH_MR_UPDATES_CRON,
    'when': process.env.FETCH_MR_UPDATES_CRON,
    'function': async function fetchMRUpdates() {
        logger.debug('[fetchMRUpdates] Starting job');

        const openMRsAmount = await updateOpenMRs();

        logger.debug(`[fetchMRUpdates] Got ${openMRsAmount} mrs`);

        return logger.debug('[fetchMRUpdates] Job ended');
    },
};

export default fetchMRUpdatesJob;
