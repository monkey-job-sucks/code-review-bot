import * as moment from 'moment';
/* eslint-disable no-unused-vars */
import { BotkitMessage } from 'botkit';

import { IRanking } from './rankings.interface';
import { MergeRequest, IMergeRequestModel } from '../../api/mongo';
import { IJobConfig } from '../job.interface';
/* eslint-enable no-unused-vars */
import slack from '../../api/slack/slack.service';
import helper from './rankings.helper';
import logger from '../../helpers/Logger';
import slackFactory from '../../api/slack/slack.factory';

const { NOTIFY_RANKING_CRON } = process.env;

const fetchElegibleMRs = async (amount: number, unit: string): Promise<IRanking[]> => {
    const cutDate = moment().subtract(amount as any, unit as any).toDate();

    const elegibles: IMergeRequestModel[] = await MergeRequest.aggregate()
        .match({ 'done': true, 'added.at': { '$gte': cutDate } })
        .exec();

    return helper.groupByAnalytics(elegibles);
};

const notifyRanking = async () => {
    const elegibleMRsGroupedByAnalytics = await fetchElegibleMRs(1, 'week');

    return Promise.all(elegibleMRsGroupedByAnalytics.map((mr) => {
        const message = slackFactory.generateRankingMessage(mr, 'da última semana');

        return slack.sendMessage({ 'channel': mr.channel } as BotkitMessage, message);
    }));
};

const rankingjob: IJobConfig = {
    'isEnabled': () => !!NOTIFY_RANKING_CRON,
    'when': NOTIFY_RANKING_CRON,
    'function': async function ranking() {
        logger.debug('[ranking] Job started');

        await notifyRanking();

        return logger.debug('[ranking] Job ended');
    },
};

export default rankingjob;
