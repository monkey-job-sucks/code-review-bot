// eslint-disable-next-line no-unused-vars
import { CronJob, CronCommand } from 'cron';

/* eslint-disable no-unused-vars */
import { ISettingsModel } from '../api/mongo';
/* eslint-enable no-unused-vars */
import rankingJob from './rankings/rankings.job';
import notifyOpenMRs from './notify-open-reviews/notify-open-reviews.job';
import fetchMRUpdatesJob from './fetch-updates/fetch-updates.job';

interface IJobs {
    ranking?: CronJob;
    notifyOpenMRs?: CronJob;
    fetchMRUpdates?: CronJob;
}

const AUTO_START = true;
const ON_COMPLETE = () => {};

const buildCronJob = (
    cronTime: string,
    onTick: CronCommand,
    onComplete = ON_COMPLETE,
    autoStart = AUTO_START,
    timezone = process.env.TIMEZONE,
) => new CronJob(cronTime, onTick, onComplete, autoStart, timezone);

const jobs: IJobs = {};

const start = (settings: ISettingsModel): IJobs => {
    const {
        openRequests,
        notifyRanking,
        fetchRequestsUpdates,
    } = settings.cron;

    if (notifyRanking.enabled) {
        jobs.ranking = buildCronJob(
            notifyRanking.pattern,
            rankingJob.function(settings),
        );
    }

    if (openRequests.enabled) {
        jobs.fetchMRUpdates = buildCronJob(
            openRequests.pattern,
            notifyOpenMRs.function(settings),
        );
    }

    if (fetchRequestsUpdates.enabled) {
        jobs.fetchMRUpdates = buildCronJob(
            fetchRequestsUpdates.pattern,
            fetchMRUpdatesJob.function(settings),
        );
    }

    return jobs;
};

export default { start };
