import * as moment from 'moment';
/* eslint-disable no-unused-vars */
import { BotkitMessage } from 'botkit';

import { IRanking } from './rankings.interface';
import { ReviewRequest, IReviewRequestModel } from '../../api/mongo';
import { IJobConfig } from '../job.interface';
/* eslint-enable no-unused-vars */
import jobManager from '../job-manager';
import slack from '../../api/slack/slack.service';
import helper from './rankings.helper';
import logger from '../../helpers/Logger';
import Sentry from '../../helpers/Sentry';
import slackFactory from '../../api/slack/slack.factory';

const JOB_NAME = 'rankings';

const fetchElegibleReviews = async (
    amount: number,
    unit: string,
    period: string,
): Promise<IRanking[]> => {
    const cutDate = moment().subtract(amount as any, unit as any).toDate();

    const elegibles: IReviewRequestModel[] = await ReviewRequest.aggregate()
        .match({ 'merged.at': { '$gte': cutDate } })
        .exec();

    return helper.groupByAnalytics(elegibles, period);
};

const notifyRanking = async () => {
    try {
        const elegibleReviewsGroupedByAnalytics = await fetchElegibleReviews(1, 'week', 'da última semana');

        const slackMessages = elegibleReviewsGroupedByAnalytics.map((review) => {
            const message = slackFactory.generateRankingMessage(review);

            return slack.sendMessage({ 'channel': review.channel } as BotkitMessage, message);
        });

        return Promise.all(slackMessages);
    } catch (err) {
        Sentry.capture(err, {
            'level': Sentry.level.Error,
            'tags': {
                'fileName': 'rankings.job',
            },
            'context': {
                'name': 'notifyRanking',
                'data': {},
            },
        });

        return logger.error(err.stack || err);
    }
};

const rankingjob: IJobConfig = {
    'function': () => async function ranking() {
        if (jobManager.isRunning(JOB_NAME)) return false;

        jobManager.start(JOB_NAME);

        await notifyRanking();

        jobManager.stop(JOB_NAME);

        return true;
    },
};

export default rankingjob;
