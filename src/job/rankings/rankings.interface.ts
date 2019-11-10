export interface IRankingAnalyticsSum {
    username: string;
    total: number;
}

export interface IRanking {
    channel: string;
    period: string;
    upvoters?: IRankingAnalyticsSum[];
    reviewers?: IRankingAnalyticsSum[];
}
