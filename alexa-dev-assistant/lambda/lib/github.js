'use strict';

const DEFAULT_REPO = 'oscar-eduardo-roman-veloz/Portafolio';
const TIMEOUT_MS = 4000;

function getRepo() {
  return process.env.GITHUB_REPO || DEFAULT_REPO;
}

async function githubGet(path) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'alexa-dev-assistant',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) {
    const error = new Error(`GitHub respondió ${res.status} para ${path}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

/**
 * Resume el estado de un repositorio: issues y PRs abiertos y el último commit.
 * `open_issues_count` de GitHub incluye PRs, así que los restamos para obtener solo issues.
 */
async function getRepoStatus(repo = getRepo()) {
  const [info, pulls, commits] = await Promise.all([
    githubGet(`/repos/${repo}`),
    githubGet(`/repos/${repo}/pulls?state=open&per_page=100`),
    githubGet(`/repos/${repo}/commits?per_page=1`),
  ]);
  const lastCommit = commits[0];
  return {
    repo: info.full_name,
    name: info.name,
    openPulls: pulls.length,
    openIssues: Math.max(0, info.open_issues_count - pulls.length),
    defaultBranch: info.default_branch,
    lastCommit: lastCommit
      ? {
          message: lastCommit.commit.message.split('\n')[0],
          author: lastCommit.commit.author?.name,
          date: new Date(lastCommit.commit.author?.date ?? lastCommit.commit.committer?.date),
        }
      : null,
  };
}

function relativeTime(date, now = new Date()) {
  const rtf = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' });
  const seconds = Math.round((date - now) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'hace un momento';
}

module.exports = { getRepo, getRepoStatus, relativeTime };
