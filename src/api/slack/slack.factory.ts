import * as moment from 'moment';
/* eslint-disable no-unused-vars */
import { MessageAttachment } from '@slack/web-api';

import { IGitlabMergeRequest } from '../gitlab';
import { IChannelMergeRequests } from '../mongo';
import { IRanking } from '../../job/rankings/rankings.interface';
/* eslint-enable no-unused-vars */

moment.locale('pt-br');

const rankingEmojis = [':first_place_medal:', ':second_place_medal:', ':third_place_medal:'];

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

const generateRankingMessage = (ranking: IRanking): string => {
    const messages: string[] = [];

    if (ranking.upvoters.length > 0 || ranking.reviewers.length > 0) {
        messages.push(`<!here>, esse é o ranking ${ranking.period}:`);

        if (ranking.upvoters.length > 0) {
            messages.push('Quem mais deu likes');

            ranking.upvoters.slice(0, rankingEmojis.length).forEach((user, i) => {
                messages.push(`${rankingEmojis[i]} (${user.total}) ${user.username}`);
            });
        }

        // blank line
        if (ranking.upvoters.length > 0 && ranking.reviewers.length > 0) messages.push('');

        if (ranking.reviewers.length > 0) {
            messages.push('Quem mais iniciou discussions');

            ranking.reviewers.slice(0, rankingEmojis.length).forEach((user, i) => {
                messages.push(`${rankingEmojis[i]} (${user.total}) ${user.username}`);
            });
        }
    }

    return messages.join('\r');
};

export default {
    generateRankingMessage,
    generateAddedMergeRequestMessage,
    generateDelayedMergeRequestsMessage,
};
