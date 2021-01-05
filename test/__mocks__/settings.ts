import { ISettingsModel } from '../../src/api/mongo';

const DEFAULT_SETTINGS = {
    timezone: '',
    cron: {
        notifyRanking: {
            enabled: false,
            pattern: '',
        },
        openRequests: {
            enabled: false,
            pattern: '',
            hours: 0,
        },
        fetchRequestsUpdates: {
            enabled: false,
            pattern: '',
        },
    },
    gitlab: {
        host: '',
        apiVersion: '',
        personalToken: '',
    },
    slack: {
        secret: '',
        token: '',
        verificationToken: '',
        webhookPath: '',
        requestAddColor: 'good',
        allowedChannels: '',
        reactions: {
            discussion: 'speech_balloon',
            merged: 'heavy_check_mark',
            closed: 'x',
        },
        log: {
            enable: false,
            channelId: '',
            maxTextMessageSize: 0,
        },
    },
    mongo: {
        uri: '',
        collectionPrefix: '',
    },
    sentryUrl: '',
};

export default DEFAULT_SETTINGS as unknown as ISettingsModel;
