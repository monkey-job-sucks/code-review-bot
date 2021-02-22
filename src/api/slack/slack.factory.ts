import * as moment from 'moment';
/* eslint-disable no-unused-vars */
import { MessageAttachment } from '@slack/web-api';

import { IChannelReviewRequests, EReviewRequestOrigin } from '../mongo';
import { IRanking } from '../../job/rankings/rankings.interface';
/* eslint-enable no-unused-vars */

moment.locale('pt-br');

const rankingEmojis = [':first_place_medal:', ':second_place_medal:', ':third_place_medal:'];

const generateAddedReviewRequestMessage = (
    slackUser: string,
    id: number,
    repository: string,
    url: string,
): MessageAttachment => {
    const title = `<@${slackUser}> adicionou #${id} ${repository}`;

    return {
        'title': title,
        'title_link': url,
    };
};

const generateDelayedReviewRequestsMessage = (delayedRequests: IChannelReviewRequests): string => {
    const messages: string[] = [];

    messages.push('<!here>, ainda temos os seguintes reviews abertos:');

    delayedRequests.reviews.forEach((review) => {
        const openedSince = moment(review.added.at).fromNow();

        switch (review.origin) {
            case EReviewRequestOrigin.GITLAB:
                messages.push(`<${review.url}|#${review.gitlab.iid} ${review.repository}> adicionado ${openedSince}`);
                break;
            case EReviewRequestOrigin.AZURE:
                messages.push(`<${review.url}|#${review.id} ${review.repository}> adicionado ${openedSince}`);
                break;
            default:
                break;
        }
    });

    return messages.join('\r');
};

const generateRankingMessage = (ranking: IRanking): string => {
    const messages: string[] = [];

    if (ranking.upvoters.length > 0 || ranking.reviewers.length > 0) {
        messages.push(`<!here>, esse é o ranking de reviews aceitos ${ranking.period}:`);

        if (ranking.upvoters.length > 0) {
            messages.push('Quem mais deu likes');

            ranking.upvoters.slice(0, rankingEmojis.length).forEach((user, i) => {
                messages.push(`${rankingEmojis[i]} (${user.total}) ${user.username}`);
            });
        }

        // blank line
        if (ranking.upvoters.length > 0 && ranking.reviewers.length > 0) messages.push('');

        if (ranking.reviewers.length > 0) {
            messages.push('Quem mais iniciou threads');

            ranking.reviewers.slice(0, rankingEmojis.length).forEach((user, i) => {
                messages.push(`${rankingEmojis[i]} (${user.total}) ${user.username}`);
            });
        }
    }

    return messages.join('\r');
};

export default {
    generateRankingMessage,
    generateAddedReviewRequestMessage,
    generateDelayedReviewRequestsMessage,
};
