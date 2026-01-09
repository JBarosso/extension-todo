import type { GitHubSettings } from './storageService';

export interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  url: string;
  state: string;
  labels: { name: string; color: string }[];
  assignee?: { login: string; avatarUrl: string };
  createdAt: string;
  locallyModified?: boolean;
  modifiedAt?: number;
}

// Fetch project columns - just get the field options
export async function fetchProjectColumns(settings: GitHubSettings): Promise<{ id: string; name: string }[]> {
  const { token, repo } = settings;

  if (!token || !repo) {
    throw new Error('Token et Repo requis');
  }

  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error('Format repo invalide. Utilisez: owner/repo');
  }

  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        projectsV2(first: 10) {
          nodes {
            id
            title
            number
            fields(first: 20) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
    `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: { owner, repo: repoName } }),
  });

  if (!response.ok) {
    throw new Error(`Erreur GitHub API: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(data.errors[0]?.message || 'Erreur GraphQL');
  }

  const projects = data.data?.repository?.projectsV2?.nodes || [];
  const columns: { id: string; name: string }[] = [];

  for (const project of projects) {
    for (const field of project.fields?.nodes || []) {
      if (field?.options) {
        for (const option of field.options) {
          columns.push({
            id: `${project.number}:${field.name}:${option.id}`,
            name: `${project.title} → ${field.name} → ${option.name}`
          });
        }
      }
    }
  }

  return columns;
}

// Fetch issues from a GitHub Project V2 column
export async function fetchColumnCards(settings: GitHubSettings): Promise<GitHubIssue[]> {
  const { token, repo, columnId } = settings;

  if (!token || !columnId) {
    throw new Error('Token et Column ID requis');
  }

  const parts = columnId.split(':');

  if (parts.length === 3) {
    return await fetchProjectV2Issues(token, repo, parts[0], parts[1], parts[2]);
  } else {
    return await fetchClassicColumnCards(token, columnId);
  }
}

