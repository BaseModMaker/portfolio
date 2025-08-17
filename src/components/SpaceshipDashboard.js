import React, { useState, useEffect } from 'react';
import { fetchSpecificRepo, fetchRepoLanguages, fetchRepoCommits } from '../services/githubService';
import './SpaceshipDashboard.css';

function SpaceshipDashboard({ isVisible, planetName, onClose }) {
  const [repository, setRepository] = useState(null);
  const [languages, setLanguages] = useState({});
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isVisible && planetName) {
      loadRepositoryData();
    }
  }, [isVisible, planetName]);

  const loadRepositoryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [repo, langs, recentCommits] = await Promise.all([
        fetchSpecificRepo(planetName),
        fetchRepoLanguages(planetName),
        fetchRepoCommits(planetName, 5)
      ]);

      if (!repo) {
        setError(`Repository "${planetName}" not found`);
        setRepository(null);
        setLanguages({});
        setCommits([]);
      } else {
        setRepository(repo);
        setLanguages(langs);
        setCommits(recentCommits);
      }
    } catch (err) {
      setError('Failed to load repository data');
      console.error('Error loading repository data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getLanguagePercentages = () => {
    const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
    if (total === 0) return [];
    
    return Object.entries(languages)
      .map(([lang, bytes]) => ({
        language: lang,
        percentage: ((bytes / total) * 100).toFixed(1),
        bytes
      }))
      .sort((a, b) => b.bytes - a.bytes);
  };

  if (!isVisible) return null;

  return (
    <div className="spaceship-dashboard">
      {/* Left Panel */}
      <div className="dashboard-panel left-panel">
        <div className="panel-header">
          <h3>REPOSITORY SCAN</h3>
          <div className="scan-line"></div>
        </div>
        
        {loading && (
          <div className="loading-screen">
            <div className="radar-scanner"></div>
            <p>Scanning repository...</p>
          </div>
        )}

        {error && (
          <div className="error-screen">
            <div className="error-icon">⚠</div>
            <p>{error}</p>
            <button onClick={loadRepositoryData} className="retry-btn">RETRY SCAN</button>
          </div>
        )}

        {repository && !loading && (
          <div className="repo-info">
            <div className="info-section">
              <h4>BASIC INFO</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">NAME:</span>
                  <span className="value">{repository.name}</span>
                </div>
                <div className="info-item">
                  <span className="label">SIZE:</span>
                  <span className="value">{formatSize(repository.size * 1024)}</span>
                </div>
                <div className="info-item">
                  <span className="label">CREATED:</span>
                  <span className="value">{formatDate(repository.createdAt)}</span>
                </div>
                <div className="info-item">
                  <span className="label">UPDATED:</span>
                  <span className="value">{formatDate(repository.updatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h4>DESCRIPTION</h4>
              <p className="description">
                {repository.description || 'No description available'}
              </p>
            </div>

            <div className="info-section">
              <h4>STATISTICS</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{repository.stars}</div>
                  <div className="stat-label">STARS</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{repository.forks}</div>
                  <div className="stat-label">FORKS</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{repository.watchers}</div>
                  <div className="stat-label">WATCHERS</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{repository.openIssues}</div>
                  <div className="stat-label">ISSUES</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="dashboard-panel right-panel">
        <div className="panel-header">
          <h3>TECHNICAL ANALYSIS</h3>
          <div className="scan-line"></div>
        </div>

        {repository && !loading && (
          <div className="technical-info">
            <div className="info-section">
              <h4>LANGUAGES</h4>
              <div className="languages-chart">
                {getLanguagePercentages().map((lang, index) => (
                  <div key={lang.language} className="language-bar">
                    <div className="language-info">
                      <span className="lang-name">{lang.language}</span>
                      <span className="lang-percent">{lang.percentage}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${lang.percentage}%`,
                          backgroundColor: `hsl(${(index * 60) % 360}, 70%, 60%)`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="info-section">
              <h4>RECENT COMMITS</h4>
              <div className="commits-list">
                {commits.length > 0 ? commits.map((commit, index) => (
                  <div key={commit.sha} className="commit-item">
                    <div className="commit-message">{commit.message.split('\n')[0]}</div>
                    <div className="commit-meta">
                      <span className="commit-author">{commit.author}</span>
                      <span className="commit-date">{formatDate(commit.date)}</span>
                    </div>
                  </div>
                )) : (
                  <p className="no-commits">No recent commits found</p>
                )}
              </div>
            </div>

            <div className="info-section">
              <h4>ACTIONS</h4>
              <div className="action-buttons">
                <a 
                  href={repository.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="action-btn"
                >
                  VIEW ON GITHUB
                </a>
                {repository.homepage && (
                  <a 
                    href={repository.homepage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="action-btn"
                  >
                    LIVE DEMO
                  </a>
                )}
                <button 
                  onClick={() => navigator.clipboard.writeText(repository.cloneUrl)}
                  className="action-btn"
                >
                  COPY CLONE URL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Close Button */}
      <button className="dashboard-close" onClick={onClose}>
        <span>×</span>
        <span className="close-label">EXIT SCAN</span>
      </button>
    </div>
  );
}

export default SpaceshipDashboard;
