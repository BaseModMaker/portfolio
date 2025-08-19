import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import planetsData from '../data/planetsData.json';
import SpaceshipDashboard from './SpaceshipDashboard';
import ScanCarousel from './ScanCarousel';
import CameraController from './CameraController';
import Planets from './Planets';

function SolarSystem({ isVisible = true }) {
  const [systemOpacity, setSystemOpacity] = useState(0);
  const [followingPlanet, setFollowingPlanet] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showScanCarousel, setShowScanCarousel] = useState(false);
  const planetRefs = useRef({});
  const lastPlanetChangeTime = useRef(0);
  const isChangingPlanet = useRef(false);

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
    const now = Date.now();
    
    // Prevent rapid planet changes (debounce with 500ms)
    if (isChangingPlanet.current || (now - lastPlanetChangeTime.current) < 500) {
      return;
    }
    
    isChangingPlanet.current = true;
    lastPlanetChangeTime.current = now;
    
    setFollowingPlanet(planetName);
    setShowDashboard(!!planetName); // Show dashboard when a planet is selected
    
    // Reset the changing flag after animation duration
    setTimeout(() => {
      isChangingPlanet.current = false;
    }, 2100); // Slightly longer than animation duration
  };

  const handleCloseDashboard = () => {
    setShowDashboard(false);
    setFollowingPlanet(null);
  };

  const handleCloseScanCarousel = () => {
    setShowScanCarousel(false);
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

      <ScanCarousel 
        planetName={followingPlanet}
        isVisible={showScanCarousel}
        onClose={handleCloseScanCarousel}
      />
    </div>
  );
}

export default SolarSystem;
