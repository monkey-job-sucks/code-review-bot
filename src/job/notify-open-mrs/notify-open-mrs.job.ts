/* eslint-disable import/no-cycle */
/* eslint-disable no-unused-vars */
import { BotkitMessage } from 'botkit';
import * as moment from 'moment';

import logger from '../../helpers/Logger';
import jobManager from '../job-manager';
import { MergeRequest, IChannelMergeRequests } from '../../api/mongo';
import { service as slack, factory as slackFactory } from '../../api/slack';
import { IJobConfig } from '../job.interface';
/* eslint-enable no-unused-vars */

const JOB_NAME = 'notify-open-mrs';

const {
    NOTIFY_OPEN_MRS_CRON,
    NOTIFY_OPEN_MRS_DELAYED_IN_HOURS,
    DISCUSSION_MR_REACTION,
} = process.env;

const fetchDelayedMRs = (): Promise<IChannelMergeRequests[]> => {
    const hours = Number(NOTIFY_OPEN_MRS_DELAYED_IN_HOURS);
    const cutDate = moment().subtract(hours, 'hours').toDate();

    return MergeRequest.aggregate()
        .match({
            'done': false,
            'added.at': { '$lte': cutDate },
            'slack.reactions': { '$nin': [DISCUSSION_MR_REACTION] },
        })
        .sort({ 'added.at': 1 })
        .group({ '_id': '$slack.channel.id', 'mrs': { '$push': '$$ROOT' } })
        .exec();
};

const notifyChannel = (channelMRs: IChannelMergeRequests) => {
    const message = slackFactory.generateDelayedMergeRequestsMessage(channelMRs);

    // eslint-disable-next-line no-underscore-dangle
    return slack.sendMessage({ 'channel': channelMRs._id } as BotkitMessage, message);
};

const notifyDelayedMRs = async (): Promise<number> => {
    try {
        const openMRs = await fetchDelayedMRs();

        if (openMRs.length === 0) return 0;

        await Promise.all(openMRs.map(notifyChannel));

        return openMRs.length;
    } catch (err) {
        logger.error(err.stack || err);

        return 0;
    }
};

const notifyOpenMRsjob: IJobConfig = {
    'isEnabled': () => !!NOTIFY_OPEN_MRS_CRON,
    'when': NOTIFY_OPEN_MRS_CRON,
    'function': async function notifyOpenMRs() {
        if (jobManager.isRunning(JOB_NAME)) return false;

        jobManager.start(JOB_NAME);

        const delayedMRsAmount = await notifyDelayedMRs();

        logger.debug(`[notifyOpenMRs] Got ${delayedMRsAmount} mrs`);

        jobManager.stop(JOB_NAME);

        return true;
    },
};

export default notifyOpenMRsjob;
