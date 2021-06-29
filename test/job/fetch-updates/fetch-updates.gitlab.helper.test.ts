import settings from '../../__mocks__/settings';

import helper from '../../../src/job/fetch-updates/fetch-updates.gitlab.helper';

import { ReviewRequestModel } from '../../../src/api/mongo';
import { GitlabMergeRequestDetail, GitlabMergeRequestReaction, GitlabUser, GitlabMergeRequestDiscussion } from '../../../src/api/gitlab';

const UPVOTE_MR_REACTION = 'thumbsup';

const getUser = (name: string): GitlabUser => {
    return {
        'username': name,
    } as GitlabUser;
};

const getDiscussion = (user: GitlabUser, isOpen: boolean) => {
    return {
        'individual_note': false,
        'notes': [{
            'author': user,
            'resolvable': true,
            'resolved': !isOpen,
        }],
    } as GitlabMergeRequestDiscussion;
};

const getUserUpvote = (user: GitlabUser): GitlabMergeRequestReaction => {
    return {
        'name': UPVOTE_MR_REACTION,
        'user': user,
    } as GitlabMergeRequestReaction;
};

describe('fetch-updates.job', () => {
    let currentMR: ReviewRequestModel;
    let remoteMR: GitlabMergeRequestDetail;

    beforeEach(() => {
        currentMR = {
            'analytics': {
                'upvoters': [],
                'reviewers': [],
            },
            'slack': {
                'reactions': [],
            },
        } as ReviewRequestModel;

        remoteMR = {
            'upvotes': 0,
        } as GitlabMergeRequestDetail;
    });

    describe('getUpvoteReactions', () => {
        let remoteReactions: GitlabMergeRequestReaction[] = [];

        beforeEach(() => {
            remoteReactions = [];
        });

        test('should get zero reactions and zero upvoters when mongo and remote have zero upvoters', () => {
            const upvoted = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(upvoted.reactions.add.length).toBe(0);
            expect(upvoted.reactions.remove.length).toBe(0);
            expect(upvoted.upvoters).not.toBeTruthy();
        });

        test('should get zero reactions and different upvoters when mongo and remote have same amount but different upvoters', () => {
            const currentUser = 'user.one';
            currentMR.analytics.upvoters.push(currentUser);
            currentMR.slack.reactions.push(UPVOTE_MR_REACTION);

            const remoteUser = getUser('user.two');
            remoteReactions.push(getUserUpvote(remoteUser));

            const upvoted = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(upvoted.reactions.add.length).toBe(0);
            expect(upvoted.reactions.remove.length).toBe(0);
            expect(upvoted.upvoters).toBeTruthy();
            expect(upvoted.upvoters.length).toBe(1);
            expect(upvoted.upvoters).not.toContain(currentUser);
            expect(upvoted.upvoters).toContain(remoteUser.username);
        });

        test('should add one reaction and have that user as upvoter when remote have one upvoter and mongo have zero', () => {
            const remoteUser = getUser('user.one');
            remoteReactions.push(getUserUpvote(remoteUser));

            const upvoted = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(upvoted.reactions.add.length).toBe(1);
            expect(upvoted.reactions.remove.length).toBe(0);
            expect(upvoted.upvoters).toBeTruthy();
            expect(upvoted.upvoters.length).toBe(1);
            expect(upvoted.upvoters).toContain(remoteUser.username);
        });

        test('should add two reactions and have both users as upvoters when remote have two upvoters and mongo have zero', () => {
            const remoteUserOne = getUser('user.one');
            const remoteUserTwo = getUser('user.two');
            remoteReactions.push(getUserUpvote(remoteUserOne));
            remoteReactions.push(getUserUpvote(remoteUserTwo));

            const upvoted = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(upvoted.reactions.add.length).toBe(2);
            expect(upvoted.reactions.remove.length).toBe(0);
            expect(upvoted.upvoters).toBeTruthy();
            expect(upvoted.upvoters.length).toBe(2);
            expect(upvoted.upvoters).toContain(remoteUserOne.username);
            expect(upvoted.upvoters).toContain(remoteUserTwo.username);
        });

        test('should remove one reaction and have zero upvoter when remote have zero upvoters and mongo have one', () => {
            currentMR.analytics.upvoters.push('user.one');
            currentMR.slack.reactions.push(UPVOTE_MR_REACTION);

            const upvoted = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(upvoted.reactions.add.length).toBe(0);
            expect(upvoted.reactions.remove.length).toBe(1);
            expect(upvoted.upvoters).not.toBeTruthy();
        });

        test('should remove two reactions and have zero upvoter when remote have zero upvoters and mongo have two', () => {
            currentMR.analytics.upvoters.push('user.one');
            currentMR.analytics.upvoters.push('user.two');
            currentMR.slack.reactions.push(UPVOTE_MR_REACTION);
            currentMR.slack.reactions.push(UPVOTE_MR_REACTION);

            const upvoted = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(upvoted.reactions.add.length).toBe(0);
            expect(upvoted.reactions.remove.length).toBe(2);
            expect(upvoted.upvoters).not.toBeTruthy();
        });

        test('should add one reaction when remote has two upvoters and mongo have one', () => {
            currentMR.analytics.upvoters.push('user.one');
            currentMR.slack.reactions.push(UPVOTE_MR_REACTION);

            const remoteUserTwo = getUser('user.two');
            const remoteUserThree = getUser('user.three');
            remoteReactions.push(getUserUpvote(remoteUserTwo));
            remoteReactions.push(getUserUpvote(remoteUserThree));

            const upvoted = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(upvoted.reactions.add.length).toBe(1);
            expect(upvoted.reactions.remove.length).toBe(0);
            expect(upvoted.upvoters).toBeTruthy();
            expect(upvoted.upvoters.length).toBe(2);
            expect(upvoted.upvoters).toContain(remoteUserTwo.username);
            expect(upvoted.upvoters).toContain(remoteUserThree.username);
        });
    });

    describe('getDiscussionReaction', () => {
        let remoteDiscussions: GitlabMergeRequestDiscussion[] = [];

        beforeEach(() => {
            remoteDiscussions = [];
        });

        test('should get zero reactions and zero reviewers when mongo and remote have no open discussions', () => {
            const reviwed = helper.getDiscussionReaction(settings, currentMR, remoteDiscussions);

            expect(reviwed.reactions.add.length).toBe(0);
            expect(reviwed.reactions.remove.length).toBe(0);
            expect(reviwed.reviewers).not.toBeTruthy();
        });

        test('should get zero reactions when mongo and remote have open discussions', () => {
            currentMR.slack.reactions.push(settings.slack.reactions.discussion);

            const remoteUser = getUser('user.one');
            remoteDiscussions.push(getDiscussion(remoteUser, true));

            const reviwed = helper.getDiscussionReaction(settings, currentMR, remoteDiscussions);

            expect(reviwed.reactions.add.length).toBe(0);
            expect(reviwed.reactions.remove.length).toBe(0);
            expect(reviwed.reviewers).toBeTruthy();
            expect(reviwed.reviewers.length).toBe(1);
            expect(reviwed.reviewers).toContain(remoteUser.username);
        });

        test('should add one reaction when remote have open discussions and mongo dont', () => {
            const remoteUser = getUser('user.one');
            remoteDiscussions.push(getDiscussion(remoteUser, true));

            const reviwed = helper.getDiscussionReaction(settings, currentMR, remoteDiscussions);

            expect(reviwed.reactions.add.length).toBe(1);
            expect(reviwed.reactions.remove.length).toBe(0);
            expect(reviwed.reviewers).toBeTruthy();
            expect(reviwed.reviewers.length).toBe(1);
            expect(reviwed.reviewers).toContain(remoteUser.username);
        });

        test('should remove one reaction when remote dont have open discussions and mongo have', () => {
            currentMR.slack.reactions.push(settings.slack.reactions.discussion);

            const remoteUser = getUser('user.one');
            remoteDiscussions.push(getDiscussion(remoteUser, false));

            const reviwed = helper.getDiscussionReaction(settings, currentMR, remoteDiscussions);

            expect(reviwed.reactions.add.length).toBe(0);
            expect(reviwed.reactions.remove.length).toBe(1);
            expect(reviwed.reviewers).toBeTruthy();
            expect(reviwed.reviewers.length).toBe(1);
            expect(reviwed.reviewers).toContain(remoteUser.username);
        });
    });

    describe('getFinishedReaction', () => {
        test('should not get reaction when remote and mongo are open', () => {
            const finished = helper.getFinishedReaction(settings, remoteMR);

            expect(finished.reaction).toBeUndefined();
            expect(finished.merged).toBeUndefined();
            expect(finished.closed).toBeUndefined();
        });

        test('should get merged reaction when remote is merged', () => {
            remoteMR.state = 'merged';
            remoteMR.merged_at = new Date().toString();
            remoteMR.merged_by = getUser('user.one');

            const finished = helper.getFinishedReaction(settings, remoteMR);

            expect(finished.reaction).toBe(settings.slack.reactions.merged);
            expect(finished.closed).toBeUndefined();
            expect(finished.merged).toBeTruthy();
            expect(finished.merged.at.toString()).toBe(remoteMR.merged_at);
            expect(finished.merged.by).toBe(remoteMR.merged_by.username);
        });

        test('should get closed reaction when remote is closed', () => {
            remoteMR.state = 'closed';
            remoteMR.closed_at = new Date().toString();
            remoteMR.closed_by = getUser('user.one');

            const finished = helper.getFinishedReaction(settings, remoteMR);

            expect(finished.reaction).toBe(settings.slack.reactions.closed);
            expect(finished.merged).toBeUndefined();
            expect(finished.closed).toBeTruthy();
            expect(finished.closed.at.toString()).toBe(remoteMR.closed_at);
            expect(finished.closed.by).toBe(remoteMR.closed_by.username);
        });
    });
});
