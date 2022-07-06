import * as moment from 'moment';
import { MessageAttachment } from '@slack/web-api';

import { ChannelReviewRequests, EReviewRequestOrigin, ReviewRequestModel } from '../mongo';
import { Ranking } from '../../job/rankings/rankings.interface';
import NotificationTypeEnum from '../../enum/notification-type.enum';

moment.locale('pt-br');

const rankingEmojis = [':first_place_medal:', ':second_place_medal:', ':third_place_medal:'];
const { APPROVED_NOT_FINISHED, WITH_DISCUSSIONS, WITHOUT_DISCUSSIONS } = NotificationTypeEnum;
const notifyMessage = {
    [APPROVED_NOT_FINISHED]: ':white_check_mark: Já atingiram os likes necessários, mas ainda não foram finalizados:',
    [WITH_DISCUSSIONS]: ':speech_balloon: Ainda temos os seguintes reviews abertos com comentários:',
    [WITHOUT_DISCUSSIONS]: ':eyes: Ainda temos os seguintes reviews abertos:',
};

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
    minUpvoters: number,
): string => {
    const reviews = {
        [WITHOUT_DISCUSSIONS]: delayedRequests.reviews.filter(
            (review) => !review.slack.reactions?.includes(discussionReaction)
                && review.analytics?.upvoters.length < minUpvoters,
        ),
        [WITH_DISCUSSIONS]: delayedRequests.reviews.filter(
            (review) => review.slack.reactions?.includes(discussionReaction),
        ),
        [APPROVED_NOT_FINISHED]: delayedRequests.reviews.filter(
            (review) => !review.slack.reactions?.includes(discussionReaction)
                && review.analytics?.upvoters.length >= minUpvoters,
        ),
    };

    let messages: string[] = ['<!here>'];

    Object.entries(reviews).forEach(
        ([key, value]) => {
            if (!value.length) return;

            messages.push(notifyMessage[key]);
            messages = messages.concat(...getOpenReviewMessages(value), '\n');
        },
    );

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
