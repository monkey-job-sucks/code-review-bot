import { PromiseQueue, PromiseQueueItemResponse } from 'promise-queue-manager';

import gitlabHelper from './fetch-updates.gitlab.helper';
import azureHelper from './fetch-updates.azure.helper';
import logger from '../../helpers/Logger';
import { service as slack } from '../../api/slack';
import jobManager from '../job-manager';

import {
    ReviewRequest,
    SettingsModel,
    ReviewRequestModel,
    EReviewRequestOrigin,
} from '../../api/mongo';
import {
    RemoteInfo,
    Reactions,
    UpvoteReactions,
    FinishedReaction,
    DiscussionReaction,
} from './fetch-updates.interface';
import { JobConfig } from '../job.interface';
import { service as gitlab, GitlabMergeRequestDetail } from '../../api/gitlab';
import { service as azure, AzurePullRequestDetail } from '../../api/azure';

const CONCURRENCE = 10;
const SHOULD_STOP_ON_ERROR = false;

const JOB_NAME = 'fetch-updates';

const fetchOpenReviews = () => ReviewRequest.find({ 'done': false });

const fetchReview = (review: ReviewRequestModel) => {
    switch (review.origin) {
        case EReviewRequestOrigin.GITLAB:
            return gitlab.getMergeRequestDetail(review.url);
        case EReviewRequestOrigin.AZURE:
            return azure.getPullRequestDetail(review.url);
        default:
            throw new Error(`Review ${review._id} has invalid origin!`);
    }
};

const getRemoteInfo = async (
    settings: SettingsModel,
    currentReview: ReviewRequestModel,
    remoteReview: GitlabMergeRequestDetail | AzurePullRequestDetail,
): Promise<RemoteInfo> => {
    const remoteInfo: RemoteInfo = {
        'reactions': {
            'add': [],
            'remove': [],
        },
    };

    let upvoted: UpvoteReactions;
    let finished: FinishedReaction;
    let reviewed: DiscussionReaction;

    /* eslint-disable no-case-declarations */
    switch (currentReview.origin) {
        case EReviewRequestOrigin.GITLAB:
            const remoteMR = remoteReview as GitlabMergeRequestDetail;

            const [gitlabReactions, gitlabDiscussions] = await Promise.all([
                gitlab.getMergeRequestReactions(currentReview.url),
                gitlab.getMergeRequestDiscussions(currentReview.url),
            ]);

            upvoted = gitlabHelper.getUpvoteReactions(currentReview, gitlabReactions);
            finished = gitlabHelper.getFinishedReaction(settings, remoteMR);
            reviewed = gitlabHelper.getDiscussionReaction(
                settings,
                currentReview,
                gitlabDiscussions,
            );

            break;
        case EReviewRequestOrigin.AZURE:
            const remotePR = remoteReview as AzurePullRequestDetail;

            const [azureReactions, azureDiscussions] = await Promise.all([
                azure.getPullRequestReviewers(currentReview.url),
                azure.getPullRequestThreads(currentReview.url),
            ]);

            upvoted = azureHelper.getUpvoteReactions(currentReview, azureReactions);
            finished = azureHelper.getFinishedReaction(settings, remotePR);
            reviewed = azureHelper.getDiscussionReaction(
                settings,
                currentReview,
                azureDiscussions,
            );

            break;
        default:
            break;
    }
    /* eslint-enable no-case-declarations */

    remoteInfo.reactions.add = upvoted.reactions.add.concat(
        reviewed.reactions.add,
    );
    remoteInfo.reactions.remove = upvoted.reactions.remove.concat(
        reviewed.reactions.remove,
    );

    if (upvoted.upvoters) remoteInfo.upvoters = upvoted.upvoters;
    if (reviewed.reviewers) remoteInfo.reviewers = reviewed.reviewers;

    if (finished.merged) remoteInfo.merged = finished.merged;
    if (finished.closed) remoteInfo.closed = finished.closed;
    if (finished.reaction) remoteInfo.reactions.add.push(finished.reaction);

    return remoteInfo;
};

