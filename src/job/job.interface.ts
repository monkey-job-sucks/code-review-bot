import { CronCommand } from 'cron';

export interface JobConfig {
    function: (...args: any) => CronCommand;
}
