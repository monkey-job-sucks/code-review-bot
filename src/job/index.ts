/* eslint-disable import/no-cycle */
// eslint-disable-next-line no-unused-vars
import { CronJob, CronCommand } from 'cron';

import rankingJob from './rankings/rankings.job';
import notifyOpenMRs from './notify-open-mrs/notify-open-mrs.job';
import fetchMRUpdatesJob from './fetch-updates/fetch-updates.job';

interface IJobs {
    ranking?: CronJob;
    notifyOpenMRs?: CronJob;
    fetchMRUpdates?: CronJob;
}

const { TIMEZONE } = process.env;

const AUTO_START = true;
const ON_COMPLETE = () => {};

const buildCronJob = (
    cronTime: string,
    onTick: CronCommand,
    onComplete = ON_COMPLETE,
    autoStart = AUTO_START,
    timezone = TIMEZONE,
) => new CronJob(cronTime, onTick, onComplete, autoStart, timezone);

const jobs: IJobs = {};

const start = (): IJobs => {
    if (rankingJob.isEnabled()) {
        jobs.ranking = buildCronJob(rankingJob.when, rankingJob.function);
    }

    if (notifyOpenMRs.isEnabled()) {
        jobs.fetchMRUpdates = buildCronJob(notifyOpenMRs.when, notifyOpenMRs.function);
    }

    if (fetchMRUpdatesJob.isEnabled()) {
        jobs.fetchMRUpdates = buildCronJob(fetchMRUpdatesJob.when, fetchMRUpdatesJob.function);
    }

    return jobs;
};

export default { start };
