/* eslint-disable import/no-cycle */
/* eslint-disable no-unused-vars */
import { BotWorker, BotkitMessage } from 'botkit';

import jobs from '../../job';
import slack from './slack.service';
import logger from '../../helpers/Logger';
import factory from './slack.factory';
import { MergeRequest, IMergeRequestModel } from '../mongo';
import { service as gitlab, IGitlabMergeRequest } from '../gitlab';
/* eslint-enable no-unused-vars */

const ALLOWED_CHANNELS = (process.env.SLACK_ALLOWED_CHANNELS || '').split(',');

const saveOnMongo = async (mr: IGitlabMergeRequest, message: BotkitMessage, messageId: string) => {
    const model = <IMergeRequestModel>{
        'rawMergeRequest': JSON.stringify(mr),
        'rawSlackMessage': JSON.stringify(message),
        'url': message.text,
        'repository': mr.repository,
        'id': String(mr.detail.id),
        'created': {
            'at': new Date(mr.detail.created_at),
            'by': mr.detail.author.username,
        },
        'added': {
            'at': new Date(),
            'by': message.user,
        },
        'slack': {
            'messageId': String(messageId),
        },
    };

    const mergeRequest = new MergeRequest(model);

    return mergeRequest.save();
};

// TODO:
// só receber de canais selecionados
// receber mais coisas além do link (ex: #urgente)
const handleCodeReview = async (bot: BotWorker, message: BotkitMessage) => {
    const mr = await gitlab.getMergeRequestDetail(message.text);

    const slackMessage = factory.generateMergeRequestMessage(message.user, mr);

    const { id } = await slack.mergeAdded(bot, message, slackMessage);

    await saveOnMongo(mr, message, id);

    if (!jobs.fetchMRUpdates.running) jobs.fetchMRUpdates.start();
};

// eslint-disable-next-line consistent-return
const slashCommandHandler = async (bot: BotWorker, message: BotkitMessage) => {
    const start = Date.now();
    logger.info(JSON.stringify(message));
    logger.info(message.command);

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

    logger.info(`Took ${Date.now() - start}ms`);
};

export default {
    'slashHandler': slashCommandHandler,
};
