import * as mongoose from 'mongoose';

/* eslint-disable no-unused-vars */
import {
    ISettingsModel,
    IReviewRequestModel,
} from './mongo.interfaces';
/* eslint-enable no-unused-vars */
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
export const ReviewRequest = mongoose.model<IReviewRequestModel>(
    reviewRequestCollectionName,
    reviewRequestSchema,
    reviewRequestCollectionName,
);

const settingsCollectionName = buildCollectionName('Settings');
export const Settings = mongoose.model<ISettingsModel>(
    settingsCollectionName,
    settingsSchema,
    settingsCollectionName,
);
