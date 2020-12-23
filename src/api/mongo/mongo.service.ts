import * as mongoose from 'mongoose';

import mergeRequestSchema from './schemas/merge-request.schema';
// eslint-disable-next-line no-unused-vars
import { IMergeRequestModel } from './mongo.interfaces';
import logger from '../../helpers/Logger';

const COLLECTION_PREFIX = (process.env.MONGO_COLLECTIONS_PREFIX || '').toUpperCase();

const handleMongoError = (err: any) => {
    logger.error(err);

    process.exit(1);
};

mongoose.connect(process.env.MONGO_URI, {
    'useNewUrlParser': true,
    'useUnifiedTopology': true,
}).catch(handleMongoError);

mongoose.connection.on('error', handleMongoError);

const buildCollectionName = (name: string): string => `${COLLECTION_PREFIX}${name}`;

const mergeRequestCollectionName = buildCollectionName('MergeRequest');

// eslint-disable-next-line import/prefer-default-export
export const MergeRequest = mongoose.model<IMergeRequestModel>(
    mergeRequestCollectionName,
    mergeRequestSchema,
    mergeRequestCollectionName,
);
