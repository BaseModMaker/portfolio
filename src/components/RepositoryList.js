import React, { useState, useEffect } from 'react';
import { fetchGitHubRepos } from '../services/githubService';
import './RepositoryList.css';

function RepositoryList({ isVisible, planetName, onClose }) {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isVisible && repositories.length === 0) {
      loadRepositories();
    }
  }, [isVisible]);

  const loadRepositories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const repos = await fetchGitHubRepos();
      setRepositories(repos);
    } catch (err) {
      setError('Failed to load repositories');
      console.error('Error loading repositories:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isVisible) return null;

  return (
    <div className="repository-overlay">
      <div className="repository-container">
        <div className="repository-header">
          <h2>GitHub Repositories</h2>
          <p className="planet-info">Exploring from {planetName}</p>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="repository-content">
          {loading && (
            <div className="loading-message">
              <p>Loading repositories...</p>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={loadRepositories}>Retry</button>
            </div>
          )}
          
          {!loading && !error && repositories.length > 0 && (
            <div className="repository-list">
              {repositories.map(repo => (
                <div key={repo.id} className="repository-item">
                  <div className="repo-header">
                    <h3>
                      <a href={repo.url} target="_blank" rel="noopener noreferrer">
                        {repo.name}
                      </a>
                    </h3>
                    <div className="repo-stats">
                      {repo.language && <span className="language">{repo.language}</span>}
                      <span className="stars">⭐ {repo.stars}</span>
                      <span className="forks">🍴 {repo.forks}</span>
                    </div>
                  </div>
                  
                  {repo.description && (
                    <p className="repo-description">{repo.description}</p>
                  )}
                  
                  <div className="repo-meta">
                    <span>Updated: {formatDate(repo.updatedAt)}</span>
                    <span>Created: {formatDate(repo.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && !error && repositories.length === 0 && (
            <div className="empty-message">
              <p>No repositories found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RepositoryList;
