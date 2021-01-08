/* eslint-disable prefer-arrow-callback, no-empty */
// this is disable because `withScope` needs
// function instead of arrow function
import * as SentryNode from '@sentry/node';
// eslint-disable-next-line no-unused-vars
import * as Tracing from '@sentry/tracing';
import Context from './Context';

interface SimpleObject {
    [key: string]: string;
}

interface CaptureContext {
    name: string;
    data: SimpleObject;
}

interface CaptureOptions {
    level: SentryNode.Severity;
    tags?: SimpleObject;
    context?: CaptureContext;
}

const init = (url: string) => {
    SentryNode.init({
        'dsn': url,
        'tracesSampleRate': 1.0,
        'environment': process.env.NODE_ENV || 'production',
    });
};

const capture = (exception: unknown, options: CaptureOptions) => {
    const captureOptions: any = {
        'level': options.level || SentryNode.Severity.Error,
        'tags': options.tags,
    };

    const context = Context.getContext();

    if (context) {
        captureOptions.tags.contextId = context.id;

        captureOptions.user = {
            'id': `${context.user.team.id}|${context.user.channel.id}|${context.user.id}`,
            'name': context.user.name,
            'team': context.user.team,
            'channel': context.user.channel,
        };
    }

    if (options.context) {
        captureOptions.contexts = {};
        captureOptions.contexts[options.context.name] = options.context.data;
    }

    SentryNode.captureException(exception, captureOptions);
};

export default {
    'init': init,
    'capture': capture,
    'level': SentryNode.Severity,
};
