const upvoteReactions = [
    'thumbsup',
    'thumbsup::skin-tone-2',
    'thumbsup::skin-tone-3',
    'thumbsup::skin-tone-4',
    'thumbsup::skin-tone-5',
    'thumbsup::skin-tone-6',
];

const randomBetween = (min: number, max: number): number => {
    return Math.floor(Math.random() * max) + min;
};

const getRandomReaction = (reactions: string[]) => {
    const i = randomBetween(0, reactions.length - 1);

    return reactions[i];
};

const randomizeThumbsup = (current: string[], amount: number): string[] => {
    if (amount > upvoteReactions.length) throw new Error('Not enough reactions');

    const thumbsup: string[] = [];

    while (thumbsup.length < amount) {
        const reaction = getRandomReaction(upvoteReactions);

        if (!thumbsup.includes(reaction) && !current.includes(reaction)) thumbsup.push(reaction);
    }

    return thumbsup;
};

export default {
    randomizeThumbsup,
};
