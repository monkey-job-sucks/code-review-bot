process.env.MONGO_URI = 'mongodb://root:root123@ds139869.mlab.com:39869/code-review-bot';
process.env.MONGO_COLLECTIONS_PREFIX = 'GPA_';

import {
    mongoose,
    MergeRequest,
    IMergeRequestModel,
} from './src/api/mongo';

const freeze = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitConnections = async () => {
    const hasMongoConnection = mongoose.connection.readyState === 1;

    if (!hasMongoConnection) {
        await freeze(100);

        return waitConnections;
    }

    return true;
};

const formatDocument = (mr: IMergeRequestModel) => {
    return {
        'id': Number(mr.id),
        'content': `MR ${mr.iid}`,
        'start': mr.added.at,
        'end': mr.merged?.at || mr.closed?.at,
    };
};

(async () => {
    console.log('Esperando conexão');

    await waitConnections();

    console.log('Iniciando leitura');

    const documents = await MergeRequest.find({});

    console.log(documents.length, 'documentos');

    const formatted = documents.map(formatDocument);

    formatted.forEach((d) => console.log(`${JSON.stringify(d)},`));
})();
