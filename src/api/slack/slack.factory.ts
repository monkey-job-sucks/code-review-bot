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

    const title = `<@${user}> adicionou o MR #${detail.iid} ${repository}`;

    return {
        'title': title,
        'title_link': detail.web_url,
    };
};

const generateDelayedMergeRequestsMessage = (delayedMrs: IChannelMergeRequests): string => {
    const messages: string[] = [];

    messages.push('<!here>, ainda temos MRs abertos:');

    delayedMrs.mrs.forEach((mr) => {
        const openedSince = moment(mr.added.at).fromNow();

        messages.push(`<${mr.url}|#${mr.iid} ${mr.repository}> adicionado ${openedSince}`);
    });

    return messages.join('\r');
};

export default {
    generateAddedMergeRequestMessage,
    generateDelayedMergeRequestsMessage,
};
