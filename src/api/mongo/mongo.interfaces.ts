/* eslint-disable import/prefer-default-export, no-unused-vars */
import { Document } from 'mongoose';

export enum EReviewRequestOrigin {
    GITLAB = 'gitlab',
    AZURE = 'azure',
}

export interface IReviewRequestModel extends Document {
    rawReviewRequest: string;
    rawSlackMessage: string;
    origin: EReviewRequestOrigin;
    repository: string;
    id: string;
    gitlab?: IReviewRequestGitlab;
    azure?: IReviewRequestAzure;
    url: string;
    created: IReviewRequestModelActionLog;
    added: IReviewRequestModelActionLog;
    merged?: IReviewRequestModelActionLog;
    closed?: IReviewRequestModelActionLog;
    slack: IReviewRequestModelSlack;
    analytics?: IReviewRequestModelAnalytics;
    done?: boolean;
}

export interface IReviewRequestGitlab {
    iid: string;
}

export interface IReviewRequestAzure {
    organization: string;
    project: string;
}

export interface IChannelReviewRequests {
    _id: string;
    reviews?: IReviewRequestModel[];
}

export interface IReviewRequestModelActionLog {
    at: Date;
    by: string;
}

interface IReviewRequestModelAnalytics {
    upvoters: string[];
    reviewers: string[];
}

interface IReviewRequestModelSlack {
    messageId: string;
    reactions?: string[];
    channel: IMergeRequestModelSlackChannel;
}

interface IMergeRequestModelSlackChannel {
    id: string;
    name: string;
}

interface ISettingsGitlab {
    host: string;
    apiVersion: string;
    personalToken: string;
}

interface ISettingsSlackReactions {
    discussion: string;
    merged: string;
    closed: string;
}

interface ISettingsSlackLog {
    enabled: boolean;
    channelId: string;
    maxTextMessageSize: number;
}

interface ISettingsSlack {
    secret: string;
    token: string;
    verificationToken: string;
    webhookPath: string;
    requestAddColor: string;
    allowedChannels: string;
    reactions: ISettingsSlackReactions,
    log: ISettingsSlackLog;
}

interface ISettingsModelCronBase {
    enabled: boolean;
    pattern: string;
}

interface ISettingsModelCronOpenRequests extends ISettingsModelCronBase {
    hours: number;
}

interface ISettingsModelCron {
    notifyRanking: ISettingsModelCronBase,
    openRequests: ISettingsModelCronOpenRequests,
    fetchRequestsUpdates: ISettingsModelCronBase,
}

interface ISettingsAzure {
    host: string;
    apiVersion: string;
    personalToken: string;
}

export interface ISettingsModel extends Document {
    cron: ISettingsModelCron,
    gitlab?: ISettingsGitlab,
    azure?: ISettingsAzure,
    slack: ISettingsSlack,
}
