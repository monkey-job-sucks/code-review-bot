import { service as slackService } from './api/slack';
import logger from './helpers/Logger';
import sentry from './helpers/Sentry';
import job from './job';

sentry.init(process.env.SENTRY_URL);

(async () => {
    await slackService.load();
    job.start();
    logger.info('UP');
})();
