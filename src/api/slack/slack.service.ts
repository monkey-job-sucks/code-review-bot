/* eslint-disable import/no-cycle, no-unused-vars */
import { Botkit, BotkitMessage, BotWorker } from 'botkit';
import { SlackAdapter, SlackEventMiddleware, SlackMessageTypeMiddleware } from 'botbuilder-adapter-slack';
/* eslint-enabled import/no-cycle, no-unused-vars */

import commands from './slack.commands';

interface ISlackColors {
    added: string;
}

// TODO:
// validar se todos os escopos são necessários
// colocar storage do mongo se for necessário manter conversas
class Slack {
    private token: string;

    private secret: string;

    private verificationToken: string;

    private adapter: SlackAdapter;

    private controller: Botkit;

    private webhookPath: string;

    private colors: ISlackColors;

    constructor() {
        this.token = process.env.SLACK_TOKEN;
        this.secret = process.env.SLACK_SECRET;
        this.webhookPath = process.env.SLACK_WEBHOOK_PATH;
        this.verificationToken = process.env.SLACK_VERIFICATION_TOKEN;
        this.colors = {
            'added': process.env.SLACK_COLOR_MR_ADDED || 'good',
        };

        this.adapter = new SlackAdapter({
            'clientSigningSecret': this.secret,
            'botToken': this.token,
            'redirectUri': null,
            'verificationToken': this.verificationToken,
            'scopes': ['bot', 'commands', 'chat:write:bot', 'emoji:read', 'incoming-webhook', 'reactions:read', 'chat:write:user', 'users:read', 'channels:read', 'groups:read', 'mpim:read', 'im:read'],
        });

        // Use SlackEventMiddleware to emit events that match their original Slack event types.
        this.adapter.use(new SlackEventMiddleware());

        // Use SlackMessageType middleware to further classify messages
        // as direct_message, direct_mention, or mention
        this.adapter.use(new SlackMessageTypeMiddleware());

        this.controller = new Botkit({
            'adapter': this.adapter,
            'webserver_middlewares': null,
            'webhook_uri': this.webhookPath,
        });
    }

    public async load(): Promise<void> {
        return new Promise((resolve) => {
            this.controller.ready(() => {
                this.controller.on('slash_command', commands.slashHandler);
                return resolve();
            });
        });
    }

    public async addReaction(
        message: BotkitMessage, timestamp: string, emoji: string | string[],
    ): Promise<any> {
        const api = await this.adapter.getAPI(message);

        if (typeof emoji === 'string') {
            return api.reactions.add({
                'name': emoji,
                'timestamp': timestamp,
                'channel': message.channel,
            });
        }

        return Promise.all(emoji.map((e) => api.reactions.add({
            'name': e,
            'timestamp': timestamp,
            'channel': message.channel,
        })));
    }

    public async removeReaction(
        message: BotkitMessage, timestamp: string, emoji: string | string[],
    ): Promise<any> {
        const api = await this.adapter.getAPI(message);

        if (typeof emoji === 'string') {
            return api.reactions.remove({
                'name': emoji,
                'timestamp': timestamp,
                'channel': message.channel,
            });
        }

        return Promise.all(emoji.map((e) => api.reactions.remove({
            'name': e,
            'timestamp': timestamp,
            'channel': message.channel,
        })));
    }

    public async updateMessage(message: BotkitMessage, timestamp: string, newText: string) {
        const api = await this.adapter.getAPI(message);

        await api.chat.update({
            'channel': message.channel,
            'ts': timestamp,
            'text': newText,
        });
    }

    public async mergeAdded(
        bot: BotWorker, message: BotkitMessage, slackMessage: any,
    ): Promise<any> {
        return bot.reply(message, {
            'attachments': [{
                ...slackMessage,
                'color': this.colors.added,
            }],
        });
    }

    public async sendEphemeral(message: BotkitMessage, text: string) {
        const api = await this.adapter.getAPI(message);

        return api.chat.postEphemeral({
            'text': text,
            'user': message.user,
            'channel': message.channel,
        });
    }

    public async mergeDelayed(message: BotkitMessage, text: string) {
        const api = await this.adapter.getAPI(message);

        return api.chat.postMessage({
            'text': text,
            'channel': message.channel,
        });
    }
}

const slack = new Slack();

export default slack;
