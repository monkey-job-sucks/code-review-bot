/* eslint-disable no-unused-vars */
import axios, { AxiosInstance } from 'axios';

import helper from './gitlab.helper';
import {
    IGitlabMergeRequest,
    EGitlabMergeRequestResource,
    IGitlabMergeRequestUrlInfo,
    IGitlabMergeRequestReaction,
    IGitlabMergeRequestDiscussion,
} from './gitlab.interfaces';
import Message from '../../helpers/Message';
/* eslint-enable no-unused-vars */

// TODO:
// pegar discussions

class Gitlab {
    private host: string;

    private token: string;

    private apiVersion: string;

    private api: AxiosInstance;

    constructor() {
        this.host = process.env.GITLAB_HOST;
        this.token = process.env.GITLAB_PERSONAL_TOKEN;
        this.apiVersion = process.env.GITLAB_API_VERSION;

        this.api = axios.create({
            'baseURL': `${this.host}/api/${this.apiVersion}`,
            'headers': {
                'Private-Token': this.token,
            },
        });
    }

    // TODO: aceitar url ou repository e id
    public async getMergeRequestDetail(url: string): Promise<IGitlabMergeRequest> {
        let info: IGitlabMergeRequestUrlInfo;

        try {
            info = helper.getUrlInfo(url);

            if (!info.id || !info.repository) {
                throw new Message('Não consegui identificar o mr nesse link :disappointed:');
            }
        } catch (err) {
            if (err instanceof Message) throw err;

            throw new Message('Tive um problema para identificar o mr nesse link :disappointed:');
        }

        const encodedRepository = encodeURIComponent(info.repository);

        try {
            const response = await this.api({
                'method': 'GET',
                'url': `/projects/${encodedRepository}/merge_requests/${info.id}/${EGitlabMergeRequestResource.DETAIL}`,
            });

            const merge = {
                'repository': info.repository,
                'detail': response.data,
            };

            return merge;
        } catch (err) {
            if (err.response && err.response.status === 404) {
                throw new Message('Não encontrei esse mr, o link está certo? :thinking_face:');
            }

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
