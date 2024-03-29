import { Botkit, BotkitMessage, BotWorker } from 'botkit';
import { SlackAdapter, SlackEventMiddleware, SlackMessageTypeMiddleware } from 'botbuilder-adapter-slack';
import { FilesUploadArguments } from '@slack/web-api';

import { SettingsModel } from '../mongo';

import Context from '../../helpers/Context';
import commands from './slack.commands';

interface SlackColors {
    added: string;
}

const ADD_REACTION_EXPECTED_ERRORS = ['An API error occurred: already_reacted', 'An API error occurred: message_not_found'];

// TODO:
// validar se todos os escopos são necessários
// colocar storage do mongo se for necessário manter conversas
export class Slack {
    private token: string;

    private secret: string;

    private verificationToken: string;

    private adapter: SlackAdapter;

    private controller: Botkit;

    private webhookPath: string;

    private colors: SlackColors;

    public async load(settings: SettingsModel): Promise<void> {
        return new Promise((resolve) => {
            this.token = settings.slack.token;
            this.secret = settings.slack.secret;
            this.webhookPath = settings.slack.webhookPath;
            this.verificationToken = settings.slack.verificationToken;
            this.colors = {
                'added': settings.slack.requestAddColor,
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

            this.controller.middleware.receive.use(Context.createContext);

            this.controller.ready(() => {
                this.controller.on('slash_command', commands.slashHandler(settings.slack.allowedChannels));

                return resolve();
            });
        });
    }

    public async addReaction(
        message: BotkitMessage, timestamp: string, emoji: string | string[],
    ): Promise<void> {
        const api = await this.adapter.getAPI(message);

        const { channel } = message;
        const reactions = typeof emoji === 'string' ? [emoji] : emoji;

        /* eslint-disable no-restricted-syntax, no-await-in-loop */
        for (const name of reactions) {
            try {
                await api.reactions.add({ name, timestamp, channel });
            } catch (err) {
                if (!ADD_REACTION_EXPECTED_ERRORS.includes(err.message)) throw err;
            }
        }
        /* eslint-enable no-restricted-syntax, no-await-in-loop */
    }

    public async removeReaction(
        message: BotkitMessage, timestamp: string, emoji: string | string[],
    ): Promise<void> {
        const api = await this.adapter.getAPI(message);

        const { channel } = message;
        const reactions = typeof emoji === 'string' ? [emoji] : emoji;

        /* eslint-disable no-restricted-syntax, no-await-in-loop */
        for (const name of reactions) {
            try {
                await api.reactions.remove({ name, timestamp, channel });
            } catch (err) {
                if (err.message !== 'An API error occurred: no_reaction') throw err;
            }
        }
        /* eslint-enable no-restricted-syntax, no-await-in-loop */
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

    public async sendMessage(message: BotkitMessage, text: string) {
        const api = await this.adapter.getAPI(message);

        return api.chat.postMessage({
            'text': text,
            'channel': message.channel,
        });
    }

    public async sendSnippet(
        message: BotkitMessage, text: string, fileProperties?: FilesUploadArguments,
    ) {
        const api = await this.adapter.getAPI(message);

        return api.files.upload({
            'content': text,
            'channels': message.channel,
            ...fileProperties,
        });
    }
}

const slack = new Slack();

export default slack;
