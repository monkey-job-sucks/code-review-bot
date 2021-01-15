/* eslint-disable no-unused-vars */
import { BotWorker, BotkitMessage } from 'botkit';

import factory from './slack.factory';
import {
    ReviewRequest,
    IReviewRequestModel,
    EReviewRequestOrigin,
} from '../mongo';
import { service as gitlab, IGitlabMergeRequest } from '../gitlab';
import { service as azure, IAzurePullRequest } from '../azure';
/* eslint-enable no-unused-vars */
import slack from './slack.service';
import Message from '../../helpers/Message';

const saveOnMongo = async (
    reviewRequest: IGitlabMergeRequest | IAzurePullRequest,
    origin: EReviewRequestOrigin,
    message: BotkitMessage,
    slackMessageId: string,
) => {
    const model: Partial<IReviewRequestModel> = {
        'rawReviewRequest': JSON.stringify(reviewRequest),
        'rawSlackMessage': JSON.stringify(message),
        'origin': origin,
        'url': reviewRequest.url,
        'repository': reviewRequest.repository,
        'added': {
            'at': new Date(),
            'by': message.user,
        },
        'slack': {
            'channel': {
                'id': message.channel_id,
                'name': message.channel_name,
            },
            'messageId': String(slackMessageId),
        },
    };

    /* eslint-disable no-case-declarations */
    switch (origin) {
        case EReviewRequestOrigin.GITLAB:
            const mr = (reviewRequest as IGitlabMergeRequest);

            model.id = String(mr.detail.id);
            model.created = {
                'at': new Date(),
                'by': mr.detail.author.username,
            };

            model.gitlab = {
                'iid': String(mr.detail.iid),
            };
            break;
        case EReviewRequestOrigin.AZURE:
            const pr = (reviewRequest as IAzurePullRequest);

            model.id = String(pr.detail.pullRequestId);
            model.created = {
                'at': new Date(),
                'by': pr.detail.createdBy.uniqueName,
            };

            model.azure = {
                'organization': pr.info.organization,
                'project': pr.info.project,
            };
            break;
        default:
            break;
    }
    /* eslint-enable no-case-declarations */

    const document = new ReviewRequest(model);

    return document.save();
};

const validateReviewRequest = async (
    reviewRequest: IGitlabMergeRequest | IAzurePullRequest,
    origin: EReviewRequestOrigin,
): Promise<void> => {
    let id: number;

    switch (origin) {
        case EReviewRequestOrigin.GITLAB:
            id = (reviewRequest as IGitlabMergeRequest).detail.id;
            break;
        case EReviewRequestOrigin.AZURE:
            id = (reviewRequest as IAzurePullRequest).detail.pullRequestId;
            break;
        default:
            break;
    }

    const document = await ReviewRequest.find({
        'id': id,
        'origin': origin,
        'repository': reviewRequest.repository,
    });

    const hasReviewOnMongo = document.length > 0;

    if (hasReviewOnMongo) throw new Message('Já estou cuidando desse link :wink:');
};

const saveGitlabMR = async (bot: BotWorker, message: BotkitMessage) => {
    const mr = await gitlab.getMergeRequestDetail(message.text);

    await validateReviewRequest(mr, EReviewRequestOrigin.GITLAB);

    const slackMessage = factory.generateAddedReviewRequestMessage(
        message.user,
        mr.detail.iid,
        mr.repository,
        mr.url,
    );

    const { id } = await slack.mergeAdded(bot, message, slackMessage);

    const document = await saveOnMongo(mr, EReviewRequestOrigin.GITLAB, message, id);

    return document;
};

const saveAzurePR = async (bot: BotWorker, message: BotkitMessage) => {
    const pr = await azure.getPullRequestDetail(message.text);

    await validateReviewRequest(pr, EReviewRequestOrigin.AZURE);

    const slackMessage = factory.generateAddedReviewRequestMessage(
        message.user,
        pr.detail.pullRequestId,
        pr.repository,
        pr.url,
    );

    const { id } = await slack.mergeAdded(bot, message, slackMessage);

    const document = await saveOnMongo(pr, EReviewRequestOrigin.AZURE, message, id);

    return document;
};

export default {
    saveGitlabMR,
    saveAzurePR,
};
