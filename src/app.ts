import { service as slackService } from './api/slack';
import { service as gitlabService } from './api/gitlab';
import { service as azureService } from './api/azure';
import logger from './helpers/Logger';
import sentry from './helpers/Sentry';
import job from './job';
import { loadSettings } from './settings';

sentry.init(process.env.SENTRY_URL);

(async () => {
    const settings = await loadSettings();

    logger.init(settings, slackService);

    gitlabService.init(settings);
    azureService.init(settings);

    await slackService.load(settings);

    job.start(settings);

    logger.info('UP');
})();
