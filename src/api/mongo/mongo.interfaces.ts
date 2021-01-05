// eslint-disable-next-line no-unused-vars
import { Document } from 'mongoose';

export interface IMergeRequestModel extends Document {
    rawMergeRequest: string;
    rawSlackMessage: string;
    url: string;
    repository: string;
    id: string;
    iid: string;
    created: IMergeRequestModelActionLog;
    added: IMergeRequestModelActionLog;
    merged?: IMergeRequestModelActionLog;
    closed?: IMergeRequestModelActionLog;
    slack: IMergeRequestModelSlack;
    done?: boolean;
    analytics?: IMergeRequestModelAnalytics;
}

export interface IChannelMergeRequests {
    _id: string;
    mrs?: IMergeRequestModel[];
}

export interface IMergeRequestModelActionLog {
    at: Date;
    by: string;
}

interface IMergeRequestModelAnalytics {
    upvoters: string[];
    reviewers: string[];
}

interface IMergeRequestModelSlack {
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
    enable: boolean;
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

export interface ISettingsModel extends Document {
    cron: ISettingsModelCron,
    gitlab: ISettingsGitlab,
    slack: ISettingsSlack,
}
