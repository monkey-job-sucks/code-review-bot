import * as mongoose from 'mongoose';

import {
    SettingsModel,
    ReviewRequestModel,
} from './mongo.interfaces';
import reviewRequestSchema from './schemas/review-request.schema';
import settingsSchema from './schemas/settings.schema';
import logger from '../../helpers/Logger';

const COLLECTION_PREFIX = (process.env.MONGO_COLLECTION_PREFIX || '').toUpperCase();

const buildCollectionName = (name: string): string => `${COLLECTION_PREFIX}${name}`;

const handleMongoError = (err: any) => {
    logger.error(err);

    process.exit(1);
};

mongoose.connect(process.env.MONGO_URI, {
    'useNewUrlParser': true,
    'useUnifiedTopology': true,
}).catch(handleMongoError);

mongoose.connection.on('error', handleMongoError);

const reviewRequestCollectionName = buildCollectionName('ReviewRequest');
export const ReviewRequest = mongoose.model<ReviewRequestModel>(
    reviewRequestCollectionName,
    reviewRequestSchema,
    reviewRequestCollectionName,
);

const settingsCollectionName = buildCollectionName('Settings');
export const Settings = mongoose.model<SettingsModel>(
    settingsCollectionName,
    settingsSchema,
    settingsCollectionName,
);
