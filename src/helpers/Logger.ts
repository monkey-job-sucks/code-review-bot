import { EventEmitter } from 'events';

/* eslint-disable no-unused-vars */
enum ELevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
}
/* eslint-enable no-unused-vars */

class Logger {
    private SHOULD_LOG_ON_SLACK: boolean;

    private event: EventEmitter;

    constructor() {
        this.SHOULD_LOG_ON_SLACK = process.env.SHOULD_LOG_ON_SLACK === 'true';

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

    private log(level: ELevel, message: string) {
        const logKey = level === ELevel.DEBUG ? ELevel.INFO : level;

        console[logKey](message);

        const canSendToSlack = this.SHOULD_LOG_ON_SLACK && level !== ELevel.DEBUG;

        // TODO: implementar chamada ao slack
        if (canSendToSlack) console.log();
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
