// eslint-disable-next-line no-unused-vars
import { PromiseQueue, PromiseQueueItemResponse } from 'promise-queue-manager';

import gitlabHelper from './fetch-updates.gitlab.helper';
import azureHelper from './fetch-updates.azure.helper';
import logger from '../../helpers/Logger';
import Sentry from '../../helpers/Sentry';
import { service as slack } from '../../api/slack';
import jobManager from '../job-manager';

/* eslint-disable no-unused-vars */
import {
    ReviewRequest,
    ISettingsModel,
    IReviewRequestModel,
    EReviewRequestOrigin,
} from '../../api/mongo';
import {
    IRemoteInfo,
    IReactions,
    IUpvoteReactions,
    IFinishedReaction,
    IDiscussionReaction,
} from './fetch-updates.interface';
import { IJobConfig } from '../job.interface';
import { service as gitlab, IGitlabMergeRequestDetail } from '../../api/gitlab';
import { service as azure, IAzurePullRequestDetail } from '../../api/azure';
/* eslint-enable no-unused-vars */

const CONCURRENCE = 10;
const SHOULD_STOP_ON_ERROR = false;

const JOB_NAME = 'fetch-updates';

const fetchOpenReviews = () => ReviewRequest.find({ 'done': false });

const fetchReview = (review: IReviewRequestModel) => {
    switch (review.origin) {
        case EReviewRequestOrigin.GITLAB:
            return gitlab.getMergeRequestDetail(review.url);
        case EReviewRequestOrigin.AZURE:
            return azure.getPullRequestDetail(review.url);
        default:
            // eslint-disable-next-line no-underscore-dangle
            throw new Error(`Review ${review._id} has invalid origin!`);
    }
};

const getRemoteInfo = async (
    settings: ISettingsModel,
    currentReview: IReviewRequestModel,
    remoteReview: IGitlabMergeRequestDetail | IAzurePullRequestDetail,
): Promise<IRemoteInfo> => {
    const remoteInfo: IRemoteInfo = {
        'reactions': {
            'add': [],
            'remove': [],
        },
    };

    let upvoted: IUpvoteReactions;
    let finished: IFinishedReaction;
    let reviewed: IDiscussionReaction;

    /* eslint-disable no-case-declarations */
    switch (currentReview.origin) {
        case EReviewRequestOrigin.GITLAB:
            const remoteMR = remoteReview as IGitlabMergeRequestDetail;

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
            const remotePR = remoteReview as IAzurePullRequestDetail;

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
    newReactions: IReactions,
): string[] => currentReactions.reduce((nextReactions: string[], reaction: string) => {
    if (!newReactions.remove.includes(reaction)) nextReactions.push(reaction);

    return nextReactions;
}, []).concat(newReactions.add);

const updateOpenReview = async (
    currentReview: IReviewRequestModel,
    remoteInfo: IRemoteInfo,
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
        Sentry.capture(err, {
            'level': Sentry.level.Error,
            'tags': {
                'fileName': 'fetch-updates.job',
            },
            'context': {
                'name': 'updateMR',
                'data': {
                    'currentMR': JSON.stringify(currentReview),
                    'remoteInfo': JSON.stringify(remoteInfo),
                },
            },
        });

        logger.info(currentReview);

        return logger.error(err.stack || err);
    }
};

const updateReview = async (
    settings: ISettingsModel,
    openReview: IReviewRequestModel,
): Promise<void> => {
    const remoteReview = await fetchReview(openReview);

    const remoteInfo: IRemoteInfo = await getRemoteInfo(settings, openReview, remoteReview.detail);

    await updateOpenReview(openReview, remoteInfo);
};

const updateOpenReviews = async (settings: ISettingsModel, finish: Function): Promise<void> => {
    try {
        const openReviews: IReviewRequestModel[] = await fetchOpenReviews();

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
        Sentry.capture(err, {
            'level': Sentry.level.Error,
            'tags': {
                'fileName': 'fetch-updates.job',
            },
            'context': {
                'name': 'updateOpenReviews',
                'data': {},
            },
        });

        logger.error(err.stack || err);

        return finish(NaN);
    }
};

const fetchMRUpdatesJob: IJobConfig = {
    'function': (settings: ISettingsModel) => async function fetchReviewsUpdates() {
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
