/* eslint-disable import/no-cycle */
import helper from './fetch-updates.helper';
import logger from '../../helpers/Logger';
import { service as slack } from '../../api/slack';

/* eslint-disable no-unused-vars */
import { IJobConfig } from '../job.interface';
import { IReactions } from './fetch-updates.interface';
import { MergeRequest, IMergeRequestModel } from '../../api/mongo';
import { service as gitlab, IGitlabMergeRequestDetail } from '../../api/gitlab';
/* eslint-enable no-unused-vars */

const fetchOpenMRs = () => MergeRequest.find({ 'done': false });

const fetchSingleMR = (mr: IMergeRequestModel) => gitlab.getMergeRequestDetail(mr.url);

const getSlackReactions = async (
    currentMR: IMergeRequestModel,
    remoteMR: IGitlabMergeRequestDetail,
): Promise<IReactions> => {
    const reactions: IReactions = {
        'add': [],
        'remove': [],
    };

    const [remoteReactions, remoteDiscussions] = await Promise.all([
        gitlab.getMergeRequestReactions(currentMR.url),
        gitlab.getMergeRequestDiscussions(currentMR.url),
    ]);

    const upvoteReactions = helper.getUpvoteReactions(currentMR, remoteReactions);
    const discussionReaction = helper.getDiscussionReaction(currentMR, remoteDiscussions);
    const finishedReaction = helper.getFinishedReaction(currentMR, remoteMR);

    reactions.add = upvoteReactions.add.concat(discussionReaction.add);
    reactions.remove = upvoteReactions.remove.concat(discussionReaction.remove);

    if (finishedReaction) reactions.add.push(finishedReaction);

    return reactions;
};

const updateMR = async (
    currentMR: IMergeRequestModel,
    remoteMR: IGitlabMergeRequestDetail,
) => {
    try {
        const reactions = await getSlackReactions(currentMR, remoteMR);

        await Promise.all([
            slack.addReaction(
                JSON.parse(currentMR.rawSlackMessage), currentMR.slack.messageId, reactions.add,
            ),
            slack.removeReaction(
                JSON.parse(currentMR.rawSlackMessage), currentMR.slack.messageId, reactions.remove,
            ),
        ]);

        return currentMR.save();
    } catch (err) {
        logger.info(currentMR);

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
