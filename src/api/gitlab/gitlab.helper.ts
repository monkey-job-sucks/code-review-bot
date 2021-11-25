import { GitlabMergeRequestUrlInfo } from './gitlab.interfaces';

const regex = /(.*)\/merge_requests\/(.\d*)/;

const getUrlInfo = (url: string): GitlabMergeRequestUrlInfo => {
    const oldUrlPattern = url.replace('/-/', '/');

    const [,,, ...path] = oldUrlPattern.split('/');

    const groups = regex.exec(path.join('/'));

    return {
        'repository': groups[1],
        'id': groups[2],
    };
};

export default {
    getUrlInfo,
};
