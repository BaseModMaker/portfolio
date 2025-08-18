import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { createRealisticPlanet } from './PlanetGenerator';
import PlanetLabel from './PlanetLabel';
import planetsData from '../data/planetsData.json';
import RepositoryList from './RepositoryList';
import SpaceshipDashboard from './SpaceshipDashboard';

// TODO
// add more planets
// camera to sun if click too fast

// Function to determine ring, line, and label colors based on state
function getRingAppearance(isSelected, hovered, planetName, followingPlanet) {
  let appearance;

  if (isSelected) {
    appearance = { 
      color: '#ff6b6b', 
      opacity: 1.0,
      lineColor: 'rgba(255, 107, 107, 0)',
      labelBorderColor: 'rgba(255, 107, 107, 0)',
      labelBgColor: 'rgba(255, 107, 107, 0)',
      labelFontColor: 'rgba(255, 107, 107, 0)',
      labelInnerBorderColor: 'rgba(255, 107, 107, 0)',
      labelBorderShadowColor: 'rgba(255, 107, 107, 0)'
    };
  } else if (hovered && followingPlanet) {
    // When following a planet, show a different hover color to indicate jump targets
    appearance = { 
      color: '#64ffda', // Use hex instead of rgba for THREE.js
      opacity: 0.6,
      lineColor: 'rgba(100, 255, 218, 0)',
      labelBorderColor: 'rgba(100, 255, 218, 0)',
      labelBgColor: 'rgba(26, 26, 46, 0)',
      labelFontColor: 'rgba(100, 255, 218, 0)',
      labelInnerBorderColor: 'rgba(100, 255, 218, 0)',
      labelBorderShadowColor: 'rgba(100, 255, 218, 0)'
    };
  } else if (hovered && !followingPlanet) {
    // Normal hover when not following any planet
    appearance = { 
      color: '#64ffda', // Use hex instead of rgba for THREE.js
      opacity: 0.8,
      lineColor: 'rgba(100, 255, 218, 1)',
      labelBorderColor: 'rgba(100, 255, 218, 1)',
      labelBgColor: 'rgba(26, 26, 46, 0.9)',
      labelFontColor: '#ffffff',
      labelInnerBorderColor: 'rgba(100, 255, 218, 0.7)',
      labelBorderShadowColor: 'rgba(100, 255, 219, 0.7)'
    };
  } else {
    appearance = { 
      color: '#64ffda', // Use hex color with opacity 0 instead of rgba
      opacity: 0.3,
      lineColor: 'rgba(100, 255, 218, 0)',
      labelBorderColor: 'rgba(100, 255, 218, 0)',
      labelBgColor: 'rgba(26, 26, 46, 0)',
      labelFontColor: 'rgba(100, 255, 218, 0)',
      labelInnerBorderColor: 'rgba(100, 255, 218, 0)',
      labelBorderShadowColor: 'rgba(100, 255, 218, 0)'
    };
  }

  // Update CSS variables for this planet
  if (planetName) {
    document.documentElement.style.setProperty(`--line-color-${planetName}`, appearance.lineColor);
    document.documentElement.style.setProperty(`--label-border-color-${planetName}`, appearance.labelBorderColor);
    document.documentElement.style.setProperty(`--label-bg-color-${planetName}`, appearance.labelBgColor);
    document.documentElement.style.setProperty(`--label-font-color-${planetName}`, appearance.labelFontColor);
    document.documentElement.style.setProperty(`--label-inner-border-color-${planetName}`, appearance.labelInnerBorderColor);
    document.documentElement.style.setProperty(`--label-border-shadow-color-${planetName}`, appearance.labelBorderShadowColor);
  }

  return appearance;
}


// Camera controller component
function CameraController({ followingPlanet, planets, planetRefs }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const [isAnimating, setIsAnimating] = useState(false);

  useFrame(() => {
    if (followingPlanet && !isAnimating && planetRefs.current[followingPlanet]) {
      const planetRef = planetRefs.current[followingPlanet];
      const planet = planets.find(p => p.name === followingPlanet);
      
      if (planetRef && planet) {
        // Get the actual world position of the planet
        const planetWorldPos = new THREE.Vector3();
        planetRef.getWorldPosition(planetWorldPos);
        
        // Calculate camera position relative to planet
        const cameraDistance = Math.max(planet.size * 15, 3);
        const cameraOffset = new THREE.Vector3(cameraDistance, cameraDistance * 0.8, cameraDistance);
        const cameraPos = planetWorldPos.clone().add(cameraOffset);
        
        // Smoothly update camera position
        camera.position.lerp(cameraPos, 0.08);
        camera.lookAt(planetWorldPos);
        
        // Update controls target
        if (controlsRef.current) {
          controlsRef.current.target.lerp(planetWorldPos, 0.08);
          controlsRef.current.update();
        }
      }
    }
  });

  const animateToDefault = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(0, 25, 30);
    const startTarget = controlsRef.current ? controlsRef.current.target.clone() : new THREE.Vector3();
    const endTarget = new THREE.Vector3(0, -4, 0);
    
    let progress = 0;
    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      
      camera.position.lerpVectors(startPos, endPos, eased);
      
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(startTarget, endTarget, eased);
        controlsRef.current.update();
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    
    animate();
  };

  const animateToPlanet = (planetName) => {
    const planet = planets.find(p => p.name === planetName);
    const planetRef = planetRefs.current[planetName];
    if (!planet || !planetRef || isAnimating) return;
    
    setIsAnimating(true);
    const startPos = camera.position.clone();
    const startTarget = controlsRef.current ? controlsRef.current.target.clone() : new THREE.Vector3();
    
    let progress = 0;
    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);
      
      // Get current planet position during animation
      const planetWorldPos = new THREE.Vector3();
      planetRef.getWorldPosition(planetWorldPos);
      
      const cameraDistance = Math.max(planet.size * 15, 3);
      const cameraOffset = new THREE.Vector3(cameraDistance, cameraDistance * 0.8, cameraDistance);
      const endPos = planetWorldPos.clone().add(cameraOffset);
      const endTarget = planetWorldPos.clone();
      
      // Smooth easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      
      camera.position.lerpVectors(startPos, endPos, eased);
      
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(startTarget, endTarget, eased);
        controlsRef.current.update();
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    
    animate();
  };

  useEffect(() => {
    if (followingPlanet) {
      animateToPlanet(followingPlanet);
    } else if (!isAnimating) {
      animateToDefault();
    }
  }, [followingPlanet]);

  return (
    <OrbitControls 
      ref={controlsRef}
      target={[0, -4, 0]}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      autoRotate={false}
      minDistance={1}
      maxDistance={50}
      dampingFactor={0.05}
      enableDamping={true}
      enabled={!followingPlanet || isAnimating}
    />
  );
}

