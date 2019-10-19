import { service as slackService } from './api/slack';

const text = 'hello world';

(async () => {
    await slackService.load();
    console.log('UP');
})();
