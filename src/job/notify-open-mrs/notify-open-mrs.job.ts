/* eslint-disable no-unused-vars */
import { BotkitMessage } from 'botkit';
import * as moment from 'moment';

import { ReviewRequest, IChannelMergeRequests, ISettingsModel } from '../../api/mongo';
import { service as slack, factory as slackFactory } from '../../api/slack';
import { IJobConfig } from '../job.interface';
/* eslint-enable no-unused-vars */
import logger from '../../helpers/Logger';
import Sentry from '../../helpers/Sentry';
import jobManager from '../job-manager';

const JOB_NAME = 'notify-open-mrs';

const fetchDelayedMRs = (
    hours: number,
    discussionReaction: string,
): Promise<IChannelMergeRequests[]> => {
    const cutDate = moment().subtract(hours, 'hours').toDate();

    return ReviewRequest.aggregate()
        .match({
            'done': false,
            'added.at': { '$lte': cutDate },
            'slack.reactions': { '$nin': [discussionReaction] },
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

const notifyDelayedMRs = async (settings: ISettingsModel): Promise<number> => {
    try {
        const openMRs = await fetchDelayedMRs(
            settings.cron.openRequests.hours,
            settings.slack.reactions.discussion,
        );

        if (openMRs.length === 0) return 0;

        await Promise.all(openMRs.map(notifyChannel));

        return openMRs.length;
    } catch (err) {
        Sentry.capture(err, {
            'level': Sentry.level.Error,
            'tags': {
                'fileName': 'notify-open-mrs.job',
            },
            'context': {
                'name': 'notifyDelayedMRs',
                'data': {},
            },
        });

        logger.error(err.stack || err);

        return 0;
    }
};

const notifyOpenMRsjob: IJobConfig = {
    'function': (settings: ISettingsModel) => async function notifyOpenMRs() {
        if (jobManager.isRunning(JOB_NAME)) return false;

        jobManager.start(JOB_NAME);

        const delayedMRsAmount = await notifyDelayedMRs(settings);

        jobManager.log(JOB_NAME, `Got ${delayedMRsAmount} mrs`);

        jobManager.stop(JOB_NAME);

        return true;
    },
};

export default notifyOpenMRsjob;
