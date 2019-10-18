import * as mongoose from 'mongoose';

import mergeRequestSchema from './schemas/merge-request.schema';
// eslint-disable-next-line no-unused-vars
import { IMergeRequestModel } from './mongo.interfaces';

const COLLECTION_PREFIX = (process.env.MONGO_COLLECTIONS_PREFIX || '').toUpperCase();

mongoose.connect(process.env.MONGO_URI, {
    'useNewUrlParser': true,
    'useUnifiedTopology': true,
});

const buildCollectionName = (name: string): string => {
    return `${COLLECTION_PREFIX}${name}`;
};

const mergeRequestCollectionName = buildCollectionName('MergeRequest');

// eslint-disable-next-line import/prefer-default-export
export const MergeRequest = mongoose.model<IMergeRequestModel>(
    mergeRequestCollectionName,
    mergeRequestSchema,
    mergeRequestCollectionName,
);
