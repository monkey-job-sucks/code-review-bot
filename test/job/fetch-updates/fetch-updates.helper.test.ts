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

        test('should get zero reactions', () => {
            const reactions = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(reactions.add.length).toBe(0);
            expect(reactions.remove.length).toBe(0);
        });

        test('should get zero reactions too', () => {
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

        test('should add one reaction', () => {
            remoteReactions.push({
                'name': 'thumbsup',
                'user': getUser('user.one'),
            } as IGitlabMergeRequestReaction);

            const reactions = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(reactions.add.length).toBe(1);
            expect(reactions.remove.length).toBe(0);
        });

        test('should add two reactions', () => {
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

        test('should remove one reaction', () => {
            currentMR.analytics.upvoters.push('user.one');
            currentMR.slack.reactions.push('thumbsup');

            const reactions = helper.getUpvoteReactions(currentMR, remoteReactions);

            expect(reactions.add.length).toBe(0);
            expect(reactions.remove.length).toBe(1);
        });

        test('should remove two reactions', () => {
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

        test('should get zero reactions', () => {
            const reactions = helper.getDiscussionReaction(currentMR, remoteDiscussions);

            expect(reactions.add.length).toBe(0);
            expect(reactions.remove.length).toBe(0);
        });

        test('should get zero reactions too', () => {
            remoteDiscussions.push(getDiscussion(getUser('use.one'), true));
            currentMR.slack.reactions.push('speech_balloon');

            const reactions = helper.getDiscussionReaction(currentMR, remoteDiscussions);

            expect(reactions.add.length).toBe(0);
            expect(reactions.remove.length).toBe(0);
        });

        test('should add one reaction', () => {
            remoteDiscussions.push(getDiscussion(getUser('use.one'), true));

            const reactions = helper.getDiscussionReaction(currentMR, remoteDiscussions);

            expect(reactions.add.length).toBe(1);
            expect(reactions.remove.length).toBe(0);
        });

        test('should remove one reaction', () => {
            remoteDiscussions.push(getDiscussion(getUser('use.one'), false));
            currentMR.slack.reactions.push('speech_balloon');

            const reactions = helper.getDiscussionReaction(currentMR, remoteDiscussions);

            expect(reactions.add.length).toBe(0);
            expect(reactions.remove.length).toBe(1);
        });
    });

    describe('getFinishedReaction', () => {
        test('should not get reaction', () => {
            const finishedReaction = helper.getFinishedReaction(currentMR, remoteMR);

            expect(finishedReaction).toBeUndefined();
        });

        test('should get merged reaction', () => {
            remoteMR.state = 'merged';
            remoteMR.merged_at = new Date().toString();
            remoteMR.merged_by = getUser('user.one');

            const finishedReaction = helper.getFinishedReaction(currentMR, remoteMR);

            expect(finishedReaction).toBe('heavy_check_mark');
        });

        test('should get closed reaction', () => {
            remoteMR.state = 'closed';
            remoteMR.closed_at = new Date().toString();
            remoteMR.closed_by = getUser('user.one');

            const finishedReaction = helper.getFinishedReaction(currentMR, remoteMR);

            expect(finishedReaction).toBe('x');
        });
    });
});
