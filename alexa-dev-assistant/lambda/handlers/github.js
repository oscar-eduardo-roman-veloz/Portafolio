'use strict';

const github = require('../lib/github');
const { escapeSsml, isIntent, answer } = require('../lib/speech');

function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

const RepoStatusIntentHandler = {
  canHandle: (handlerInput) => isIntent(handlerInput, 'RepoStatusIntent'),
  async handle(handlerInput) {
    const repo = github.getRepo();
    try {
      const status = await github.getRepoStatus(repo);
      const issues = plural(status.openIssues, 'issue abierto', 'issues abiertos');
      const pulls = plural(status.openPulls, 'pull request abierto', 'pull requests abiertos');
      let speech = `El repositorio ${escapeSsml(status.name)} tiene ${issues} y ${pulls}.`;
      let cardText = `${status.repo}\nIssues abiertos: ${status.openIssues}\nPRs abiertos: ${status.openPulls}`;
      if (status.lastCommit) {
        const when = github.relativeTime(status.lastCommit.date);
        speech += ` El último commit en ${escapeSsml(status.defaultBranch)} fue ${when}: ${escapeSsml(status.lastCommit.message)}.`;
        cardText += `\nÚltimo commit (${when}): ${status.lastCommit.message}`;
      }
      return answer(handlerInput, { speech, cardTitle: 'Estado del repositorio', cardText });
    } catch (error) {
      console.error('Error consultando GitHub:', error);
      const speech = error.status === 404
        ? 'No encontré el repositorio. Si es privado, configura GITHUB_TOKEN; si no, revisa GITHUB_REPO.'
        : 'GitHub no respondió a tiempo. Inténtalo en un momento.';
      return answer(handlerInput, { speech });
    }
  },
};

module.exports = { RepoStatusIntentHandler };
