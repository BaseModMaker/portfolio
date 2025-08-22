import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import SpaceshipDashboard from './SpaceshipDashboard';
import CameraController from './CameraController';
import Planets from './Planets';
import SolarSystemDropdown from './SolarSystemDropdown';
import { getCurrentSystemData, SOLAR_SYSTEMS, getSystemConfig } from '../utils/solarSystemManager';

// TODO Add master projects
// TODO Import project data from GitHub
// TODO Add cookies or localStorage so that data is keeped for 12h and dont call GitHub api all the time

// Starry background component
function StarryBackground({ starCount = 400 }) {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Fill background with a very dark blue color
    ctx.fillStyle = "#0a0e16ff";
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = Math.random() * 1.2 + 0.2;
      const alpha = Math.random() * 0.7 + 0.3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = `rgba(255,255,${Math.floor(180 + Math.random() * 75)},${alpha})`;
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = Math.random() * 2;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, []);

  // Redraw on resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        // Clear and redraw
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      // Trigger re-draw by updating key
      // (force re-render by changing key)
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        background: '#101624'
      }}
      aria-hidden="true"
    />
  );
}

function SolarSystem({ isVisible = true, onDashboardStateChange, onCarouselStateChange }) {
  const [systemOpacity, setSystemOpacity] = useState(0);
  const [followingPlanet, setFollowingPlanet] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showScanCarousel, setShowScanCarousel] = useState(false);
  const [currentSystem, setCurrentSystem] = useState(SOLAR_SYSTEMS.PERSONAL);
  const [showSystemDropdown, setShowSystemDropdown] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState('right');
  const [pendingSystem, setPendingSystem] = useState(null);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'slideOut' | 'slideIn'
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
  const systemPosition = sunConfig?.sunPosition ?? [0, 0, 0]; // treat sunPosition as systemPosition

  // Camera position and FOV should be relative to the local system, not offset by systemPosition
  const cameraPosition = [
    0,
    sunConfig?.cameraHeight ?? 25,
    sunConfig?.cameraDistance ?? 30
  ];
  const cameraFov = sunConfig?.fov ?? 40;

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
    if (newSystemId === currentSystem || phase !== 'idle') {
      setShowSystemDropdown(false);
      return;
    }
    // Determine direction (right if next, left if previous)
    const systems = Object.values(SOLAR_SYSTEMS);
    const currentIdx = systems.indexOf(currentSystem);
    const nextIdx = systems.indexOf(newSystemId);
    const direction = nextIdx > currentIdx || (currentIdx === systems.length - 1 && nextIdx === 0) ? 'right' : 'left';

    setTransitionDirection(direction);
    setPendingSystem({ id: newSystemId, targetPlanetName });
    setPhase('slideOut');
    setShowSystemDropdown(false);
  };

  // Animation phase management
  useEffect(() => {
    if (phase === 'slideOut' && pendingSystem) {
      const timeout = setTimeout(() => {
        // Switch system after slide out
        setCurrentSystem(pendingSystem.id);
        if (pendingSystem.targetPlanetName) {
          setFollowingPlanet(pendingSystem.targetPlanetName);
          setShowDashboard(true);
          if (onDashboardStateChange) onDashboardStateChange(true);
        } else {
          setFollowingPlanet(null);
          setShowDashboard(false);
          if (onDashboardStateChange) onDashboardStateChange(false);
        }
        setPhase('slideIn');
      }, 350); // Wait between out and in
      return () => clearTimeout(timeout);
    }
    if (phase === 'slideIn') {
      const timeout = setTimeout(() => {
        setPhase('idle');
        setPendingSystem(null);
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [phase, pendingSystem, onDashboardStateChange]);

  // Make sure handleSunClick and handleCloseSystemDropdown are defined before use
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
      overflow: 'hidden',
      zIndex: 1
    }}>
      {/* Solar system transition container */}
      <div
        className={`solar-system-transition-container${phase !== 'idle' ? ' transitioning' : ''} slide-'${transitionDirection}'`}
        style={{
          position: 'absolute',
          width: '100vw',
          height: '100vh',
          top: 0,
          left: 0,
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        <div
          className={`solar-system-slide solar-system-current slide-${transitionDirection} ${
            phase === 'slideOut'
              ? `sliding-out`
              : phase === 'slideIn'
              ? `sliding-in`
              : ''
          }`}
          style={{
            position: 'absolute',
            width: '100vw',
            height: '100vh',
            top: 0,
            left: 0,
            zIndex: 3,
            animation:
              phase === 'slideOut'
                ? `solar-system-slide-out-${transitionDirection} 0.7s cubic-bezier(0.7,0,0.3,1) forwards`
                : phase === 'slideIn'
                ? `solar-system-slide-in-${transitionDirection} 0.7s cubic-bezier(0.7,0,0.3,1) forwards`
                : 'none'
          }}
        >
          <Canvas
            key={'current-' + currentSystem}
            camera={{ position: cameraPosition, fov: cameraFov }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1 }}
          >
            <ambientLight intensity={0.2} />
            <directionalLight position={[10, 10, 5]} intensity={0.5} />
            <group position={systemPosition}>
              <Planets
                followingPlanet={followingPlanet}
                onPlanetSelect={handlePlanetSelect}
                planets={planets}
                planetRefs={planetRefs}
                currentSystemName={systemConfig.name}
                onSystemMenuOpen={handleSunClick}
                sunConfig={sunConfig}
                systemDropdownOpen={showSystemDropdown}
                systemPosition={systemPosition}
              />
              <CameraController
                followingPlanet={followingPlanet}
                planets={planets}
                planetRefs={planetRefs}
                sunPosition={[0, 0, 0]}
              />
            </group>
          </Canvas>
        </div>
      </div>
      
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

// Export StarryBackground for use in App.js
export { StarryBackground };
export default SolarSystem;
