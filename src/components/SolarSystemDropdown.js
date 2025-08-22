import React, { useState, useRef, useEffect } from 'react';
import { solarSystemsConfig } from '../utils/solarSystemManager';
import './SolarSystemDropdown.css';

function SolarSystemDropdown({ currentSystem, onSystemChange, isVisible, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    if (isVisible) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isVisible]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (isOpen) {
          setIsOpen(false);
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSystemSelect = (systemId) => {
    onSystemChange(systemId);
    setIsOpen(false);
    // Removed: onClose(); -- let parent handle closing after system change
  };

  if (!isVisible || !isOpen) return null;

  return (
    <div className="solar-system-dropdown-overlay">
      <div className="solar-system-dropdown" ref={dropdownRef}>
        <div className="dropdown-header">
          <h3>SELECT SOLAR SYSTEM</h3>
          <button className="dropdown-close" onClick={() => { setIsOpen(false); onClose(); }}>×</button>
        </div>
        
        <div className="dropdown-content">
          {solarSystemsConfig.map((system) => (
            <div
              key={system.id}
              className={`system-option ${currentSystem === system.id ? 'active' : ''}`}
              onClick={() => handleSystemSelect(system.id)}
            >
              <div className="system-icon">{system.icon}</div>
              <div className="system-info">
                <div className="system-name">{system.name}</div>
                <div className="system-description">{system.description}</div>
              </div>
              <div className="system-status">
                {currentSystem === system.id && (
                  <span className="current-indicator">CURRENT</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SolarSystemDropdown;
