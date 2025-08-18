import React from 'react';
import Planet from './Planet';
import OrbitRing from './OrbitRing';
import Sun from './Sun';

function Planets({ followingPlanet, onPlanetSelect, planets, planetRefs }) {
  return (
    <>
      {/* Sun */}
      <Sun />
      
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
      
      {/* Planets */}
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
        />
      ))}
    </>
  );
}

export default Planets;
