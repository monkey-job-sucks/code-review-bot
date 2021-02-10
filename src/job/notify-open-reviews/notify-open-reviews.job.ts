/* eslint-disable no-unused-vars */
import { BotkitMessage } from 'botkit';
import * as moment from 'moment';

import { ReviewRequest, IReviewRequestModel, ISettingsModel } from '../../api/mongo';
import { service as slack, factory as slackFactory } from '../../api/slack';
import { IJobConfig } from '../job.interface';
/* eslint-enable no-unused-vars */
import logger from '../../helpers/Logger';
import Sentry from '../../helpers/Sentry';
import jobManager from '../job-manager';

const JOB_NAME = 'notify-open-reviews';

const fetchDelayedReviews = (
    hours: number,
    discussionReaction: string,
): Promise<IReviewRequestModel[]> => {
    const cutDate = moment().subtract(hours, 'hours').toDate();

    return ReviewRequest.aggregate()
        .match({
            'done': false,
            'added.at': { '$lte': cutDate },
            'slack.reactions': { '$nin': [discussionReaction] },
        })
        .sort({ 'added.at': 1 })
        .group({ '_id': '$slack.channel.id', 'reviews': { '$push': '$$ROOT' } })
        .exec();
};

const notifyChannel = (channelReviews: IReviewRequestModel) => {
    const message = slackFactory.generateDelayedReviewRequestsMessage(channelReviews);

    // eslint-disable-next-line no-underscore-dangle
    return slack.sendMessage({ 'channel': channelReviews._id } as BotkitMessage, message);
};

const notifyDelayedReviews = async (settings: ISettingsModel): Promise<number> => {
    try {
        const openReviews = await fetchDelayedReviews(
            settings.cron.openRequests.hours,
            settings.slack.reactions.discussion,
        );

        if (openReviews.length === 0) return 0;

        await Promise.all(openReviews.map(notifyChannel));

        return openReviews.length;
    } catch (err) {
        Sentry.capture(err, {
            'level': Sentry.level.Error,
            'tags': {
                'fileName': 'notify-open-reviews.job',
            },
            'context': {
                'name': 'notifyDelayedReviews',
                'data': {},
            },
        });

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
