const upvoteReactions = [
    'thumbsup',
    'thumbsup::skin-tone-2',
    'thumbsup::skin-tone-3',
    'thumbsup::skin-tone-4',
    'thumbsup::skin-tone-5',
    'thumbsup::skin-tone-6',
];

// TODO: move to other file
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
    const currentValidReactions = current.filter((reaction) => upvoteReactions.includes(reaction));
    const neededReactions = amount + currentValidReactions.length;

    if (neededReactions > upvoteReactions.length) return [];

    const reactions = shuffle(upvoteReactions);

    const unusedReactions = reactions
        .filter((reaction) => !currentValidReactions.includes(reaction));

    const newReactions = unusedReactions.slice(0, amount);

    return newReactions;
};

export default {
    randomizeThumbsup,
};
