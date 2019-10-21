import { service as slackService } from './api/slack';
import logger from './helpers/Logger';

(async () => {
    await slackService.load();
    logger.info('UP');
})();
