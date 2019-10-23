/* eslint-disable import/no-cycle */
/* eslint-disable no-unused-vars */
import { BotkitMessage } from 'botkit';
import * as moment from 'moment';

import logger from '../helpers/Logger';
import { MergeRequest, IChannelMergeRequests } from '../api/mongo';
import { service as slack, factory as slackFactory } from '../api/slack';
/* eslint-enable no-unused-vars */

const { NOTIFY_OPEN_MRS_CRON, NOTIFY_OPEN_MRS_DELAYED_IN_HOURS } = process.env;

const fetchDelayedMRs = (): Promise<IChannelMergeRequests[]> => {
    const cutDate = moment().subtract(Number(NOTIFY_OPEN_MRS_DELAYED_IN_HOURS), 'hours').toDate();

    return MergeRequest.aggregate()
        .match({ 'done': false, 'added.at': { '$gte': cutDate } })
        .group({ '_id': '$slack.channel.id', 'mrs': { '$push': '$$ROOT' } })
        .exec();
};

const notifyChannel = (channelMrs: IChannelMergeRequests) => {
    const message = slackFactory.generateDelayedMergeRequestsMessage(channelMrs);

    // eslint-disable-next-line no-underscore-dangle
    return slack.mergeDelayed({ 'channel': channelMrs._id } as BotkitMessage, message);
};

const notifyOpenMrsjob = {
    'when': NOTIFY_OPEN_MRS_CRON,
    'function': async function notifyOpenMrs() {
        logger.info('[notifyOpenMrs] Starting job');

        const openMRs = await fetchDelayedMRs();

        logger.info(`[notifyOpenMrs] Got ${openMRs.length} mrs`);

        if (openMRs.length === 0) {
            logger.info('[notifyOpenMrs] Stopping job');
            return this.stop();
        }

        await Promise.all(openMRs.map(notifyChannel));

        return logger.info('[notifyOpenMrs] Job ended');
    },
};

export default notifyOpenMrsjob;
