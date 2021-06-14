import { BotkitMessage } from 'botkit';
import * as moment from 'moment';

import { ReviewRequest, IReviewRequestModel, ISettingsModel } from '../../api/mongo';
import { service as slack, factory as slackFactory } from '../../api/slack';
import { IJobConfig } from '../job.interface';
import logger from '../../helpers/Logger';
import jobManager from '../job-manager';

const JOB_NAME = 'notify-open-reviews';

const fetchDelayedReviews = (hours: number): Promise<IReviewRequestModel[]> => {
    const cutDate = moment().subtract(hours, 'hours').toDate();

    return ReviewRequest.aggregate()
        .match({
            'done': false,
            'added.at': { '$lte': cutDate },
        })
        .sort({ 'added.at': 1 })
        .group({ '_id': '$slack.channel.id', 'reviews': { '$push': '$$ROOT' } })
        .exec();
};

const notifyChannel = (
    channelReviews: IReviewRequestModel,
    discussionReaction: string,
) => {
    const message = slackFactory.generateDelayedReviewRequestsMessage(
        channelReviews,
        discussionReaction,
    );

    return slack.sendMessage({ 'channel': channelReviews._id } as BotkitMessage, message);
};

const notifyDelayedReviews = async (settings: ISettingsModel): Promise<number> => {
    try {
        const openReviews = await fetchDelayedReviews(
            settings.cron.openRequests.hours,
        );

        if (openReviews.length === 0) return 0;

        await Promise.all(
            openReviews.map((review) => notifyChannel(review, settings.slack.reactions.discussion)),
        );

        return openReviews.length;
    } catch (err) {
        logger.error(err.stack || err);

        return 0;
    }
};

const notifyOpenReviewsjob: IJobConfig = {
    'function': (settings: ISettingsModel) => async function notifyOpenReviews() {
        if (jobManager.isRunning(JOB_NAME)) return false;

        jobManager.start(JOB_NAME);

        const delayedReviewsAmount = await notifyDelayedReviews(settings);

        jobManager.log(JOB_NAME, `Got ${delayedReviewsAmount} mrs`);

        jobManager.stop(JOB_NAME);

        return true;
    },
};

export default notifyOpenReviewsjob;
