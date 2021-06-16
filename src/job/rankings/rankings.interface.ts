export interface RankingAnalyticsSum {
    username: string;
    total: number;
}

export interface Ranking {
    channel: string;
    period: string;
    upvoters?: RankingAnalyticsSum[];
    reviewers?: RankingAnalyticsSum[];
}
