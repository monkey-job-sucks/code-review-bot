/* eslint-disable import/no-cycle */
import helper from './fetch-updates.helper';
import logger from '../../helpers/Logger';
import { service as slack } from '../../api/slack';
import jobManager from '../job-manager';

/* eslint-disable no-unused-vars */
import { IJobConfig } from '../job.interface';
import { IRemoteInfo, IReactions } from './fetch-updates.interface';
import { MergeRequest, IMergeRequestModel } from '../../api/mongo';
import { service as gitlab, IGitlabMergeRequestDetail } from '../../api/gitlab';
/* eslint-enable no-unused-vars */

const JOB_NAME = 'fetch-updates';

const fetchOpenMRs = () => MergeRequest.find({ 'done': false });

const fetchSingleMR = (mr: IMergeRequestModel) => gitlab.getMergeRequestDetail(mr.url);

const getRemoteInfo = async (
    currentMR: IMergeRequestModel,
    remoteMR: IGitlabMergeRequestDetail,
): Promise<IRemoteInfo> => {
    const remoteInfo: IRemoteInfo = {
        'reactions': {
            'add': [],
            'remove': [],
        },
    };

    const [remoteReactions, remoteDiscussions] = await Promise.all([
        gitlab.getMergeRequestReactions(currentMR.url),
        gitlab.getMergeRequestDiscussions(currentMR.url),
    ]);

    const upvoted = helper.getUpvoteReactions(currentMR, remoteReactions);
    const finished = helper.getFinishedReaction(remoteMR);
    const reviewed = helper.getDiscussionReaction(currentMR, remoteDiscussions);

    remoteInfo.reactions.add = upvoted.reactions.add.concat(reviewed.reactions.add);
    remoteInfo.reactions.remove = upvoted.reactions.remove.concat(reviewed.reactions.remove);

    if (upvoted.upvoters) remoteInfo.upvoters = upvoted.upvoters;
    if (reviewed.reviewers) remoteInfo.reviewers = reviewed.reviewers;

    if (finished.merged) remoteInfo.merged = finished.merged;
    if (finished.closed) remoteInfo.closed = finished.closed;
    if (finished.reaction) remoteInfo.reactions.add.push(finished.reaction);

    return remoteInfo;
};

const updateReactions = (
    currentReactions: string[],
    newReactions: IReactions,
): string[] => currentReactions.reduce((nextReactions: string[], reaction: string) => {
    if (newReactions.remove.includes(reaction)) return nextReactions;

    nextReactions.push(reaction);

    return nextReactions;
}, []).concat(newReactions.add);

const updateMR = async (
    currentMR: IMergeRequestModel,
    remoteMR: IGitlabMergeRequestDetail,
) => {
    try {
        const {
            merged,
            closed,
            upvoters,
            reviewers,
            reactions,
        } = await getRemoteInfo(currentMR, remoteMR);

        await slack.removeReaction(
            JSON.parse(currentMR.rawSlackMessage), currentMR.slack.messageId, reactions.remove,
        );

        await slack.addReaction(
            JSON.parse(currentMR.rawSlackMessage), currentMR.slack.messageId, reactions.add,
        );

        // update mongo document with new info
        /* eslint-disable no-param-reassign */
        currentMR.slack.reactions = updateReactions(currentMR.slack.reactions, reactions);

        currentMR.done = !!merged || !!closed;

        if (merged) currentMR.merged = merged;
        if (closed) currentMR.closed = closed;
        if (upvoters) currentMR.analytics.upvoters = upvoters;
        if (reviewers) currentMR.analytics.reviewers = reviewers;
        /* eslint-enable no-param-reassign */

        return currentMR.save();
    } catch (err) {
        logger.info(currentMR);

        return logger.error(err.stack || err);
    }
};

const updateOpenMRs = async (): Promise<number> => {
    try {
        const openMRs: IMergeRequestModel[] = await fetchOpenMRs();

        if (openMRs.length === 0) return 0;

        const currentMRStatus = await Promise.all(openMRs.map(fetchSingleMR));

        await Promise.all(openMRs.map((mr, i) => updateMR(mr, currentMRStatus[i].detail)));

        return openMRs.length;
    } catch (err) {
        logger.error(err.stack || err);

        return 0;
    }
};

const fetchMRUpdatesJob: IJobConfig = {
    'isEnabled': () => !!process.env.FETCH_MR_UPDATES_CRON,
    'when': process.env.FETCH_MR_UPDATES_CRON,
    'function': async function fetchMRUpdates() {
        if (jobManager.isRunning(JOB_NAME)) return false;

        jobManager.start(JOB_NAME);

        const openMRsAmount = await updateOpenMRs();

        logger.debug(`[fetchMRUpdates] Got ${openMRsAmount} mrs`);

        jobManager.stop(JOB_NAME);

        return true;
    },
};

export default fetchMRUpdatesJob;
