// eslint-disable-next-line no-unused-vars
import { CronCommand } from 'cron';

export interface IJobConfig {
    function: (...args: any) => CronCommand;
}
