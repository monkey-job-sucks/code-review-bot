import { Ranking, RankingAnalyticsSum } from './rankings.interface';
import { ReviewRequestModel } from '../../api/mongo';

const sortRanking = (
    currentRanking: RankingAnalyticsSum, nextRanking: RankingAnalyticsSum,
): number => (currentRanking.total > nextRanking.total ? -1 : 1);

const getTotalByKey = (
    review: ReviewRequestModel,
    currentAnalyticsSum: RankingAnalyticsSum[],
    key: 'upvoters' | 'reviewers',
) => review.analytics[key].reduce((analyticsSum: RankingAnalyticsSum[], username: string) => {
    const user = analyticsSum.find((g) => g.username === username);

    if (user) {
        user.total += 1;
    } else {
        analyticsSum.push({
            'username': username,
            'total': 1,
        });
    }

    return analyticsSum;
}, currentAnalyticsSum);

const groupByAnalytics = (
    reviews: ReviewRequestModel[],
    period: string,
): Ranking[] => reviews.reduce((grouped: Ranking[], current: ReviewRequestModel) => {
    let channel = grouped.find((g) => g.channel === current.slack.channel.id);

    if (!channel) {
        channel = {
            'channel': current.slack.channel.id,
            'period': period,
            'upvoters': [],
            'reviewers': [],
        };

        grouped.push(channel);
    }

    channel.upvoters = getTotalByKey(current, channel.upvoters, 'upvoters').sort(sortRanking);
    channel.reviewers = getTotalByKey(current, channel.reviewers, 'reviewers').sort(sortRanking);

    return grouped;
}, []);

export default {
    groupByAnalytics,
};
