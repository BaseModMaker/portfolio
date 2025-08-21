import React, { useState, useCallback } from 'react';
import Planet from './Planet';
import OrbitRing from './OrbitRing';
import Sun from './Sun';

function Planets({ followingPlanet, onPlanetSelect, planets, planetRefs, currentSystemName, onSystemMenuOpen, sunConfig, systemDropdownOpen = false, systemPosition = [0,0,0] }) {
  // Track hovered state for sun and planets
  const [sunHovered, setSunHovered] = useState(false);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);

  // Only set hoveredPlanet if hovered, otherwise clear
  const handlePlanetLabelHover = useCallback((planetNameOrBool) => {
    if (planetNameOrBool && typeof planetNameOrBool === 'string') {
      setHoveredPlanet(planetNameOrBool);
    } else {
      setHoveredPlanet(null);
    }
  }, []);

  // Disable orbit ring highlight if sun label is shown (sunHovered and no planet label hovered and dropdown not open)
  const disableOrbitHighlight = sunHovered && !hoveredPlanet && !systemDropdownOpen;

  // Show planet labels if not following a planet
  const showLabels = !followingPlanet;

  return (
    <>
      {/* Sun - only show label if hovered and no planet label is hovered and system dropdown is not open */}
      <Sun 
        currentSystemName={currentSystemName}
        onSystemMenuOpen={onSystemMenuOpen}
        sunConfig={sunConfig}
        showLabels={sunHovered && !hoveredPlanet && !systemDropdownOpen}
        onHover={setSunHovered}
        systemPosition={systemPosition}
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
          disableHighlight={disableOrbitHighlight}
        />
      ))}
      
      {/* Planets - show label if not following a planet */}
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
          showLabel={showLabels}
          onLabelHover={handlePlanetLabelHover}
        />
      ))}
    </>
  );
}

export default Planets;
