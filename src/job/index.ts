/* eslint-disable import/no-cycle */
import { CronJob } from 'cron';

import fetchMRUpdatesJob from './fetch-updates.job';

const AUTO_START = true;
const ON_COMPLETE = () => {};

const { TIMEZONE } = process.env;

const fetchMRUpdates = new CronJob(
    fetchMRUpdatesJob.when,
    fetchMRUpdatesJob.function,
    ON_COMPLETE,
    AUTO_START,
    TIMEZONE,
);

export default {
    fetchMRUpdates,
};
