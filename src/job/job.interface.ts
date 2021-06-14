import { CronCommand } from 'cron';

export interface IJobConfig {
    function: (...args: any) => CronCommand;
}
