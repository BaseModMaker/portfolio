import React, { useState, useEffect } from 'react';
import './SatelliteScanner.css';

function SatelliteScanner({ planetName, isVisible, onScanClick }) {
  const [scanImage, setScanImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

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

  if (!isVisible) return null;

  return (
    <div className="satellite-scanner">
      <div className="scanner-header">
        <div className="scanner-title">
          <span className="satellite-icon">🛰️</span>
          LIVE SATELLITE SCAN
        </div>
        <div className="target-info">Target: {planetName}</div>
      </div>
      
      <div className="scan-window" onClick={onScanClick}>
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
      
      <div className="scanner-footer">
        <div className="status-indicators">
          <div className={`status-light ${scanning ? 'active' : scanImage ? 'success' : 'error'}`}></div>
          <span className="status-text">
            {scanning ? 'SCANNING' : scanImage ? 'READY' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default SatelliteScanner;
