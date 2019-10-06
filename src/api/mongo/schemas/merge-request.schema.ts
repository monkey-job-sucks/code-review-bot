import { Schema, SchemaTypes } from 'mongoose';

const {
    Map,
    Date,
    String,
    Boolean,
} = SchemaTypes;

const actionLogSchema = new Schema({
    'at': Date,
    'by': String,
}, { '_id': false });

// TODO:
// colocar mergedat e closeat na mesma data e tratar por status
// trocar os campos raw por um "any", Mixed não funcionou :(
const schema = new Schema({
    'rawMergeRequest': String,
    'rawSlackMessage': String,
    'created': actionLogSchema,
    'added': actionLogSchema,
    'merged': actionLogSchema,
    'closed': actionLogSchema,
    'slackMessageId': String,
    'done': { 'type': Boolean, 'default': false },
    'analytics': {
        'upvotes': { 'type': Map, 'of': String },
        'discussions': { 'type': Map, 'of': String },
    },
}, { 'strict': false, 'autoIndex': false });

schema.index({ 'done': 1 });

export default schema;
