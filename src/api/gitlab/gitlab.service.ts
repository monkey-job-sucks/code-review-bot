/* eslint-disable no-unused-vars */
import axios, { AxiosInstance } from 'axios';

import helper from './gitlab.helper';
import {
    IGitlabMergeRequest,
    EGitlabMergeRequestResource,
    IGitlabMergeRequestUrlInfo,
} from './gitlab.interfaces';
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

    public async getMergeRequestDetail(url: string): Promise<IGitlabMergeRequest> {
        const info: IGitlabMergeRequestUrlInfo = helper.getUrlInfo(url);

        const encodedRepository = encodeURIComponent(info.repository);

        const response = await this.api({
            'method': 'GET',
            'url': `/projects/${encodedRepository}/merge_requests/${info.id}/${EGitlabMergeRequestResource.DETAIL}`,
        });

        const merge = {
            'repository': info.repository,
            'detail': response.data,
        };

        return merge;
    }
}

const gitlab = new Gitlab();

export default gitlab;
