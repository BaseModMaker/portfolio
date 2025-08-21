import React, { useRef, useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { createRealisticPlanet } from './PlanetGenerator';
import PlanetLabel from './PlanetLabel';

function Sun({ currentSystemName, onSystemMenuOpen, sunConfig, showLabels = true, onHover }) {
  const meshRef = useRef();
  const actualSunRef = useRef();
  const labelRef = useRef();
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

  // Replace hovered state logic:
  const handlePointerEnter = () => {
    setHovered(true);
    if (onHover) onHover(true);
  };
  const handlePointerLeave = () => {
    setHovered(false);
    if (onHover) onHover(false);
  };

  // Label positioning - create a fixed offset to the side like planets
  const labelOffset = 5; // Distance to the side
  const sunSize = sunConfig?.size || 1;

  // Sun label data for PlanetLabel
  const sunLabelData = {
    systemName: currentSystemName,
    subtitle: 'Click to change system'
  };

  return (
    <group ref={meshRef}>
      {/* Sun mesh with click handler */}
      <group
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <RealisticSun ref={actualSunRef} />
        <pointLight 
          intensity={sunConfig?.lightIntensity || 2} 
          color={sunConfig?.lightColor || "#FFA500"} 
        />
      </group>

      {/* Sun label - appears immediately when hovered and showLabels is true */}
      {showLabels && hovered && (
        <group position={[labelOffset, 0, 0]}>
          <PlanetLabel 
            ref={labelRef}
            planetRef={actualSunRef} 
            planetName={`sun-${currentSystemName}`}
            planetSize={sunSize}
            isSun={true}
            sunData={sunLabelData}
          />
        </group>
      )}
    </group>
  );
}

export default Sun;
