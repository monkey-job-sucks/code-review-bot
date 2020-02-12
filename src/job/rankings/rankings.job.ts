import * as moment from 'moment';
/* eslint-disable no-unused-vars */
import { BotkitMessage } from 'botkit';

import { IRanking } from './rankings.interface';
import { MergeRequest, IMergeRequestModel } from '../../api/mongo';
import { IJobConfig } from '../job.interface';
/* eslint-enable no-unused-vars */
import jobManager from '../job-manager';
import slack from '../../api/slack/slack.service';
import helper from './rankings.helper';
import logger from '../../helpers/Logger';
import slackFactory from '../../api/slack/slack.factory';

const JOB_NAME = 'rankings';

const { NOTIFY_RANKING_CRON } = process.env;

const fetchElegibleMRs = async (
    amount: number,
    unit: string,
    period: string,
): Promise<IRanking[]> => {
    const cutDate = moment().subtract(amount as any, unit as any).toDate();

    const elegibles: IMergeRequestModel[] = await MergeRequest.aggregate()
        .match({ 'done': true, 'added.at': { '$gte': cutDate } })
        .exec();

    return helper.groupByAnalytics(elegibles, period);
};

const notifyRanking = async () => {
    try {
        const elegibleMRsGroupedByAnalytics = await fetchElegibleMRs(1, 'week', 'da última semana');

        return Promise.all(elegibleMRsGroupedByAnalytics.map((mr) => {
            const message = slackFactory.generateRankingMessage(mr);

            return slack.sendMessage({ 'channel': mr.channel } as BotkitMessage, message);
        }));
    } catch (err) {
        return logger.error(err.stack || err);
    }
};

const rankingjob: IJobConfig = {
    'isEnabled': () => !!NOTIFY_RANKING_CRON,
    'when': NOTIFY_RANKING_CRON,
    'function': async function ranking() {
        if (jobManager.isRunning(JOB_NAME)) return false;

        jobManager.start(JOB_NAME);

        await notifyRanking();

        jobManager.stop(JOB_NAME);

        return true;
    },
};

export default rankingjob;
