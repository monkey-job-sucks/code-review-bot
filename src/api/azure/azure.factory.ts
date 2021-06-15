import {
    AzurePullRequestDetail,
    AzurePullRequestReviewer,
    AzurePullRequestThread,
    AzureThread,
} from './azure.interfaces';

const getReviewers = (pullRequest: AzurePullRequestDetail): AzurePullRequestReviewer[] => {
    const reviewers: AzurePullRequestReviewer[] = pullRequest.reviewers
        .reduce((reviews, review) => {
            if (review.isContainer) return reviews;

            reviews.push({
                'vote': review.vote,
                'uniqueName': review.uniqueName,
            });

            return reviews;
        }, []);

    return reviewers;
};

const getThreads = (pullRequestThreads: AzureThread): AzurePullRequestThread[] => {
    const { value } = pullRequestThreads;

    const threads: AzurePullRequestThread[] = value
        .reduce((prthreads: AzurePullRequestThread[], thread) => {
            if (thread?.comments[0]?.commentType !== 'system') {
                prthreads.push({
                    'status': thread.status,
                    'comments': thread.comments.map((comment) => ({
                        'id': comment.id,
                        'author': comment.author.uniqueName,
                        'content': comment.content,
                    })),
                });
            }

            return prthreads;
        }, []);

    return threads;
};

export default {
    getReviewers,
    getThreads,
};
