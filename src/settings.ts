/* eslint-disable no-unused-vars */
import {
    Settings,
    ISettingsModel,
} from './api/mongo';
/* eslint-enable no-unused-vars */

const DEFAULT_SETTINGS: Partial<ISettingsModel> = {
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
        'log': {
            'enabled': false,
            'channelId': '',
            'maxTextMessageSize': 0,
        },
    },
};

const settings: Partial<ISettingsModel> = {};

// eslint-disable-next-line import/prefer-default-export
export const loadSettings = async (): Promise<ISettingsModel> => {
    const document = await Settings.findOne();

    if (!document) {
        await Settings.create(DEFAULT_SETTINGS);

        process.exit(1);
    }

    settings.cron = document.cron;
    settings.gitlab = document.gitlab;
    settings.azure = document.azure;
    settings.slack = document.slack;

    return settings as ISettingsModel;
};

Settings.watch().on('change', () => process.exit(0));
