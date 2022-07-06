import {
    Settings,
    SettingsModel,
} from './api/mongo';

const DEFAULT_SETTINGS: Partial<SettingsModel> = {
    'cron': {
        'notifyRanking': {
            'enabled': false,
            'pattern': '',
        },
        'openRequests': {
            'enabled': false,
            'pattern': '',
            'hours': 0,
        },
        'fetchRequestsUpdates': {
            'enabled': false,
            'pattern': '',
            'concurrence': 10,
        },
    },
    'gitlab': {
        'host': '',
        'apiVersion': '',
        'personalToken': '',
    },
    'azure': {
        'host': '',
        'apiVersion': '',
        'personalToken': '',
    },
    'slack': {
        'secret': '',
        'token': '',
        'verificationToken': '',
        'webhookPath': '',
        'requestAddColor': 'good',
        'allowedChannels': '',
        'reactions': {
            'discussion': 'speech_balloon',
            'merged': 'heavy_check_mark',
            'closed': 'x',
        },
        'minUpvoters': 3,
        'log': {
            'enabled': false,
            'channelId': '',
            'maxTextMessageSize': 0,
        },
    },
};

const settings: Partial<SettingsModel> = {};

// eslint-disable-next-line import/prefer-default-export
export const loadSettings = async (): Promise<SettingsModel> => {
    const document = await Settings.findOne();

    if (!document) {
        await Settings.create(DEFAULT_SETTINGS);

        process.exit(1);
    }

    settings.cron = document.cron;
    settings.gitlab = document.gitlab;
    settings.azure = document.azure;
    settings.slack = document.slack;

    return settings as SettingsModel;
};

Settings.watch().on('change', () => process.exit(0));