const updateReactions = (
    currentReactions: string[],
    newReactions: Reactions,
): string[] => currentReactions.reduce((nextReactions: string[], reaction: string) => {
    if (!newReactions.remove.includes(reaction)) nextReactions.push(reaction);

    return nextReactions;
}, []).concat(newReactions.add);

const updateOpenReview = async (
    currentReview: ReviewRequestModel,
    remoteInfo: RemoteInfo,
) => {
    try {
        await slack.removeReaction(
            JSON.parse(currentReview.rawSlackMessage),
            currentReview.slack.messageId,
            remoteInfo.reactions.remove,
        );

        await slack.addReaction(
            JSON.parse(currentReview.rawSlackMessage),
            currentReview.slack.messageId,
            remoteInfo.reactions.add,
        );

        // update mongo document with new info
        /* eslint-disable no-param-reassign */
        currentReview.slack.reactions = updateReactions(
            currentReview.slack.reactions,
            remoteInfo.reactions,
        );

        currentReview.done = !!remoteInfo.merged || !!remoteInfo.closed;

        if (remoteInfo.merged) currentReview.merged = remoteInfo.merged;
        if (remoteInfo.closed) currentReview.closed = remoteInfo.closed;
        if (remoteInfo.upvoters) currentReview.analytics.upvoters = remoteInfo.upvoters;
        if (remoteInfo.reviewers) currentReview.analytics.reviewers = remoteInfo.reviewers;
        /* eslint-enable no-param-reassign */

        return currentReview.save();
    } catch (err) {
        logger.info(currentReview);

        return logger.error(err.stack || err);
    }
};

const updateReview = async (
    settings: SettingsModel,
    openReview: ReviewRequestModel,
): Promise<void> => {
    const remoteReview = await fetchReview(openReview);

    const remoteInfo: RemoteInfo = await getRemoteInfo(settings, openReview, remoteReview.detail);

    await updateOpenReview(openReview, remoteInfo);
};

const updateOpenReviews = async (settings: SettingsModel, finish: Function): Promise<void> => {
    try {
        const openReviews: ReviewRequestModel[] = await fetchOpenReviews();

        if (openReviews.length === 0) return finish(0);

        const updateReviews = openReviews.map((openReview) => updateReview(settings, openReview));

        const queue = new PromiseQueue<void>({
            'promises': updateReviews,
        }, CONCURRENCE, SHOULD_STOP_ON_ERROR);

        queue.on(PromiseQueue.EVENTS.ITEM_ERROR, (res: PromiseQueueItemResponse<void>) => {
            logger.error(`[${JOB_NAME}] ITEM_ERROR: ${JSON.stringify(res)}`);
        });

        queue.on(PromiseQueue.EVENTS.ITEM_PROCESSING, (res: PromiseQueueItemResponse<void>) => {
            logger.debug(`[${JOB_NAME}] ITEM_PROCESSING: ${JSON.stringify(res)}`);
        });

        queue.on(PromiseQueue.EVENTS.ITEM_PROCESSED, (res: PromiseQueueItemResponse<void>) => {
            logger.debug(`[${JOB_NAME}] ITEM_PROCESSED: ${JSON.stringify(res)}`);
        });

        queue.on(PromiseQueue.EVENTS.QUEUE_PROCESSED, () => {
            logger.debug(`[${JOB_NAME}] QUEUE_PROCESSED`);

            return finish(openReviews.length);
        });

        return queue.start();
    } catch (err) {
        logger.error(err.stack || err);

        return finish(NaN);
    }
};

const fetchMRUpdatesJob: JobConfig = {
    'function': (settings: SettingsModel) => async function fetchReviewsUpdates() {
        if (jobManager.isRunning(JOB_NAME)) return false;

        jobManager.start(JOB_NAME);

        const onFinish = (openReviewsAmount: number) => {
            jobManager.log(JOB_NAME, `Updated ${openReviewsAmount} reviews`);
            jobManager.stop(JOB_NAME);
        };

        await updateOpenReviews(settings, onFinish);

        return true;
    },
};

export default fetchMRUpdatesJob;
