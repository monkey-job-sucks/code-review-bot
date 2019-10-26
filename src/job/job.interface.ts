// eslint-disable-next-line no-unused-vars
import { CronCommand } from 'cron';

export interface IJobConfig {
    when: string;
    function: CronCommand;
    isEnabled: () => boolean;
}
