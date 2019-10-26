import { Schema, SchemaTypes } from 'mongoose';

const {
    Date,
    String,
    Boolean,
} = SchemaTypes;

const actionLogSchema = new Schema({
    'at': Date,
    'by': String,
}, { '_id': false });

const slackChannelSchema = new Schema({
    'id': String,
    'name': String,
}, { '_id': false });

const slackSchema = new Schema({
    'messageId': String,
    'reactions': { 'type': [String], 'default': [] },
    'channel': slackChannelSchema,
}, { '_id': false });

// TODO:
// colocar mergedat e closeat na mesma data e tratar por status
// trocar os campos raw por um "any", Mixed não funcionou :(
const schema = new Schema({
    'rawMergeRequest': String,
    'rawSlackMessage': String,
    'url': String,
    'repository': String,
    'id': String,
    'iid': String,
    'created': actionLogSchema,
    'added': actionLogSchema,
    'merged': actionLogSchema,
    'closed': actionLogSchema,
    'slack': slackSchema,
    'done': { 'type': Boolean, 'default': false },
    'analytics': {
        'upvoters': { 'type': [String], 'default': [] },
        'reviewers': { 'type': [String], 'default': [] },
    },
}, { 'strict': false, 'autoIndex': false });

schema.index({ 'done': 1 });

export default schema;
