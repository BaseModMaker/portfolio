import React, { useState, useCallback } from 'react';
import Planet from './Planet';
import OrbitRing from './OrbitRing';
import Sun from './Sun';

function Planets({ followingPlanet, onPlanetSelect, planets, planetRefs, currentSystemName, onSystemMenuOpen, sunConfig, systemDropdownOpen = false }) {
  // Determine if labels should be visible (hide when following any planet, including for sun)
  const showLabels = !followingPlanet;

  // Track hovered state for sun and planets
  const [sunHovered, setSunHovered] = useState(false);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);

  // Callbacks to pass down
  const handleSunHover = useCallback((hovered) => {
    setSunHovered(hovered);
  }, []);

  // Only set hoveredPlanet if hovered, otherwise clear
  const handlePlanetLabelHover = useCallback((planetNameOrBool) => {
    if (planetNameOrBool && typeof planetNameOrBool === 'string') {
      setHoveredPlanet(planetNameOrBool);
    } else {
      setHoveredPlanet(null);
    }
  }, []);

  return (
    <>
      {/* Sun - only show label if no planet label is hovered and system dropdown is not open */}
      <Sun 
        currentSystemName={currentSystemName}
        onSystemMenuOpen={onSystemMenuOpen}
        sunConfig={sunConfig}
        showLabels={!followingPlanet && !hoveredPlanet && !systemDropdownOpen}
        onHover={setSunHovered}
      />
      
      {/* Orbit rings */}
      {planets.map((planet, index) => (
        <OrbitRing 
          key={`ring-${index}`} 
          radius={planet.orbitRadius}
          planetName={planet.name}
          onPlanetSelect={onPlanetSelect}
          isSelected={followingPlanet === planet.name}
          followingPlanet={followingPlanet}
        />
      ))}
      
      {/* Planets - only hide label if following a planet */}
      {planets.map((planet, index) => (
        <Planet
          key={index}
          orbitRadius={planet.orbitRadius}
          size={planet.size}
          orbitSpeed={planet.orbitSpeed}
          rotationSpeed={planet.rotationSpeed}
          startAngle={planet.startAngle}
          planetProps={planet.props}
          planetName={planet.name}
          isSelected={followingPlanet === planet.name}
          hovered={false}
          followingPlanet={followingPlanet}
          planetRef={(el) => {
            if (el && planetRefs.current) {
              planetRefs.current[planet.name] = el;
            }
          }}
          showLabel={!followingPlanet}
          onLabelHover={handlePlanetLabelHover}
        />
      ))}
    </>
  );
}

export default Planets;
