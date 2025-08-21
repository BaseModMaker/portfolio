import React, { useRef, useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { createRealisticPlanet } from './PlanetGenerator';

function Sun({ currentSystemName, onSystemMenuOpen, sunConfig }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Reset hover state when system name changes
  useEffect(() => {
    setHovered(false);
  }, [currentSystemName]);
  
  const RealisticSun = createRealisticPlanet({
    size: sunConfig?.size || 1,
    rotationSpeed: sunConfig?.rotationSpeed || 0.0005,
    surfaceRoughness: 0.1,
    metalness: 0.0,
    emissive: sunConfig?.emissiveColor || '#FF6600',
    emissiveIntensity: sunConfig?.emissiveIntensity || 0.8,
    surfaceColor: sunConfig?.color || '#FFA500'
  });

  const handleClick = (e) => {
    e.stopPropagation();
    onSystemMenuOpen();
  };

  return (
    <group ref={meshRef}>
      <group
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <RealisticSun />
        <pointLight 
          intensity={sunConfig?.lightIntensity || 2} 
          color={sunConfig?.lightColor || "#FFA500"} 
        />
        
        {hovered && (
          <Html
            center
            distanceFactor={8}
            style={{
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            <div className="sun-label">
              <div className="sun-textbox">
                <div className="sun-content">
                  <div className="sun-title">{currentSystemName}</div>
                  <div className="sun-subtitle">Click to change system</div>
                </div>
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

export default Sun;
