import * as mongoose from 'mongoose';

import mergeRequestSchema from './schemas/merge-request.schema';

const COLLECTION_PREFIX = (process.env.MONGO_COLLECTIONS_PREFIX || '').toUpperCase();

mongoose.connect(process.env.MONGO_URI, {
    'useNewUrlParser': true,
});

const buildCollectionName = (name: string): string => {
    return `${COLLECTION_PREFIX}${name}`;
};

const mergeRequestCollectionName = buildCollectionName('MergeRequest');

// eslint-disable-next-line import/prefer-default-export
export const MergeRequest = mongoose.model(
    mergeRequestCollectionName,
    mergeRequestSchema,
    mergeRequestCollectionName,
);
