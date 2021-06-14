import { BotWorker, BotkitMessage } from 'botkit';

import slack from './slack.service';
import logger from '../../helpers/Logger';
import {
    EReviewRequestOrigin,
} from '../mongo';
import { service as gitlab } from '../gitlab';
import { service as azure } from '../azure';
import Message from '../../helpers/Message';
import helper from './slack.commands.helper';

// TODO: receive hashtags
const handleCodeReview = async (bot: BotWorker, message: BotkitMessage) => {
    try {
        const url = message.text;

        let origin: EReviewRequestOrigin;

        if (gitlab.itsMine(url)) origin = EReviewRequestOrigin.GITLAB;
        if (azure.itsMine(url)) origin = EReviewRequestOrigin.AZURE;

        switch (origin) {
            case EReviewRequestOrigin.GITLAB:
                return helper.saveGitlabMR(bot, message);
            case EReviewRequestOrigin.AZURE:
                return helper.saveAzurePR(bot, message);
            default:
                throw new Message('Não posso aceitar links desse git :disappointed:');
        }
    } catch (err) {
        if (err instanceof Message) {
            logger.info(err);

            return slack.sendEphemeral(message, err.message);
        }

        logger.error(err.stack || err);

        throw err;
    }
};

// eslint-disable-next-line consistent-return
const slashCommandHandler = (allowedChannels: string) => {
    const ALLOWED_CHANNELS = allowedChannels.split(',');

    return async function slashCommandHandlerMiddleware(bot: BotWorker, message: BotkitMessage) {
        const start = Date.now();

        logger.info(JSON.stringify(message));
        logger.info(message.command);

        bot.httpStatus(200);

        if (ALLOWED_CHANNELS.length > 0 && !ALLOWED_CHANNELS.includes(message.channel_name)) {
            return slack.sendEphemeral(message, 'Não posso aceitar mensagens daqui :disappointed:');
        }

        switch (message.command) {
            case '/code-review':
                await handleCodeReview(bot, message);
                break;
            default:
                return bot.reply(message, 'Não sei fazer isso ainda :disappointed:');
        }

        return logger.info(`Took ${Date.now() - start}ms`);
    };
};

export default {
    'slashHandler': slashCommandHandler,
};
