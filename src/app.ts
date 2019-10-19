import { service as slackService } from './api/slack';

(async () => {
    await slackService.load();
    console.log('UP');
})();
