import { Schema, SchemaTypes } from 'mongoose';

const {
    String,
    Number,
    Boolean,
} = SchemaTypes;

const schema = new Schema({
    'shouldLogOnSlack': Boolean,
    'cron': {
        'notifyRanking': {
            'enabled': Boolean,
            'pattern': String,
            'hours': Number,
        },
        'openRequests': {
            'enabled': Boolean,
            'pattern': String,
        },
        'fetchRequestsUpdates': {
            'enabled': Boolean,
            'pattern': String,
        },
    },
    'gitlab': {
        'host': String,
        'apiVersion': String,
        'personalToken': String,
    },
    'azure': {
        'host': String,
        'apiVersion': String,
        'personalToken': String,
    },
    'slack': {
        'secret': String,
        'token': String,
        'verificationToken': String,
        'webhookPath': String,
        'requestAddColor': String,
        'allowedChannels': String,
        'reactions': {
            'discussion': String,
            'merged': String,
            'closed': String,
        },
        'log': {
            'enabled': Boolean,
            'channelId': String,
            'maxTextMessageSize': Number,
        },
    },
}, { 'strict': false, 'autoIndex': false });

export default schema;
