import helper from '../../../src/job/fetch-updates/fetch-updates.helper';

import { IMergeRequestModel } from '../../../src/api/mongo';
import { IGitlabMergeRequestDetail, IGitlabMergeRequestReaction, IGitlabUser, IGitlabMergeRequestDiscussion } from '../../../src/api/gitlab';

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

        test('should get zero reactions when mongo and remote have no upvoters', () => {
            const reactions = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(reactions.add.length).toBe(0);
            expect(reactions.remove.length).toBe(0);
        });

        test('should get zero reactions when mongo and remote have same amount of upvoters', () => {
            currentMR.analytics.upvoters.push('user.one');
            currentMR.slack.reactions.push('thumbsup');
            remoteReactions.push({
                'name': 'thumbsup',
                'user': getUser('user.two'),
            } as IGitlabMergeRequestReaction);

            const reactions = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(reactions.add.length).toBe(0);
            expect(reactions.remove.length).toBe(0);
        });

        test('should add one reaction when remote have one upvoter and mongo have zero', () => {
            remoteReactions.push({
                'name': 'thumbsup',
                'user': getUser('user.one'),
            } as IGitlabMergeRequestReaction);

            const reactions = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(reactions.add.length).toBe(1);
            expect(reactions.remove.length).toBe(0);
        });

        test('should add two reactions when remote have two upvoters and mongo have zero', () => {
            remoteReactions.push({
                'name': 'thumbsup',
                'user': getUser('user.one'),
            } as IGitlabMergeRequestReaction);

            remoteReactions.push({
                'name': 'thumbsup',
                'user': getUser('user.two'),
            } as IGitlabMergeRequestReaction);

            const reactions = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(reactions.add.length).toBe(2);
            expect(reactions.remove.length).toBe(0);
        });

        test('should remove one reaction when remote have zero upvoters and mongo have one', () => {
            currentMR.analytics.upvoters.push('user.one');
            currentMR.slack.reactions.push('thumbsup');

            const reactions = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(reactions.add.length).toBe(0);
            expect(reactions.remove.length).toBe(1);
        });

        test('should remove two reactions when remote have zero upvoters and mongo have two', () => {
            currentMR.analytics.upvoters.push('user.one');
            currentMR.analytics.upvoters.push('user.two');
            currentMR.slack.reactions.push('thumbsup');
            currentMR.slack.reactions.push('thumbsup');

            const reactions = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(reactions.add.length).toBe(0);
            expect(reactions.remove.length).toBe(2);
        });
    });

    describe('getDiscussionReaction', () => {
        let remoteDiscussions: IGitlabMergeRequestDiscussion[] = [];

        beforeEach(() => {
            remoteDiscussions = [];
        });

        test('should get zero reactions when mongo and remote have no open discussions', () => {
            const reactions = helper.getDiscussionReaction(currentMR, remoteDiscussions);

            expect(reactions.add.length).toBe(0);
            expect(reactions.remove.length).toBe(0);
        });

        test('should get zero reactions when mongo and remote have open discussions', () => {
            remoteDiscussions.push(getDiscussion(getUser('use.one'), true));
            currentMR.slack.reactions.push('speech_balloon');

            const reactions = helper.getDiscussionReaction(currentMR, remoteDiscussions);

            expect(reactions.add.length).toBe(0);
            expect(reactions.remove.length).toBe(0);
        });

        test('should add one reaction when remote have open discussions and mongo dont', () => {
            remoteDiscussions.push(getDiscussion(getUser('use.one'), true));

            const reactions = helper.getDiscussionReaction(currentMR, remoteDiscussions);

            expect(reactions.add.length).toBe(1);
            expect(reactions.remove.length).toBe(0);
        });

        test('should remove one reaction when remote dont have open discussions and mongo have', () => {
            remoteDiscussions.push(getDiscussion(getUser('use.one'), false));
            currentMR.slack.reactions.push('speech_balloon');

            const reactions = helper.getDiscussionReaction(currentMR, remoteDiscussions);

            expect(reactions.add.length).toBe(0);
            expect(reactions.remove.length).toBe(1);
        });
    });

    describe('getFinishedReaction', () => {
        test('should not get reaction when remote and mongo are open', () => {
            const finishedReaction = helper.getFinishedReaction(currentMR, remoteMR);

            expect(finishedReaction).toBeUndefined();
        });

        test('should get merged reaction when remote is merged', () => {
            remoteMR.state = 'merged';
            remoteMR.merged_at = new Date().toString();
            remoteMR.merged_by = getUser('user.one');

            const finishedReaction = helper.getFinishedReaction(currentMR, remoteMR);

            expect(finishedReaction).toBe('heavy_check_mark');
        });

        test('should get closed reaction when remote is closed', () => {
            remoteMR.state = 'closed';
            remoteMR.closed_at = new Date().toString();
            remoteMR.closed_by = getUser('user.one');

            const finishedReaction = helper.getFinishedReaction(currentMR, remoteMR);

            expect(finishedReaction).toBe('x');
        });
    });
});
