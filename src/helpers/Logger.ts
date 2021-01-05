import { EventEmitter } from 'events';
// eslint-disable-next-line no-unused-vars
import { BotkitMessage } from 'botkit';

/* eslint-disable no-unused-vars */
import { ISettingsModel } from '../api/mongo';
import { Slack } from '../api/slack/slack.service';

enum ELevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
}
/* eslint-enable no-unused-vars */

class Logger {
    private SHOULD_LOG_ON_SLACK: boolean;

    private SLACK_LOG_CHANNEL_ID: string;

    private SLACK_LOG_MAX_TEXT_MESSAGE_SIZE: number;

    private event: EventEmitter;

    private slack: Slack;

    public init(settings: ISettingsModel, slack: Slack) {
        this.slack = slack;

        this.SHOULD_LOG_ON_SLACK = settings.slack.log.enabled;
        this.SLACK_LOG_CHANNEL_ID = settings.slack.log.channelId;
        this.SLACK_LOG_MAX_TEXT_MESSAGE_SIZE = settings.slack.log.maxTextMessageSize;

        this.event = new EventEmitter();

        this.event.on(ELevel.DEBUG, (message: string) => {
            this.log(ELevel.DEBUG, message);
        });

        this.event.on(ELevel.INFO, (message: string) => {
            this.log(ELevel.INFO, message);
        });

        this.event.on(ELevel.WARN, (message: string) => {
            this.log(ELevel.WARN, message);
        });

        this.event.on(ELevel.ERROR, (message: string) => {
            this.log(ELevel.ERROR, message);
        });
    }

    private async log(level: ELevel, message: string) {
        const logKey = level === ELevel.DEBUG ? ELevel.INFO : level;
        const logMessage = `[${new Date().toISOString()}] ${message}`;

        // eslint-disable-next-line no-console
        console[logKey](logMessage);

        const canSendToSlack = this.SHOULD_LOG_ON_SLACK && level !== ELevel.DEBUG;

        if (canSendToSlack) await this.sendToSlack(level, logMessage);
    }

    private sendToSlack(level: ELevel, message: string) {
        const to = { 'channel': this.SLACK_LOG_CHANNEL_ID } as BotkitMessage;

        if (message.length >= this.SLACK_LOG_MAX_TEXT_MESSAGE_SIZE) {
            return this.slack.sendSnippet(to, message, { 'filename': level });
        }

        return this.slack.sendMessage(to, `[${level}] ${message}`);
    }

    debug(message: string | any) {
        if (typeof message === 'string') return this.event.emit(ELevel.DEBUG, message);

        return this.event.emit(ELevel.DEBUG, JSON.stringify(message));
    }

    info(message: string | any) {
        if (typeof message === 'string') return this.event.emit(ELevel.INFO, message);

        return this.event.emit(ELevel.INFO, JSON.stringify(message));
    }

    warn(message: string | any) {
        if (typeof message === 'string') return this.event.emit(ELevel.WARN, message);

        return this.event.emit(ELevel.WARN, JSON.stringify(message));
    }

    error(message: string | any) {
        if (typeof message === 'string') return this.event.emit(ELevel.ERROR, message);

        return this.event.emit(ELevel.ERROR, JSON.stringify(message));
    }
}

const logger = new Logger();

export default logger;
