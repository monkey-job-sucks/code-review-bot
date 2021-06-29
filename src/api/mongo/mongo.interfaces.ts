/* eslint-disable import/prefer-default-export */
import { Document } from 'mongoose';

export enum EReviewRequestOrigin {
    GITLAB = 'gitlab',
    AZURE = 'azure',
}

export interface ReviewRequestModel extends Document {
    rawReviewRequest: string;
    rawSlackMessage: string;
    origin: EReviewRequestOrigin;
    repository: string;
    id: string;
    gitlab?: ReviewRequestGitlab;
    azure?: ReviewRequestAzure;
    url: string;
    created: ReviewRequestModelActionLog;
    added: ReviewRequestModelActionLog;
    merged?: ReviewRequestModelActionLog;
    closed?: ReviewRequestModelActionLog;
    slack: ReviewRequestModelSlack;
    analytics?: ReviewRequestModelAnalytics;
    done?: boolean;
}

export interface ReviewRequestGitlab {
    iid: string;
}

export interface ReviewRequestAzure {
    organization: string;
    project: string;
}

export interface ChannelReviewRequests {
    _id: string;
    reviews?: ReviewRequestModel[];
}

export interface ReviewRequestModelActionLog {
    at: Date;
    by: string;
}

interface ReviewRequestModelAnalytics {
    upvoters: string[];
    reviewers: string[];
}

interface ReviewRequestModelSlack {
    messageId: string;
    reactions?: string[];
    channel: MergeRequestModelSlackChannel;
}

interface MergeRequestModelSlackChannel {
    id: string;
    name: string;
}

interface SettingsGitlab {
    host: string;
    apiVersion: string;
    personalToken: string;
}

interface SettingsSlackReactions {
    discussion: string;
    merged: string;
    closed: string;
}

interface SettingsSlackLog {
    enabled: boolean;
    channelId: string;
    maxTextMessageSize: number;
}

interface SettingsSlack {
    secret: string;
    token: string;
    verificationToken: string;
    webhookPath: string;
    requestAddColor: string;
    allowedChannels: string;
    reactions: SettingsSlackReactions;
    log: SettingsSlackLog;
}

interface SettingsModelCronBase {
    enabled: boolean;
    pattern: string;
}

interface SettingsModelCronOpenRequests extends SettingsModelCronBase {
    hours: number;
}

interface SettingsModelCronFetchRequests extends SettingsModelCronBase {
    concurrence: number;
}

interface SettingsModelCron {
    notifyRanking: SettingsModelCronBase;
    openRequests: SettingsModelCronOpenRequests;
    fetchRequestsUpdates: SettingsModelCronFetchRequests;
}

interface SettingsAzure {
    host: string;
    apiVersion: string;
    personalToken: string;
}

export interface SettingsModel extends Document {
    cron: SettingsModelCron;
    gitlab?: SettingsGitlab;
    azure?: SettingsAzure;
    slack: SettingsSlack;
}
