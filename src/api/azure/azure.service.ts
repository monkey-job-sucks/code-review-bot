/* eslint-disable no-unused-vars */
import axios, { AxiosInstance } from 'axios';

import Sentry from '../../helpers/Sentry';
import { ISettingsModel } from '../mongo';
import {
    IAzurePullRequest,
    IAzurePullRequestReviewer,
    IAzurePullRequestDetail,
    IAzurePullRequestThread,
} from './azure.interfaces';
/* eslint-enable no-unused-vars */
import Message from '../../helpers/Message';
import helper from './azure.helper';
import factory from './azure.factory';

class Azure {
    private host: string;

    private token: string;

    private apiVersion: string;

    private api: AxiosInstance;

    public init(settings: ISettingsModel): void {
        this.host = settings.azure.host;
        this.token = Buffer.from(`:${settings.azure.personalToken}`).toString('base64');
        this.apiVersion = settings.azure.apiVersion;

        this.api = axios.create({
            'baseURL': this.host,
            'headers': {
                'Authorization': `Basic ${this.token}`,
            },
            'params': {
                'api-version': this.apiVersion,
            },
        });
    }

    public itsMine(url: string): boolean {
        return url.startsWith(this.host);
    }

    public async getPullRequestDetail(url: string): Promise<IAzurePullRequest> {
        try {
            if (!this.itsMine(url)) {
                throw new Message('Não posso aceitar prs desse git :disappointed:');
            }

            const info = helper.getUrlInfo(this.host, url);

            if (!info.id) {
                throw new Message('Não consegui identificar o pr nesse link :disappointed:');
            }

            const response = await this.api({
                'method': 'GET',
                'url': `${info.organization}/${info.project}/_apis/git/pullrequests/${info.id}`,
            });

            return {
                'info': info,
                'url': `${this.host}/${info.organization}/${info.project}/_git/${response.data.repository.name}/pullrequest/${info.id}`,
                'repository': `${info.organization}/${info.project}/${info.repository}`,
                'detail': response.data,
            };
        } catch (err) {
            const captureOptions = {
                'tags': {
                    'fileName': 'azure.service',
                },
                'context': {
                    'name': 'getPullRequestDetail',
                    'data': {},
                },
            };

            if (err instanceof Message) {
                Sentry.capture(err, {
                    'level': Sentry.level.Warning,
                    ...captureOptions,
                });

                throw err;
            }

            Sentry.capture(err, {
                'level': Sentry.level.Error,
                ...captureOptions,
            });

            throw new Message('Tive um problema para identificar o pr nesse link :disappointed:');
        }
    }

    public async getPullRequestReviewers(url: string): Promise<IAzurePullRequestReviewer[]> {
        const info = helper.getUrlInfo(this.host, url);

        const response = await this.api({
            'method': 'GET',
            'url': `${info.organization}/${info.project}/_apis/git/pullrequests/${info.id}`,
        });

        return factory.getReviewers(response.data);
    }

    public async getPullRequestThreads(url: string): Promise<IAzurePullRequestThread[]> {
        const info = helper.getUrlInfo(this.host, url);

        const detailResponse = await this.api({
            'method': 'GET',
            'url': `${info.organization}/${info.project}/_apis/git/pullrequests/${info.id}`,
        });

        const pullRequest: IAzurePullRequestDetail = detailResponse.data;

        const threadResponse = await this.api({
            'method': 'GET',
            'url': `${info.organization}/${info.project}/_apis/git/repositories/${pullRequest.repository.id}/pullRequests/${info.id}/threads`,
        });

        return factory.getThreads(threadResponse.data);
    }
}

const azure = new Azure();

export default azure;
