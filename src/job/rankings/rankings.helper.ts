/* eslint-disable no-unused-vars */
import { IRanking, IRankingAnalyticsSum } from './rankings.interface';
import { IMergeRequestModel } from '../../api/mongo';
/* eslint-enable no-unused-vars */

const getTotalByKey = (currentMR: IMergeRequestModel, currentAnalyticsSum: IRankingAnalyticsSum[], key: 'upvoters' | 'reviewers') => currentMR.analytics[key].reduce((analyticsSum: IRankingAnalyticsSum[], remoteUsername: string) => {
    const user = analyticsSum.find((g) => g.username === remoteUsername);

    if (user) {
        user.total += 1;
    } else {
        analyticsSum.push({
            'username': remoteUsername,
            'total': 1,
        });
    }

    return analyticsSum;
}, currentAnalyticsSum);

const groupByAnalytics = (
    mrs: IMergeRequestModel[],
): IRanking[] => mrs.reduce((grouped: IRanking[], current: IMergeRequestModel) => {
    let channel = grouped.find((g) => g.channel === current.slack.channel.id);

    if (!channel) {
        channel = {
            'channel': current.slack.channel.id,
            'upvoters': [],
            'reviewers': [],
        };

        grouped.push(channel);
    }

    channel.upvoters = getTotalByKey(current, channel.upvoters, 'upvoters');
    channel.reviewers = getTotalByKey(current, channel.reviewers, 'reviewers');

    return grouped;
}, []);

export default {
    groupByAnalytics,
};