// Planet component using realistic planet generator
function Planet({ position, size, orbitRadius, orbitSpeed, rotationSpeed, startAngle, planetProps, planetRef, planetName, isSelected, hovered, followingPlanet }) {
  const orbitRef = useRef();
  const labelOrbitRef = useRef();
  const actualPlanetRef = useRef();
  const labelRef = useRef();
  
  // Create the realistic planet component
  const RealisticPlanet = createRealisticPlanet({
    size,
    rotationSpeed,
    ...planetProps
  });

  // Set initial rotation based on startAngle
  useEffect(() => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y = startAngle;
    }
    if (labelOrbitRef.current) {
      labelOrbitRef.current.rotation.y = startAngle;
    }
  }, [startAngle]);

  // Update the parent ref when actualPlanetRef changes
  useEffect(() => {
    if (actualPlanetRef.current && planetRef) {
      planetRef(actualPlanetRef.current);
    }
  }, [planetRef]);

  useFrame((state) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y += orbitSpeed;
    }
    // Always keep label orbit in sync with planet orbit, even when labels are hidden
    if (labelOrbitRef.current) {
      labelOrbitRef.current.rotation.y = orbitRef.current.rotation.y;
    }
  });

  // Calculate label orbit offset - shift to the right
  const labelOrbitOffset = 5; // 5 units of orbit radius to the right

  // Set CSS custom property for label border color
  useEffect(() => {
    const appearance = getRingAppearance(isSelected, hovered, planetName, followingPlanet);
    document.documentElement.style.setProperty(`--label-border-color-${planetName}`, appearance.labelBorderColor);
  }, [isSelected, hovered, planetName, followingPlanet]);

  // Determine if labels should be visible (hide when following any planet)
  const showLabels = !followingPlanet;

  return (
    <group>
      {/* Planet orbit */}
      <group ref={orbitRef}>
        <group position={[orbitRadius, 0, 0]}>
          <RealisticPlanet ref={actualPlanetRef} />
        </group>
      </group>
      
      {/* Label orbit - always render but conditionally show content to maintain sync */}
      <group ref={labelOrbitRef} position={[labelOrbitOffset, 0, 0]}>
        <group position={[orbitRadius, 0, 0]}>
          {showLabels && (
            <PlanetLabel 
              ref={labelRef}
              planetRef={actualPlanetRef} 
              planetName={planetName}
              planetSize={size}
            />
          )}
        </group>
      </group>
    </group>
  );
}

// Orbit ring component
function OrbitRing({ radius, planetName, onPlanetSelect, isSelected, followingPlanet }) {
  const ringRef = useRef();
  const collisionRef = useRef();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (ringRef.current) {
      const geometry = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 64);
      const appearance = getRingAppearance(isSelected, hovered, planetName, followingPlanet);
      const material = new THREE.MeshBasicMaterial({
        color: appearance.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: appearance.opacity
      });
      ringRef.current.geometry = geometry;
      ringRef.current.material = material;
      ringRef.current.rotation.x = Math.PI / 2;
    }

    // Create invisible collision ring that's much thicker for easier selection
    if (collisionRef.current) {
      const collisionGeometry = new THREE.RingGeometry(radius - 0.6, radius + 0.6, 64);
      const collisionMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      collisionRef.current.geometry = collisionGeometry;
      collisionRef.current.material = collisionMaterial;
      collisionRef.current.rotation.x = Math.PI / 2;
      collisionRef.current.position.y = 0.01;
    }
  }, [radius, hovered, isSelected, followingPlanet]);

  const handleClick = (e) => {
    e.stopPropagation();
    onPlanetSelect(isSelected ? null : planetName);
  };

  // Allow hover for all rings when following a planet (to show jump targets)
  const handlePointerEnter = () => {
    setHovered(true);
  };

  const handlePointerLeave = () => {
    setHovered(false);
  };

  return (
    <group>
      {/* Visible ring */}
      <mesh ref={ringRef} />
      
      {/* Invisible collision detection ring */}
      <mesh 
        ref={collisionRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      />
    </group>
  );
}

// Sun component using realistic planet generator
function Sun() {
  const meshRef = useRef();
  
  const RealisticSun = createRealisticPlanet({
    size: 1,
    rotationSpeed: 0.0005,
    surfaceRoughness: 0.1,
    metalness: 0.0,
    emissive: '#FF6600',
    emissiveIntensity: 0.8,
    surfaceColor: '#FFA500'
  });

  return (
    <group ref={meshRef}>
      <RealisticSun />
      <pointLight intensity={2} color="#FFA500" />
    </group>
  );
}

// Planets component
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

// Main component
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
