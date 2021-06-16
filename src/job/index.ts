import { CronJob, CronCommand } from 'cron';

import { SettingsModel } from '../api/mongo';
import rankingJob from './rankings/rankings.job';
import notifyOpenMRs from './notify-open-reviews/notify-open-reviews.job';
import fetchMRUpdatesJob from './fetch-updates/fetch-updates.job';

interface Jobs {
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

const jobs: Jobs = {};

const start = (settings: SettingsModel): Jobs => {
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
