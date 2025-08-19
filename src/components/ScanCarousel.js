import React, { useState, useEffect } from 'react';
import './ScanCarousel.css';

function ScanCarousel({ planetName, isVisible, onClose }) {
  const [scanImages, setScanImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible && planetName) {
      loadAllScans();
    }
  }, [isVisible, planetName]);

  const loadAllScans = async () => {
    setLoading(true);
    const images = [];
    let index = 1;
    
    // Try to load images until we find no more
    while (index <= 10) { // Limit to 10 images max
      try {
        const extensions = ['jpg', 'png', 'pdf'];
        let found = false;
        
        for (const ext of extensions) {
          const imagePath = `/portfolio/live-scans/${planetName}-${index}.${ext}`;
          const img = new Image();
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              images.push({
                src: imagePath,
                index: index,
                type: ext
              });
              found = true;
              resolve();
            };
            img.onerror = reject;
            img.src = imagePath;
          }).catch(() => {});
          
          if (found) break;
        }
        
        if (!found) break;
        index++;
      } catch (error) {
        break;
      }
    }
    
    setScanImages(images);
    setCurrentIndex(0);
    setLoading(false);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % scanImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + scanImages.length) % scanImages.length);
  };

  if (!isVisible) return null;

  return (
    <div className="scan-carousel-overlay">
      <div className="scan-carousel">
        <div className="carousel-header">
          <div className="header-info">
            <span className="satellite-icon">🛰️</span>
            <div>
              <div className="carousel-title">DETAILED SATELLITE ANALYSIS</div>
              <div className="carousel-subtitle">Target: {planetName}</div>
            </div>
          </div>
          <button className="carousel-close" onClick={onClose}>×</button>
        </div>
        
        <div className="carousel-content">
          {loading ? (
            <div className="carousel-loading">
              <div className="loading-spinner"></div>
              <div className="loading-text">Loading satellite data...</div>
            </div>
          ) : scanImages.length > 0 ? (
            <>
              <div className="carousel-main">
                <button 
                  className="carousel-nav prev" 
                  onClick={prevImage}
                  disabled={scanImages.length <= 1}
                >
                  ‹
                </button>
                
                <div className="scan-display">
                  <div className="scan-frame">
                    <img 
                      src={scanImages[currentIndex]?.src} 
                      alt={`Scan ${currentIndex + 1} of ${planetName}`}
                    />
                    <div className="scan-overlay-detailed">
                      <div className="scan-grid-overlay"></div>
                      <div className="scan-info">
                        <div className="scan-timestamp">
                          SCAN {scanImages[currentIndex]?.index.toString().padStart(2, '0')}
                        </div>
                        <div className="scan-quality">HIGH RESOLUTION</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button 
                  className="carousel-nav next" 
                  onClick={nextImage}
                  disabled={scanImages.length <= 1}
                >
                  ›
                </button>
              </div>
              
              <div className="carousel-thumbnails">
                {scanImages.map((image, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                    onClick={() => setCurrentIndex(index)}
                  >
                    <img src={image.src} alt={`Thumbnail ${index + 1}`} />
                    <div className="thumbnail-overlay">
                      <span>{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-scans">
              <div className="no-scans-icon">📡</div>
              <div className="no-scans-text">No satellite data available for {planetName}</div>
            </div>
          )}
        </div>
        
        <div className="carousel-footer">
          <div className="scan-stats">
            {scanImages.length > 0 && (
              <>
                <span>Image {currentIndex + 1} of {scanImages.length}</span>
                <span>•</span>
                <span>Satellite Network Active</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScanCarousel;
