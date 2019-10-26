/* eslint-disable import/no-cycle */
import { CronJob } from 'cron';

import notifyOpenMRs from './notify-open-mrs/notify-open-mrs.job';
import fetchMRUpdatesJob from './fetch-updates/fetch-updates.job';

interface IJobs {
    notifyOpenMRs?: CronJob;
    fetchMRUpdates?: CronJob;
}

const AUTO_START = true;
const ON_COMPLETE = () => {};

const { TIMEZONE } = process.env;

const jobs: IJobs = {};

if (fetchMRUpdatesJob.isEnabled()) {
    jobs.fetchMRUpdates = new CronJob(
        fetchMRUpdatesJob.when,
        fetchMRUpdatesJob.function,
        ON_COMPLETE,
        AUTO_START,
        TIMEZONE,
    );
}

if (notifyOpenMRs.isEnabled()) {
    jobs.fetchMRUpdates = new CronJob(
        notifyOpenMRs.when,
        notifyOpenMRs.function,
        ON_COMPLETE,
        AUTO_START,
        TIMEZONE,
    );
}

export default jobs;
