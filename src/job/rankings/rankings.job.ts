import * as moment from 'moment';
import { BotkitMessage } from 'botkit';

import { Ranking } from './rankings.interface';
import { ReviewRequest, ReviewRequestModel } from '../../api/mongo';
import { JobConfig } from '../job.interface';
import jobManager from '../job-manager';
import slack from '../../api/slack/slack.service';
import helper from './rankings.helper';
import logger from '../../helpers/Logger';
import slackFactory from '../../api/slack/slack.factory';

const JOB_NAME = 'rankings';

const fetchElegibleReviews = async (
    amount: number,
    unit: string,
    period: string,
): Promise<Ranking[]> => {
    const cutDate = moment().subtract(amount as any, unit as any).toDate();

    const elegibles: ReviewRequestModel[] = await ReviewRequest.aggregate()
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
        return logger.error(err.stack || err);
    }
};

const rankingjob: JobConfig = {
    'function': () => async function ranking() {
        if (jobManager.isRunning(JOB_NAME)) return false;

        jobManager.start(JOB_NAME);

        await notifyRanking();

        jobManager.stop(JOB_NAME);

        return true;
    },
};

export default rankingjob;
