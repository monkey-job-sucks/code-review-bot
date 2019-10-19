const upvoteReactions = [
    'thumbsup',
    'thumbsup::skin-tone-2',
    'thumbsup::skin-tone-3',
    'thumbsup::skin-tone-4',
    'thumbsup::skin-tone-5',
    'thumbsup::skin-tone-6',
];

const shuffle = <T>(array: T[]): T[] => {
    let currentIndex = array.length;
    let randomIndex: number;
    let temporaryValue;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];

        /* eslint-disable no-param-reassign */
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
        /* eslint-enable no-param-reassign */
    }

    return array;
};

const randomizeThumbsup = (current: string[], amount: number): string[] => {
    if (amount + current.length > upvoteReactions.length) {
        throw new Error('Not enough reactions');
    }

    const reactions = shuffle(upvoteReactions);

    const unusedReactions = reactions.filter((reaction) => {
        return !current.includes(reaction);
    });

    const newReactionsToFetch = amount - current.length;
    const newReactions = unusedReactions.slice(0, newReactionsToFetch);

    return current.concat(newReactions);
};

export default {
    randomizeThumbsup,
};
