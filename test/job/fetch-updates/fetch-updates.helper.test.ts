import helper from '../../../src/job/fetch-updates/fetch-updates.helper';

import { IMergeRequestModel } from '../../../src/api/mongo';
import { IGitlabMergeRequestDetail, IGitlabMergeRequestReaction, IGitlabUser, IGitlabMergeRequestDiscussion } from '../../../src/api/gitlab';

const {
    CLOSED_MR_REACTION,
    MERGED_MR_REACTION,
    DISCUSSION_MR_REACTION,
} = process.env;

const UPVOTE_MR_REACTION = 'thumbsup';

const getUser = (name: string): IGitlabUser => {
    return {
        'username': name,
    } as IGitlabUser;
};

const getDiscussion = (user: IGitlabUser, isOpen: boolean) => {
    return {
        'individual_note': false,
        'notes': [{
            'author': user,
            'resolvable': true,
            'resolved': !isOpen,
        }],
    } as IGitlabMergeRequestDiscussion;
};

const getUserUpvote = (user: IGitlabUser): IGitlabMergeRequestReaction => {
    return {
        'name': UPVOTE_MR_REACTION,
        'user': user,
    } as IGitlabMergeRequestReaction;
};

describe('fetch-updates.job', () => {
    let currentMR: IMergeRequestModel;
    let remoteMR: IGitlabMergeRequestDetail;

    beforeEach(() => {
        currentMR = {
            'analytics': {
                'upvoters': [],
                'reviewers': [],
            },
            'slack': {
                'reactions': [],
            },
        } as IMergeRequestModel;

        remoteMR = {
            'upvotes': 0,
        } as IGitlabMergeRequestDetail;
    });

    describe('getUpvoteReactions', () => {
        let remoteReactions: IGitlabMergeRequestReaction[] = [];

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
        let remoteDiscussions: IGitlabMergeRequestDiscussion[] = [];

        beforeEach(() => {
            remoteDiscussions = [];
        });

        test('should get zero reactions and zero reviewers when mongo and remote have no open discussions', () => {
            const reviwed = helper.getDiscussionReaction(currentMR, remoteDiscussions);

            expect(reviwed.reactions.add.length).toBe(0);
            expect(reviwed.reactions.remove.length).toBe(0);
            expect(reviwed.reviewers).not.toBeTruthy();
        });

        test('should get zero reactions when mongo and remote have open discussions', () => {
            currentMR.slack.reactions.push(DISCUSSION_MR_REACTION);

            const remoteUser = getUser('user.one');
            remoteDiscussions.push(getDiscussion(remoteUser, true));

            const reviwed = helper.getDiscussionReaction(currentMR, remoteDiscussions);

            expect(reviwed.reactions.add.length).toBe(0);
            expect(reviwed.reactions.remove.length).toBe(0);
            expect(reviwed.reviewers).toBeTruthy();
            expect(reviwed.reviewers.length).toBe(1);
            expect(reviwed.reviewers).toContain(remoteUser.username);
        });

        test('should add one reaction when remote have open discussions and mongo dont', () => {
            const remoteUser = getUser('user.one');
            remoteDiscussions.push(getDiscussion(remoteUser, true));

            const reviwed = helper.getDiscussionReaction(currentMR, remoteDiscussions);

            expect(reviwed.reactions.add.length).toBe(1);
            expect(reviwed.reactions.remove.length).toBe(0);
            expect(reviwed.reviewers).toBeTruthy();
            expect(reviwed.reviewers.length).toBe(1);
            expect(reviwed.reviewers).toContain(remoteUser.username);
        });

        test('should remove one reaction when remote dont have open discussions and mongo have', () => {
            currentMR.slack.reactions.push(DISCUSSION_MR_REACTION);

            const remoteUser = getUser('user.one');
            remoteDiscussions.push(getDiscussion(remoteUser, false));

            const reviwed = helper.getDiscussionReaction(currentMR, remoteDiscussions);

            expect(reviwed.reactions.add.length).toBe(0);
            expect(reviwed.reactions.remove.length).toBe(1);
            expect(reviwed.reviewers).toBeTruthy();
            expect(reviwed.reviewers.length).toBe(1);
            expect(reviwed.reviewers).toContain(remoteUser.username);
        });
    });

    describe('getFinishedReaction', () => {
        test('should not get reaction when remote and mongo are open', () => {
            const finished = helper.getFinishedReaction(remoteMR);

            expect(finished.reaction).toBeUndefined();
            expect(finished.merged).toBeUndefined();
            expect(finished.closed).toBeUndefined();
        });

        test('should get merged reaction when remote is merged', () => {
            remoteMR.state = 'merged';
            remoteMR.merged_at = new Date().toString();
            remoteMR.merged_by = getUser('user.one');

            const finished = helper.getFinishedReaction(remoteMR);

            expect(finished.reaction).toBe(MERGED_MR_REACTION);
            expect(finished.closed).toBeUndefined();
            expect(finished.merged).toBeTruthy();
            expect(finished.merged.at.toString()).toBe(remoteMR.merged_at);
            expect(finished.merged.by).toBe(remoteMR.merged_by.username);
        });

        test('should get closed reaction when remote is closed', () => {
            remoteMR.state = 'closed';
            remoteMR.closed_at = new Date().toString();
            remoteMR.closed_by = getUser('user.one');

            const finished = helper.getFinishedReaction(remoteMR);

            expect(finished.reaction).toBe(CLOSED_MR_REACTION);
            expect(finished.merged).toBeUndefined();
            expect(finished.closed).toBeTruthy();
            expect(finished.closed.at.toString()).toBe(remoteMR.closed_at);
            expect(finished.closed.by).toBe(remoteMR.closed_by.username);
        });
    });
});
