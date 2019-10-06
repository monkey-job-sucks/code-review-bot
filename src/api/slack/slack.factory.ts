// eslint-disable-next-line no-unused-vars
import { IGitlabMergeRequest } from '../gitlab/gitlab.interfaces';

// eslint-disable-next-line import/prefer-default-export
const generateMergeRequestMessage = (user: string, merge: IGitlabMergeRequest): any => {
    const { repository, detail } = merge;

    const title = `MR adicionado por <@${user}> em ${repository}`;

    const messages = [];

    const hasMultipleChanges = detail.changes_count !== '1';
    const pluralWord = hasMultipleChanges ? 's' : '';

    if (merge.changes) {
        let changes = `*${detail.changes_count} arquivo${pluralWord} alterado${pluralWord}`;
        changes += ` (+${merge.changes.additions} -${merge.changes.deletions})*`;
        messages.push(changes);
    }

    const fields = [{
        'title': 'Origem',
        'value': detail.source_branch,
        'short': true,
    }, {
        'title': 'Destino',
        'value': detail.target_branch,
        'short': true,
    }];

    return {
        'title': title,
        'title_link': detail.web_url,
        'text': messages.join('\r'),
        'mrkdwn': true,
        'fields': fields,
    };
};

export default {
    generateMergeRequestMessage,
};
