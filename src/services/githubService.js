const GITHUB_USERNAME = 'BaseModMaker'; // Replace with your actual GitHub username
const GITHUB_API_URL = 'https://api.github.com';

export const fetchGitHubRepos = async () => {
  try {
    const response = await fetch(`${GITHUB_API_URL}/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const repos = await response.json();
    
    // Filter and format the repositories
    return repos
      .filter(repo => !repo.fork) // Exclude forked repositories
      .map(repo => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        updatedAt: repo.updated_at,
        createdAt: repo.created_at,
        size: repo.size,
        defaultBranch: repo.default_branch,
        topics: repo.topics || [],
        license: repo.license,
        openIssues: repo.open_issues_count,
        watchers: repo.watchers_count,
        archived: repo.archived,
        disabled: repo.disabled,
        private: repo.private,
        homepage: repo.homepage,
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url
      }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); // Sort by most recently updated
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    throw error;
  }
};

export const fetchSpecificRepo = async (repoName) => {
  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repoName}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Repository not found
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const repo = await response.json();
    
    return {
      id: repo.id,
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      updatedAt: repo.updated_at,
      createdAt: repo.created_at,
      size: repo.size,
      defaultBranch: repo.default_branch,
      topics: repo.topics || [],
      license: repo.license,
      openIssues: repo.open_issues_count,
      watchers: repo.watchers_count,
      archived: repo.archived,
      disabled: repo.disabled,
      private: repo.private,
      homepage: repo.homepage,
      cloneUrl: repo.clone_url,
      sshUrl: repo.ssh_url
    };
  } catch (error) {
    console.error('Error fetching specific repository:', error);
    throw error;
  }
};

export const fetchRepoLanguages = async (repoName) => {
  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repoName}/languages`);
    
    if (!response.ok) {
      return {};
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching repository languages:', error);
    return {};
  }
};

export const fetchRepoCommits = async (repoName, limit = 5) => {
  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repoName}/commits?per_page=${limit}`);
    
    if (!response.ok) {
      return [];
    }
    
    const commits = await response.json();
    return commits.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url
    }));
  } catch (error) {
    console.error('Error fetching repository commits:', error);
    return [];
  }
};
