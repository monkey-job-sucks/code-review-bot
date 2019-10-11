/* eslint-disable import/no-cycle */
// eslint-disable-next-line no-unused-vars
import { BotWorker, BotkitMessage } from 'botkit';

import slack from './slack.service';
import gitlab from '../gitlab/gitlab.service';
import factory from './slack.factory';
import { MergeRequest } from '../mongo/mongo.service';

// TODO:
// só receber de canais selecionados
const handleCodeReview = async (bot: BotWorker, message: BotkitMessage) => {
    const mr = await gitlab.getMergeRequestDetail(message.text);

    const slackMessage = factory.generateMergeRequestMessage(message.user, mr);

    const { id } = await slack.mergeAdded(bot, message, slackMessage);

    const mergeRequest = new MergeRequest({
        'rawMergeRequest': JSON.stringify(mr),
        'rawSlackMessage': JSON.stringify(message),
        'created': {
            'at': mr.detail.created_at,
            'by': mr.detail.author.username,
        },
        'added': {
            'at': new Date().toISOString(),
            'by': message.user,
        },
        'slackMessageId': String(id),
    });

    await mergeRequest.save();
};

// eslint-disable-next-line consistent-return
const slashCommandHandler = async (bot: BotWorker, message: BotkitMessage): Promise<void> => {
    // const start = Date.now();
    // console.log(JSON.stringify(message));
    // console.log(message.command);

    switch (message.command) {
        case '/code-review':
            await handleCodeReview(bot, message);
            break;
        default:
            return bot.reply(message, 'Não sei fazer isso ainda :disappointed:');
    }

    // console.log(`Took ${Date.now() - start}ms`);
};

export default {
    'slashHandler': slashCommandHandler,
};
