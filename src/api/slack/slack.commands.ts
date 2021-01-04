/* eslint-disable no-unused-vars */
import { BotWorker, BotkitMessage } from 'botkit';

import slack from './slack.service';
import logger from '../../helpers/Logger';
import Sentry from '../../helpers/Sentry';
import factory from './slack.factory';
import { MergeRequest, IMergeRequestModel } from '../mongo';
import { service as gitlab, IGitlabMergeRequest } from '../gitlab';
/* eslint-enable no-unused-vars */
import Message from '../../helpers/Message';

const saveOnMongo = async (mr: IGitlabMergeRequest, message: BotkitMessage, messageId: string) => {
    const model = <IMergeRequestModel>{
        'rawMergeRequest': JSON.stringify(mr),
        'rawSlackMessage': JSON.stringify(message),
        'url': message.text,
        'repository': mr.repository,
        'id': String(mr.detail.id),
        'iid': String(mr.detail.iid),
        'created': {
            'at': new Date(mr.detail.created_at),
            'by': mr.detail.author.username,
        },
        'added': {
            'at': new Date(),
            'by': message.user,
        },
        'slack': {
            'channel': {
                'id': message.channel_id,
                'name': message.channel_name,
            },
            'messageId': String(messageId),
        },
    };

    const mergeRequest = new MergeRequest(model);

    return mergeRequest.save();
};

const validateMr = async (message: BotkitMessage, mr: IGitlabMergeRequest): Promise<void> => {
    const document = await MergeRequest.find({
        'id': mr.detail.id,
        'repository': mr.repository,
    });

    const hasMROnMongo = document.length > 0;

    if (hasMROnMongo) throw new Message('Já estou cuidando desse MR :wink:');
};

// TODO: receive hashtags
const handleCodeReview = async (bot: BotWorker, message: BotkitMessage) => {
    try {
        const mr = await gitlab.getMergeRequestDetail(message.text);

        await validateMr(message, mr);

        const slackMessage = factory.generateAddedMergeRequestMessage(message.user, mr);

        const { id } = await slack.mergeAdded(bot, message, slackMessage);

        const document = await saveOnMongo(mr, message, id);

        return document;
    } catch (err) {
        const captureOptions = {
            'tags': {
                'command': '/code-review',
            },
            'context': {
                'name': 'handleCodeReview',
                'data': {
                    'message': message.text,
                },
            },
        };

        if (err instanceof Message) {
            logger.info(err);

            Sentry.capture(err, {
                'level': Sentry.level.Warning,
                ...captureOptions,
            });

            return slack.sendEphemeral(message, err.message);
        }

        Sentry.capture(err, {
            'level': Sentry.level.Error,
            ...captureOptions,
        });

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
