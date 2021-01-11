// eslint-disable-next-line no-unused-vars
import { IAzurePullRequestUrlInfo } from './azure.interfaces';

const regex = /(.*)\/_git\/(.*)\/pullrequest\/(\d*)/;

const getUrlInfo = (host: string, url: string): IAzurePullRequestUrlInfo => {
    const groups = regex.exec(url);

    // groups[1] should result in
    // https://dev.azure.com/{organization}/{project}
    const [
        organization,
        project,
    ] = groups[1].replace(`${host}/`, '').split('/');

    return {
        'organization': organization,
        'project': project,
        'repository': groups[2],
        'id': Number(groups[3]),
    };
};

export default {
    getUrlInfo,
};
