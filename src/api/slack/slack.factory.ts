/* eslint-disable no-unused-vars */
import * as moment from 'moment';
import { MessageAttachment } from '@slack/web-api';

import { IGitlabMergeRequest } from '../gitlab';
import { IChannelMergeRequests } from '../mongo';
/* eslint-enable no-unused-vars */

moment.locale('pt-br');

const generateAddedMergeRequestMessage = (
    user: string,
    mr: IGitlabMergeRequest,
): MessageAttachment => {
    const { repository, detail } = mr;

    const title = `MR #${detail.iid} adicionado por <@${user}> em ${repository}`;

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

const generateDelayedMergeRequestsMessage = (delayedMrs: IChannelMergeRequests): string => {
    const messages: string[] = [];

    messages.push('<!channel>, temos MRs abertos ainda:');

    delayedMrs.mrs.forEach((mr) => {
        const openedSince = moment(mr.added.at).fromNow(true);

        messages.push(`<${mr.url}|${mr.repository} #${mr.iid}> adicionado ${openedSince} atrás`);
    });

    return messages.join('\r');
};

export default {
    generateAddedMergeRequestMessage,
    generateDelayedMergeRequestsMessage,
};
