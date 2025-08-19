import React, { useState, useEffect } from 'react';
import planetsData from '../data/planetsData.json';
import { fetchSpecificRepo, fetchRepoLanguages, fetchRepoCommits } from '../services/githubService';
import ScanCarousel from './ScanCarousel';
import './SpaceshipDashboard.css';

function SpaceshipDashboard({ isVisible, planetName, onClose }) {
  const [repository, setRepository] = useState(null);
  const [languages, setLanguages] = useState({});
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [showScanCarousel, setShowScanCarousel] = useState(false);
  const [scanImage, setScanImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    if (isVisible && planetName) {
      loadRepositoryData();
      startScan();
    } else {
      setScanImage(null);
      setScanning(false);
      setScanProgress(0);
    }
  }, [isVisible, planetName]);

  const startScan = async () => {
    setScanning(true);
    setScanProgress(0);
    
    // Simulate scanning progress
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          loadScanImage();
          return 100;
        }
        return prev + 5;
      });
    }, 50);
  };

  const loadScanImage = async () => {
    try {
      // Try to load the first scan image for this planet
      const imagePath = `/portfolio/live-scans/${planetName}-1.jpg`;
      const img = new Image();
      img.onload = () => {
        setScanImage(imagePath);
        setScanning(false);
      };
      img.onerror = () => {
        // Fallback to PNG if JPG doesn't exist
        const pngPath = `/portfolio/live-scans/${planetName}-1.png`;
        const pngImg = new Image();
        pngImg.onload = () => {
          setScanImage(pngPath);
          setScanning(false);
        };
        pngImg.onerror = () => {
          setScanning(false);
        };
        pngImg.src = pngPath;
      };
      img.src = imagePath;
    } catch (error) {
      setScanning(false);
    }
  };

  const loadRepositoryData = async () => {
    setLoading(true);
    setError(null);
    
    // First, check if the planet has hardcoded project data
    const planet = planetsData.planets.find(p => p.name === planetName);
    
    if (planet && planet.projectData) {
      // Use hardcoded data
      setProjectData(planet.projectData);
      setRepository(planet.projectData);
      setLanguages(planet.projectData.languages || {});
      setCommits(planet.projectData.commits || []);
      setLoading(false);
      return;
    }
    
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  const formatSize = (sizeValue) => {
    if (!sizeValue) return 'N/A';
    
    // If it's already a formatted string (like "0.1MB"), return it
    if (typeof sizeValue === 'string' && sizeValue.includes('MB')) {
      return sizeValue;
    }
    
    // If it's a number, format it
    if (typeof sizeValue === 'number') {
      if (sizeValue === 0) return '0 KB';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(sizeValue) / Math.log(k));
      return parseFloat((sizeValue / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    return 'N/A';
  };

  const getLanguagePercentages = () => {
    // Handle hardcoded language string (like "TypeScript 10%, JavaScript 90%")
    if (repository.language && typeof repository.language === 'string' && repository.language.includes('%')) {
      const languageString = repository.language;
      const languageParts = languageString.split(',').map(part => part.trim());
      
      return languageParts.map(part => {
        const match = part.match(/^(.+?)\s+(\d+(?:\.\d+)?)%$/);
        if (match) {
          return {
            language: match[1].trim(),
            percentage: match[2],
            bytes: 0 // Not applicable for hardcoded data
          };
        }
        return null;
      }).filter(Boolean);
    }
    
    // Handle GitHub API language data (object with byte counts)
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

  const handleScanClick = () => {
    setShowScanCarousel(true);
  };

  const handleCloseScanCarousel = () => {
    setShowScanCarousel(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="spaceship-dashboard">
        {/* Satellite Scanner Panel */}
        <div className="dashboard-panel satellite-panel">
          <div className="panel-header satellite-header">
            <h3>SATELLITE SCAN</h3>
            <div className="scan-line"></div>
          </div>
          
          {/* Integrated Satellite Scanner */}
          <div className="integrated-satellite-scanner">
            <div className="scanner-info">
              <div className="scanner-title">
                <span className="satellite-icon">🛰️</span>
                LIVE SATELLITE FEED
              </div>
              <div className="target-info">Target: {planetName}</div>
            </div>
            
            <div className="scan-window" onClick={handleScanClick}>
              {scanning ? (
                <div className="scanning-display">
                  <div className="scan-grid">
                    {Array.from({ length: 64 }, (_, i) => (
                      <div 
                        key={i} 
                        className={`scan-pixel ${scanProgress > (i / 64) * 100 ? 'scanned' : ''}`}
                      />
                    ))}
                  </div>
                  <div className="scan-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <div className="progress-text">SCANNING... {Math.round(scanProgress)}%</div>
                  </div>
                </div>
              ) : scanImage ? (
                <div className="scan-result">
                  <img src={scanImage} alt={`Scan of ${planetName}`} />
                  <div className="scan-overlay">
                    <div className="crosshairs"></div>
                    <div className="scan-data">
                      <div className="data-line">SCAN COMPLETE</div>
                      <div className="data-line">CLICK TO ANALYZE</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="scan-error">
                  <div className="error-text">SCAN FAILED</div>
                  <div className="error-subtext">No satellite data available</div>
                </div>
              )}
            </div>
            
            <div className="scanner-status">
              <div className="status-indicators">
                <div className={`status-light ${scanning ? 'active' : scanImage ? 'success' : 'error'}`}></div>
                <span className="status-text">
                  {scanning ? 'SCANNING' : scanImage ? 'READY' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Repository Data Panel */}
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
                <div className="info-grid compact">
                  <div className="info-item">
                    <span className="label">NAME:</span>
                    <span className="value">{repository.name || planetName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">SIZE:</span>
                    <span className="value">{formatSize(repository.size)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">CREATED:</span>
                    <span className="value">{formatDate(repository.created_at || repository.createdAt)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">UPDATED:</span>
                    <span className="value">{formatDate(repository.updated_at || repository.updatedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h4>DESCRIPTION</h4>
                <p className="description">
                  {repository.description || 'No description available'}
                </p>
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
                <h4>STATISTICS</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{repository.stargazers_count || repository.stars || 0}</div>
                    <div className="stat-label">STARS</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{repository.forks_count || repository.forks || 0}</div>
                    <div className="stat-label">FORKS</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{repository.watchers_count || repository.watchers || 0}</div>
                    <div className="stat-label">WATCHERS</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{repository.open_issues_count || repository.openIssues || repository.issues || 0}</div>
                    <div className="stat-label">ISSUES</div>
                  </div>
                </div>
              </div>

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
                  {repository.html_url || repository.url ? (
                    <a 
                      href={repository.html_url || repository.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="action-btn"
                    >
                      VIEW ON GITHUB
                    </a>
                  ) : null}
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
                  {(repository.clone_url || repository.cloneUrl) && (
                    <button 
                      onClick={() => navigator.clipboard.writeText(repository.clone_url || repository.cloneUrl)}
                      className="action-btn"
                    >
                      COPY CLONE URL
                    </button>
                  )}
                  {!repository.html_url && !repository.url && !repository.homepage && !repository.clone_url && !repository.cloneUrl && (
                    <p className="no-commits">No actions available</p>
                  )}
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

      <ScanCarousel 
        planetName={planetName}
        isVisible={showScanCarousel}
        onClose={handleCloseScanCarousel}
      />
    </>
  );
}

export default SpaceshipDashboard;
