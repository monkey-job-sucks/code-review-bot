/* eslint-disable no-unused-vars */
import axios, { AxiosRequestConfig } from 'axios';

import helper from './gitlab.helper';
import {
    IGitlabMergeRequest,
    EGitlabMergeRequestResource,
    IGitlabMergeRequestUrlInfo,
    IGitlabMergeRequestDetail,
} from './gitlab.interfaces';

// TODO:
// pegar discussions

class Gitlab {
    private host: string;

    private token: string;

    private apiVersion: string;

    private api: string;

    constructor() {
        this.host = process.env.GITLAB_HOST;
        this.token = process.env.GITLAB_PERSONAL_TOKEN;
        this.apiVersion = process.env.GITLAB_API_VERSION;

        this.api = `${this.host}/api/${this.apiVersion}`;
    }

    private async request(params: AxiosRequestConfig) {
        return axios({
            'headers': {
                'Private-Token': this.token,
            },
            ...params,
        });
    }

    private async fetchCommitDetail(repository: string, sha: string): Promise<any> {
        const response = await this.request({
            'method': 'GET',
            'url': `${this.api}/projects/${encodeURIComponent(repository)}/repository/commits/${sha}`,
        });

        return response.data;
    }

    private async fetchMergeRequestDetail(info: IGitlabMergeRequestUrlInfo): Promise<any> {
        const response = await this.request({
            'method': 'GET',
            'url': `${this.api}/projects/${encodeURIComponent(info.repository)}/merge_requests/${info.id}/${EGitlabMergeRequestResource.DETAIL}`,
        });

        return response.data;
    }

    public async getMergeRequestDetail(
        url: string,
        shouldGetCommitDetails: boolean = false,
    ): Promise<IGitlabMergeRequest> {
        const info: IGitlabMergeRequestUrlInfo = helper.getUrlInfo(url);

        const mergeRequestDetail: IGitlabMergeRequestDetail = await this.fetchMergeRequestDetail(
            info,
        );

        const merge = {
            'repository': info.repository,
            'detail': mergeRequestDetail,
        };

        if (!shouldGetCommitDetails) return merge;

        const sha = merge.detail.merge_commit_sha || merge.detail.sha;

        const commitDetail = await this.fetchCommitDetail(info.repository, sha);

        return {
            ...merge,
            'changes': {
                'additions': commitDetail.stats.additions,
                'deletions': commitDetail.stats.deletions,
            },
        };
    }
}

const gitlab = new Gitlab();

export default gitlab;
