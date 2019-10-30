/* eslint-disable import/no-cycle */
/* eslint-disable no-unused-vars */
import { BotkitMessage } from 'botkit';
import * as moment from 'moment';

import logger from '../../helpers/Logger';
import { MergeRequest, IChannelMergeRequests } from '../../api/mongo';
import { service as slack, factory as slackFactory } from '../../api/slack';
import { IJobConfig } from '../job.interface';
/* eslint-enable no-unused-vars */

const { NOTIFY_OPEN_MRS_CRON, NOTIFY_OPEN_MRS_DELAYED_IN_HOURS } = process.env;

const fetchDelayedMRs = (): Promise<IChannelMergeRequests[]> => {
    const hours = Number(NOTIFY_OPEN_MRS_DELAYED_IN_HOURS);
    const cutDate = moment().subtract(hours, 'hours').toDate();

    return MergeRequest.aggregate()
        .match({ 'done': false, 'added.at': { '$gte': cutDate } })
        .sort({ 'added.at': 1 })
        .group({ '_id': '$slack.channel.id', 'mrs': { '$push': '$$ROOT' } })
        .exec();
};

const notifyChannel = (channelMRs: IChannelMergeRequests) => {
    const message = slackFactory.generateDelayedMergeRequestsMessage(channelMRs);

    // eslint-disable-next-line no-underscore-dangle
    return slack.mergeDelayed({ 'channel': channelMRs._id } as BotkitMessage, message);
};

const notifyDelayedMRs = async (): Promise<number> => {
    const openMRs = await fetchDelayedMRs();

    if (openMRs.length === 0) return 0;

    await Promise.all(openMRs.map(notifyChannel));

    return openMRs.length;
};

const notifyOpenMRsjob: IJobConfig = {
    'isEnabled': () => !!NOTIFY_OPEN_MRS_CRON,
    'when': NOTIFY_OPEN_MRS_CRON,
    'function': async function notifyOpenMRs() {
        logger.debug('[notifyOpenMRs] Starting job');

        const delayedMRsAmount = await notifyDelayedMRs();

        logger.debug(`[notifyOpenMRs] Got ${delayedMRsAmount} mrs`);

        return logger.debug('[notifyOpenMRs] Job ended');
    },
};

export default notifyOpenMRsjob;
