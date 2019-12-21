/* eslint-disable no-unused-vars */
import { IRanking, IRankingAnalyticsSum } from './rankings.interface';
import { IMergeRequestModel } from '../../api/mongo';
/* eslint-enable no-unused-vars */

const sortRanking = (
    currentRanking: IRankingAnalyticsSum, nextRanking: IRankingAnalyticsSum,
): number => (currentRanking.total > nextRanking.total ? -1 : 1);

const getTotalByKey = (
    currentMR: IMergeRequestModel,
    currentAnalyticsSum: IRankingAnalyticsSum[],
    key: 'upvoters' | 'reviewers',
) => currentMR.analytics[key].reduce((analyticsSum: IRankingAnalyticsSum[], username: string) => {
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
    mrs: IMergeRequestModel[],
    period: string,
): IRanking[] => mrs.reduce((grouped: IRanking[], current: IMergeRequestModel) => {
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
