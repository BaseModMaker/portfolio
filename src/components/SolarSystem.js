import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import SpaceshipDashboard from './SpaceshipDashboard';
import CameraController from './CameraController';
import Planets from './Planets';
import SolarSystemDropdown from './SolarSystemDropdown';
import { getCurrentSystemData, SOLAR_SYSTEMS, getSystemConfig } from '../utils/solarSystemManager';

function SolarSystem({ isVisible = true, onDashboardStateChange, onCarouselStateChange }) {
  const [systemOpacity, setSystemOpacity] = useState(0);
  const [followingPlanet, setFollowingPlanet] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showScanCarousel, setShowScanCarousel] = useState(false);
  const [currentSystem, setCurrentSystem] = useState(SOLAR_SYSTEMS.PERSONAL);
  const [showSystemDropdown, setShowSystemDropdown] = useState(false);
  const planetRefs = useRef({});
  const lastPlanetChangeTime = useRef(0);
  const isChangingPlanet = useRef(false);

  const orbitConstant = 0.1;
  
  // Get current system data
  const systemData = getCurrentSystemData(currentSystem);
  const systemConfig = getSystemConfig(currentSystem);
  
  const planets = systemData.planets.map(planet => ({
    ...planet,
    orbitSpeed: planet.orbitSpeed * orbitConstant,
    rotationSpeed: planet.rotationSpeed * orbitConstant
  }));

  // Get camera settings from sun config
  const sunConfig = systemData.sunConfig;
  const cameraPosition = [0, sunConfig?.cameraHeight || 25, sunConfig?.cameraDistance || 30];
  const cameraFov = sunConfig?.fov || 40;

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
    const isDashboardOpen = !!planetName;
    setShowDashboard(isDashboardOpen);
    
    // Notify parent about dashboard state change
    if (onDashboardStateChange) {
      onDashboardStateChange(isDashboardOpen);
    }

    // Reset the changing flag after animation duration
    setTimeout(() => {
      isChangingPlanet.current = false;
    }, 2100); // Slightly longer than animation duration
  };

  const handlePlanetNavigate = (newPlanetName) => {
    // Use the same logic as handlePlanetSelect but for navigation
    const now = Date.now();
    
    if (isChangingPlanet.current || (now - lastPlanetChangeTime.current) < 500) {
      return;
    }
    
    isChangingPlanet.current = true;
    lastPlanetChangeTime.current = now;
    
    setFollowingPlanet(newPlanetName);
    
    setTimeout(() => {
      isChangingPlanet.current = false;
    }, 2100);
  };

  const handleCloseDashboard = () => {
    setShowDashboard(false);
    setFollowingPlanet(null);
    
    // Notify parent about dashboard state change
    if (onDashboardStateChange) {
      onDashboardStateChange(false);
    }
  };

  const handleCloseScanCarousel = () => {
    setShowScanCarousel(false);

    // Notify parent about carousel state change
    if (onCarouselStateChange) {
      onCarouselStateChange(false);
    }
  };

  const handleSystemChange = (newSystemId, targetPlanetName = null) => {
    const now = Date.now();
    
    if (isChangingPlanet.current || (now - lastPlanetChangeTime.current) < 500) {
      return;
    }
    
    isChangingPlanet.current = true;
    lastPlanetChangeTime.current = now;
    
    // Clear current planet refs when switching systems
    planetRefs.current = {};
    
    setCurrentSystem(newSystemId);
    
    if (targetPlanetName) {
      setFollowingPlanet(targetPlanetName);
      setShowDashboard(true);
      
      if (onDashboardStateChange) {
        onDashboardStateChange(true);
      }
    } else {
      setFollowingPlanet(null);
      setShowDashboard(false);
      
      if (onDashboardStateChange) {
        onDashboardStateChange(false);
      }
    }

    setTimeout(() => {
      isChangingPlanet.current = false;
    }, 2100);
  };

  const handleSunClick = () => {
    setShowSystemDropdown(true);
  };

  const handleCloseSystemDropdown = () => {
    setShowSystemDropdown(false);
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
        camera={{ position: cameraPosition, fov: cameraFov }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        
        <Planets 
          followingPlanet={followingPlanet}
          onPlanetSelect={handlePlanetSelect}
          planets={planets}
          planetRefs={planetRefs}
          currentSystemName={systemConfig.name}
          onSystemMenuOpen={handleSunClick}
          sunConfig={sunConfig}
          systemDropdownOpen={showSystemDropdown}
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
        onPlanetNavigate={handlePlanetNavigate}
        onCarouselStateChange={onCarouselStateChange}
        currentSystem={currentSystem}
        onSystemChange={handleSystemChange}
      />
      
      <SolarSystemDropdown
        currentSystem={currentSystem}
        onSystemChange={handleSystemChange}
        isVisible={showSystemDropdown}
        onClose={handleCloseSystemDropdown}
      />
    </div>
  );
}

export default SolarSystem;
