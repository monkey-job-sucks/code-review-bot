/* eslint-disable no-unused-vars */
import {
    IAzurePullRequestDetail,
    IAzurePullRequestReviewer,
    IAzurePullRequestThread,
    IAzureThread,
} from './azure.interfaces';
/* eslint-enable no-unused-vars */

const getReviewers = (pullRequest: IAzurePullRequestDetail): IAzurePullRequestReviewer[] => {
    const reviewers: IAzurePullRequestReviewer[] = pullRequest.reviewers
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

const getThreads = (pullRequestThreads: IAzureThread): IAzurePullRequestThread[] => {
    const { value } = pullRequestThreads;

    const threads: IAzurePullRequestThread[] = value
        .reduce((prthreads: IAzurePullRequestThread[], thread) => {
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
