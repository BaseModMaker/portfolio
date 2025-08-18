import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import planetsData from '../data/planetsData.json';
import SpaceshipDashboard from './SpaceshipDashboard';
import CameraController from './CameraController';
import Planets from './Planets';

// TODO
// add more planets
// camera to sun if click too fast
// add cv and socials

function SolarSystem({ isVisible = true }) {
  const [systemOpacity, setSystemOpacity] = useState(0);
  const [followingPlanet, setFollowingPlanet] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const planetRefs = useRef({});

  const orbitConstant = 0.1;
  const planets = planetsData.planets.map(planet => ({
    ...planet,
    orbitSpeed: planet.orbitSpeed * orbitConstant,
    rotationSpeed: planet.rotationSpeed * orbitConstant
  }));

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        setSystemOpacity(1);
      }, 100);
    }
  }, [isVisible]);

  const handlePlanetSelect = (planetName) => {
    setFollowingPlanet(planetName);
    setShowDashboard(!!planetName); // Show dashboard when a planet is selected
  };

  const handleCloseDashboard = () => {
    setShowDashboard(false);
    setFollowingPlanet(null);
  };

  if (!isVisible) return null;

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      opacity: systemOpacity,
      transition: 'opacity 1.5s ease-in',
      background: 'radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)',
      overflow: 'hidden'
    }}>
      <Canvas 
        camera={{ position: [0, 25, 30], fov: 40 }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        
        <Planets 
          followingPlanet={followingPlanet}
          onPlanetSelect={handlePlanetSelect}
          planets={planets}
          planetRefs={planetRefs}
        />
        
        <CameraController 
          followingPlanet={followingPlanet}
          planets={planets}
          planetRefs={planetRefs}
        />
      </Canvas>
      
      <SpaceshipDashboard 
        isVisible={showDashboard}
        planetName={followingPlanet}
        onClose={handleCloseDashboard}
      />
    </div>
  );
}

export default SolarSystem;