// Fetch from Projects V2 with pagination
async function fetchProjectV2Issues(
  token: string,
  repo: string,
  projectNumber: string,
  fieldName: string,
  optionId: string
): Promise<GitHubIssue[]> {
  const [owner, repoName] = repo.split('/');

  if (!owner || !repoName) {
    throw new Error('Format repo invalide. Utilisez: owner/repo');
  }

  const issues: GitHubIssue[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  let totalItemsScanned = 0;
  let pagesWithoutMatches = 0;

  console.log('[GitHub Debug] Starting pagination for fieldName:', fieldName, 'optionId:', optionId);

  while (hasNextPage) {
    const query = `
        query($owner: String!, $repo: String!, $projectNumber: Int!, $cursor: String) {
          repository(owner: $owner, name: $repo) {
            projectV2(number: $projectNumber) {
              items(first: 100, after: $cursor) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  id
                  fieldValues(first: 20) {
                    nodes {
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        field {
                          ... on ProjectV2SingleSelectField {
                            id
                            name
                          }
                        }
                        optionId
                      }
                    }
                  }
                  content {
                    ... on Issue {
                      id
                      number
                      title
                      url
                      state
                      createdAt
                      labels(first: 10) {
                        nodes {
                          name
                          color
                        }
                      }
                      assignees(first: 1) {
                        nodes {
                          login
                          avatarUrl
                        }
                      }
                    }
                    ... on DraftIssue {
                      title
                      createdAt
                    }
                  }
                }
              }
            }
          }
        }
        `;

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          owner,
          repo: repoName,
          projectNumber: parseInt(projectNumber),
          cursor
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token invalide ou expiré');
      }
      throw new Error(`Erreur GitHub API: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'Erreur GraphQL');
    }

    const itemsData = data.data?.repository?.projectV2?.items;
    const items = itemsData?.nodes || [];
    const pageInfo = itemsData?.pageInfo;

    totalItemsScanned += items.length;
    const issuesBeforePage = issues.length;

    for (const item of items) {
      const fieldValues = item.fieldValues?.nodes || [];

      const matchingField = fieldValues.find((fv: { field?: { name?: string }; optionId?: string }) =>
        fv.field?.name === fieldName && fv.optionId === optionId
      );

      if (!matchingField) continue;

      const content = item.content;
      if (!content) continue;

      if (content.number) {
        issues.push({
          id: content.id,
          number: content.number,
          title: content.title,
          url: content.url,
          state: content.state?.toLowerCase() || 'open',
          labels: content.labels?.nodes?.map((l: { name: string; color: string }) => ({
            name: l.name,
            color: l.color
          })) || [],
          assignee: content.assignees?.nodes?.[0] ? {
            login: content.assignees.nodes[0].login,
            avatarUrl: content.assignees.nodes[0].avatarUrl
          } : undefined,
          createdAt: content.createdAt
        });
      } else if (content.title) {
        issues.push({
          id: item.id,
          number: 0,
          title: content.title,
          url: '',
          state: 'draft',
          labels: [],
          createdAt: content.createdAt
        });
      }
    }

    const foundInThisPage = issues.length - issuesBeforePage;
    console.log('[GitHub Debug] Page scanned:', items.length, 'items. Found:', foundInThisPage, 'matches. Total:', totalItemsScanned, 'scanned,', issues.length, 'found');

    // Track pages without matches
    if (foundInThisPage === 0) {
      pagesWithoutMatches++;
    } else {
      pagesWithoutMatches = 0; // Reset counter when we find matches
    }

    hasNextPage = pageInfo?.hasNextPage || false;
    cursor = pageInfo?.endCursor || null;

    // Early stopping conditions:
    // 1. If we've scanned 2 consecutive pages without finding any matches AND we already have some issues
    if (pagesWithoutMatches >= 2 && issues.length > 0) {
      console.log('[GitHub Debug] No matches in last 2 pages, stopping early');
      break;
    }

    // 2. Safety limit: stop after 500 items
    if (totalItemsScanned >= 500) {
      console.log('[GitHub Debug] Reached 500 items limit, stopping pagination');
      break;
    }
  }

  console.log('[GitHub Debug] Pagination complete. Total items scanned:', totalItemsScanned);
  console.log('[GitHub Debug] Found', issues.length, 'matching issues');
  return issues;
}

// Fetch from Classic Projects
async function fetchClassicColumnCards(token: string, columnId: string): Promise<GitHubIssue[]> {
  const response = await fetch(
    `https://api.github.com/projects/columns/${columnId}/cards`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Token invalide ou expiré');
    }
    if (response.status === 404) {
      throw new Error('Colonne non trouvée. Vérifiez le Column ID.');
    }
    throw new Error(`Erreur GitHub API: ${response.status}`);
  }

  const cards = await response.json();
  const issues: GitHubIssue[] = [];

  for (const card of cards) {
    if (card.content_url) {
      const issueResponse = await fetch(card.content_url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      if (issueResponse.ok) {
        const issue = await issueResponse.json();
        issues.push({
          id: issue.id.toString(),
          number: issue.number,
          title: issue.title,
          url: issue.html_url,
          state: issue.state,
          labels: issue.labels.map((l: { name: string; color: string }) => ({
            name: l.name,
            color: l.color
          })),
          assignee: issue.assignee ? {
            login: issue.assignee.login,
            avatarUrl: issue.assignee.avatar_url
          } : undefined,
          createdAt: issue.created_at
        });
      }
    } else if (card.note) {
      issues.push({
        id: card.id.toString(),
        number: 0,
        title: card.note,
        url: '',
        state: 'note',
        labels: [],
        createdAt: card.created_at
      });
    }
  }

  return issues;
}

// Fetch full issue details including body and comments
export async function fetchIssueDetails(token: string, owner: string, repo: string, issueNumber: number) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Erreur GitHub API: ${response.status}`);
  }

  return await response.json();
}

// Fetch issue comments
export async function fetchIssueComments(token: string, owner: string, repo: string, issueNumber: number) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Erreur GitHub API: ${response.status}`);
  }

  return await response.json();
}

// Update issue labels
export async function updateIssueLabels(token: string, owner: string, repo: string, issueNumber: number, labels: string[]) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ labels })
    }
  );

  if (!response.ok) {
    throw new Error(`Erreur GitHub API: ${response.status}`);
  }

  return await response.json();
}

// Add a comment to an issue
export async function addIssueComment(token: string, owner: string, repo: string, issueNumber: number, body: string) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body })
    }
  );

  if (!response.ok) {
    throw new Error(`Erreur GitHub API: ${response.status}`);
  }

  return await response.json();
}

// Fetch available labels for a repository
export async function fetchRepoLabels(token: string, owner: string, repo: string) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/labels`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Erreur GitHub API: ${response.status}`);
  }

  return await response.json();
}

// Close an issue
export async function closeIssue(token: string, owner: string, repo: string, issueNumber: number) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ state: 'closed' })
    }
  );

  if (!response.ok) {
    throw new Error(`Erreur GitHub API: ${response.status}`);
  }

  return await response.json();
}

// Validate GitHub settings
export async function validateSettings(settings: GitHubSettings): Promise<boolean> {
  try {
    await fetchColumnCards(settings);
    return true;
  } catch {
    return false;
  }
}
