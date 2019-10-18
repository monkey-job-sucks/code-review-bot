/* eslint-disable no-unused-vars */
import { MessageAttachment } from '@slack/web-api';

import { IGitlabMergeRequest } from '../gitlab/gitlab.interfaces';
/* eslint-enable no-unused-vars */

// eslint-disable-next-line import/prefer-default-export
const generateMergeRequestMessage = (
    user: string,
    merge: IGitlabMergeRequest,
): MessageAttachment => {
    const { repository, detail } = merge;

    const title = `MR adicionado por <@${user}> em ${repository}`;

    const fields = [{
        'title': 'Origem',
        'value': detail.source_branch,
        'short': true,
    }, {
        'title': 'Destino',
        'value': detail.target_branch,
        'short': true,
    }];

    return {
        'title': title,
        'title_link': detail.web_url,
        'fields': fields,
    };
};

export default {
    generateMergeRequestMessage,
};
