import { service as slackService } from './api/slack';
import logger from './helpers/Logger';
import job from './job';

(async () => {
    await slackService.load();
    job.start();
    logger.info('UP');
})();
