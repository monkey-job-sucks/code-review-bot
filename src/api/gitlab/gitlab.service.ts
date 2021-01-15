/* eslint-disable no-unused-vars */
import axios, { AxiosInstance } from 'axios';

import helper from './gitlab.helper';
import Sentry from '../../helpers/Sentry';
import {
    IGitlabMergeRequest,
    EGitlabMergeRequestResource,
    IGitlabMergeRequestUrlInfo,
    IGitlabMergeRequestReaction,
    IGitlabMergeRequestDiscussion,
} from './gitlab.interfaces';
import { ISettingsModel } from '../mongo';
/* eslint-enable no-unused-vars */
import Message from '../../helpers/Message';

// TODO:
// pegar discussions

class Gitlab {
    private host: string;

    private token: string;

    private apiVersion: string;

    private api: AxiosInstance;

    public init(settings: ISettingsModel): void {
        this.host = settings.gitlab.host;
        this.token = settings.gitlab.personalToken;
        this.apiVersion = settings.gitlab.apiVersion;

        this.api = axios.create({
            'baseURL': `${this.host}/api/${this.apiVersion}`,
            'headers': {
                'Private-Token': this.token,
            },
        });
    }

    public itsMine(url: string): boolean {
        return url.startsWith(this.host);
    }

    // TODO: aceitar url ou repository e id
    public async getMergeRequestDetail(url: string): Promise<IGitlabMergeRequest> {
        let info: IGitlabMergeRequestUrlInfo;

        try {
            if (!this.itsMine(url)) {
                throw new Message('Não posso aceitar mrs desse git :disappointed:');
            }

            info = helper.getUrlInfo(url);

            if (!info.id || !info.repository) {
                throw new Message('Não consegui identificar o mr nesse link :disappointed:');
            }
        } catch (err) {
            const captureOptions = {
                'tags': {
                    'fileName': 'gitlab.service',
                },
                'context': {
                    'name': 'getMergeRequestDetail',
                    'data': {
                        'method': 'getUrlInfo',
                        'url': url,
                    },
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

            throw new Message('Tive um problema para identificar o mr nesse link :disappointed:');
        }

        const encodedRepository = encodeURIComponent(info.repository);

        try {
            const response = await this.api({
                'method': 'GET',
                'url': `/projects/${encodedRepository}/merge_requests/${info.id}/${EGitlabMergeRequestResource.DETAIL}`,
            });

            return {
                'info': info,
                'url': response.data.web_url,
                'repository': info.repository,
                'detail': response.data,
            };
        } catch (err) {
            const captureOptions = {
                'tags': {
                    'fileName': 'gitlab.service',
                },
                'context': {
                    'name': 'getMergeRequestDetail',
                    'data': {
                        'url': url,
                        'method': 'this.api',
                        'encodedRepository': encodedRepository,
                        'info': JSON.stringify(info),
                    },
                },
            };

            if (err.response && err.response.status === 404) {
                Sentry.capture(err, {
                    'level': Sentry.level.Warning,
                    ...captureOptions,
                });

                throw new Message('Não encontrei esse mr, o link está certo? :thinking_face:');
            }

            Sentry.capture(err, {
                'level': Sentry.level.Error,
                ...captureOptions,
            });

            throw new Message('Tive um problema pra buscar os detalhes desse mr :disappointed:');
        }
    }

    // TODO: aceitar url ou repository e id
    public async getMergeRequestReactions(url: string): Promise<IGitlabMergeRequestReaction[]> {
        const info: IGitlabMergeRequestUrlInfo = helper.getUrlInfo(url);

        const encodedRepository = encodeURIComponent(info.repository);

        const response = await this.api({
            'method': 'GET',
            'url': `/projects/${encodedRepository}/merge_requests/${info.id}/${EGitlabMergeRequestResource.EMOJIS}`,
        });

        return response.data;
    }

    public async getMergeRequestDiscussions(url: string): Promise<IGitlabMergeRequestDiscussion[]> {
        const info: IGitlabMergeRequestUrlInfo = helper.getUrlInfo(url);

        const encodedRepository = encodeURIComponent(info.repository);

        const response = await this.api({
            'method': 'GET',
            'url': `/projects/${encodedRepository}/merge_requests/${info.id}/${EGitlabMergeRequestResource.DISCUSSIONS}`,
        });

        return response.data;
    }
}

const gitlab = new Gitlab();

export default gitlab;
