import React, { useState, useEffect } from 'react';
import ScanCarousel from './ScanCarousel';
import { getCurrentSystemData, getNextSystemId, getPreviousSystemId, getSystemConfig } from '../utils/solarSystemManager';
import './SpaceshipDashboard.css';

function SpaceshipDashboard({ isVisible, planetName, onClose, onPlanetNavigate, onCarouselStateChange, currentSystem, onSystemChange }) {
  const [scanImage, setScanImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showScanCarousel, setShowScanCarousel] = useState(false); // <-- Add this line

  // Get current system data to find the planet
  const systemData = getCurrentSystemData(currentSystem);
  const planet = systemData.planets.find(p => p.name === planetName);
  const repository = planet?.projectData || {};
  const commits = repository.commits || [];
  const languages = repository.languages || {};

  useEffect(() => {
    if (isVisible && planetName) {
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
      const imagePath = `/portfolio/live-scans/${planetName}-1.jpg`;
      const img = new window.Image();
      img.onload = () => {
        setScanImage(imagePath);
        setScanning(false);
      };
      img.onerror = () => {
        const pngPath = `/portfolio/live-scans/${planetName}-1.png`;
        const pngImg = new window.Image();
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  const formatSize = (sizeValue) => {
    if (!sizeValue) return 'N/A';
    if (typeof sizeValue === 'string' && sizeValue.includes('MB')) {
      return sizeValue;
    }
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
    if (repository.language && typeof repository.language === 'string' && repository.language.includes('%')) {
      const languageString = repository.language;
      const languageParts = languageString.split(',').map(part => part.trim());
      return languageParts.map(part => {
        const match = part.match(/^(.+?)\s+(\d+(?:\.\d+)?)%$/);
        if (match) {
          return {
            language: match[1].trim(),
            percentage: match[2],
            bytes: 0
          };
        }
        return null;
      }).filter(Boolean);
    }
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

  const systemPlanets = systemData.planets;
  const currentPlanetIndex = systemPlanets.findIndex(p => p.name === planetName);

  const handlePreviousPlanet = () => {
    if (currentPlanetIndex > 0) {
      const previousPlanet = systemPlanets[currentPlanetIndex - 1];
      onPlanetNavigate(previousPlanet.name);
    } else {
      const previousSystemId = getPreviousSystemId(currentSystem);
      const previousSystemData = getCurrentSystemData(previousSystemId);
      onSystemChange(previousSystemId, previousSystemData.planets[previousSystemData.planets.length - 1].name);
    }
  };

  const handleNextPlanet = () => {
    if (currentPlanetIndex < systemPlanets.length - 1) {
      const nextPlanet = systemPlanets[currentPlanetIndex + 1];
      onPlanetNavigate(nextPlanet.name);
    } else {
      const nextSystemId = getNextSystemId(currentSystem);
      const nextSystemData = getCurrentSystemData(nextSystemId);
      onSystemChange(nextSystemId, nextSystemData.planets[0].name);
    }
  };

  const getTags = () => {
    if (repository.topics && Array.isArray(repository.topics)) {
      return repository.topics;
    }
    return [];
  };

  const getPrevButtonLabel = () => {
    if (currentPlanetIndex > 0) {
      return 'PREV';
    }
    const prevSystemConfig = getSystemConfig(getPreviousSystemId(currentSystem));
    return prevSystemConfig.icon;
  };

  const getNextButtonLabel = () => {
    if (currentPlanetIndex < systemPlanets.length - 1) {
      return 'NEXT';
    }
    const nextSystemConfig = getSystemConfig(getNextSystemId(currentSystem));
    return nextSystemConfig.icon;
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
          <div className="integrated-satellite-scanner">
            <div className="scanner-info">
              <div className="scanner-title">
                <span className="satellite-icon">🛰️</span>
                LIVE SATELLITE FEED
                <span className="target-info">
                  <div className="scanner-status">
                    <div className="status-indicators">
                      <div className={`status-light ${scanning ? 'active' : scanImage ? 'success' : 'error'}`}></div>
                      <span className="status-text">
                        {scanning ? 'SCANNING' : scanImage ? 'READY' : 'OFFLINE'}
                      </span>
                    </div>
                  </div>
                </span>
              </div>
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
          </div>
        </div>

        {/* Repository Data Panel */}
        <div className="dashboard-panel right-panel">
          <div className="panel-header">
            <h3>REPOSITORY SCAN</h3>
            <div className="scan-line"></div>
          </div>
          <div className="repo-info">
            <div className="info-section">
              <h4>BASIC INFO</h4>
              <div>
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
            {getTags().length > 0 && (
              <div className="info-section">
                <h4>TAGS</h4>
                <div className="tags-container">
                  {getTags().map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="info-section">
              <h4>DESCRIPTION</h4>
              <p className="description">
                {repository.description || 'No description available'}
              </p>
            </div>
          </div>
        </div>

        {/* Left Panel */}
        <div className="dashboard-panel left-panel">
          <div className="panel-header">
            <h3>TECHNICAL ANALYSIS</h3>
            <div className="scan-line"></div>
          </div>
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
            {(repository.url || repository.homepage) && (
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
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="navigation-controls">
          <button 
            className="nav-btn prev-btn"
            onClick={handlePreviousPlanet}
            title={currentPlanetIndex <= 0 ? `Switch to ${getSystemConfig(getPreviousSystemId(currentSystem)).name}` : 'Previous planet'}
          >
            <span>‹</span>
            <span className="nav-label">{getPrevButtonLabel()}</span>
          </button>
          <button className="dashboard-close" onClick={onClose}>
            <span>×</span>
            <span className="close-label">EXIT SCAN</span>
          </button>
          <button 
            className="nav-btn next-btn"
            onClick={handleNextPlanet}
            title={currentPlanetIndex >= systemPlanets.length - 1 ? `Switch to ${getSystemConfig(getNextSystemId(currentSystem)).name}` : 'Next planet'}
          >
            <span>›</span>
            <span className="nav-label">{getNextButtonLabel()}</span>
          </button>
        </div>
      </div>
      <ScanCarousel 
        planetName={planetName}
        isVisible={scanImage && showScanCarousel}
        onClose={handleCloseScanCarousel}
        onCarouselStateChange={onCarouselStateChange}
      />
    </>
  );
}

export default SpaceshipDashboard;
