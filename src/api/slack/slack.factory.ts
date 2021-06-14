import * as moment from 'moment';
import { MessageAttachment } from '@slack/web-api';

import { ChannelReviewRequests, EReviewRequestOrigin, ReviewRequestModel } from '../mongo';
import { Ranking } from '../../job/rankings/rankings.interface';

moment.locale('pt-br');

const rankingEmojis = [':first_place_medal:', ':second_place_medal:', ':third_place_medal:'];

const getOpenReviewSlackMessage = (review: ReviewRequestModel): string => {
    const openedSince = moment(review.added.at).fromNow();

    switch (review.origin) {
        case EReviewRequestOrigin.GITLAB:
            return `<${review.url}|#${review.gitlab.iid} ${review.repository}> adicionado ${openedSince}`;
        case EReviewRequestOrigin.AZURE:
            return `<${review.url}|#${review.id} ${review.repository}> adicionado ${openedSince}`;
        default:
            return null;
    }
};

const getOpenReviewMessages = (
    reviews: ReviewRequestModel[],
): string[] => reviews.map(getOpenReviewSlackMessage).filter((message) => !!message);

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

const generateDelayedReviewRequestsMessage = (
    delayedRequests: ChannelReviewRequests,
    discussionReaction: string,
): string => {
    const reviews = {
        'withDiscussions': delayedRequests.reviews.filter(
            (review) => review.slack.reactions?.includes(discussionReaction),
        ),
        'withoutDiscussions': delayedRequests.reviews.filter(
            (review) => !review.slack.reactions?.includes(discussionReaction),
        ),
    };

    let messages: string[] = ['<!here>'];

    if (reviews.withoutDiscussions.length) {
        messages.push('Ainda temos os seguintes reviews abertos:');

        messages = messages.concat(...getOpenReviewMessages(reviews.withoutDiscussions));
    }

    // new line
    if (reviews.withDiscussions.length && reviews.withoutDiscussions.length) {
        messages.push('');
    }

    if (reviews.withDiscussions.length) {
        messages.push('Ainda temos os seguintes reviews abertos com comentários:');

        messages = messages.concat(...getOpenReviewMessages(reviews.withDiscussions));
    }

    return messages.join('\r');
};

const generateRankingMessage = (ranking: Ranking): string => {
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
