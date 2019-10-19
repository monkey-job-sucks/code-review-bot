import { EventEmitter } from 'events';

/* eslint-disable no-unused-vars */
enum ELevel {
    INFO = 'info',
    WANR = 'warn',
    ERROR = 'error',
}
/* eslint-enable no-unused-vars */

class Logger {
    private SHOULD_LOG_ON_SLACK: boolean;

    private event: EventEmitter;

    constructor() {
        this.SHOULD_LOG_ON_SLACK = process.env.SHOULD_LOG_ON_SLACK === 'true';

        this.event = new EventEmitter();

        this.event.on(ELevel.INFO, (message: string) => {
            this.log(ELevel.INFO, message);
        });

        this.event.on(ELevel.WANR, (message: string) => {
            this.log(ELevel.WANR, message);
        });

        this.event.on(ELevel.ERROR, (message: string) => {
            this.log(ELevel.ERROR, message);
        });
    }

    private log(level: ELevel, message: string) {
        console[level](message);

        // TODO: implementar chamada ao slack
        if (this.SHOULD_LOG_ON_SLACK) console.log();
    }

    info(message: string) {
        this.event.emit(ELevel.INFO, message);
    }

    warn(message: string) {
        this.event.emit(ELevel.WANR, message);
    }

    error(message: string) {
        this.event.emit(ELevel.ERROR, message);
    }
}

const logger = new Logger();

export default logger;
