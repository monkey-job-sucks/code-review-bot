import * as asyncHooks from 'async_hooks';
import * as uuid from 'uuid';

interface ContextUserTeam {
    id: string;
    name: string;
}

interface ContextUserChannel {
    id: string;
    name: string;
}

interface ContextUser {
    id: string;
    name: string;
    team: ContextUserTeam;
    channel: ContextUserChannel;
}

interface Context {
    id: string;
    user: ContextUser;
}

const store: Map<number, Context> = new Map();

const asyncHook = asyncHooks.createHook({
    'init': (asyncId, _, triggerAsyncId) => {
        if (store.has(triggerAsyncId)) {
            store.set(asyncId, store.get(triggerAsyncId));
        }
    },
    'destroy': (asyncId) => {
        if (store.has(asyncId)) {
            store.delete(asyncId);
        }
    },
});

asyncHook.enable();

const createContext = (bot: any, message: any, next: Function) => {
    const context: Context = {
        'id': uuid.v4(),
        'user': {
            'id': message.user_id,
            'name': message.user_name,
            'team': {
                'id': message.team_id,
                'name': message.team_domain,
            },
            'channel': {
                'id': message.channel_id,
                'name': message.channel_name,
            },
        },
    };

    store.set(asyncHooks.executionAsyncId(), context);

    return next();
};

const getContext = (): Context => store.get(asyncHooks.executionAsyncId());

export default {
    getContext,
    createContext,
};
