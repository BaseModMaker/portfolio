import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { createRealisticPlanet, planetConfigs } from './PlanetGenerator';

// Planet component using realistic planet generator
function Planet({ position, size, color, orbitRadius, orbitSpeed, rotationSpeed, planetType }) {
  const orbitRef = useRef();
  
  // Create the realistic planet component
  const RealisticPlanet = createRealisticPlanet({
    size,
    color,
    rotationSpeed,
    ...planetConfigs[planetType]
  });

  useFrame((state) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y += orbitSpeed;
    }
  });

  return (
    <group ref={orbitRef}>
      <RealisticPlanet position={[orbitRadius, 0, 0]} />
    </group>
  );
}

// Orbit ring component
function OrbitRing({ radius }) {
  const ringRef = useRef();

  useEffect(() => {
    if (ringRef.current) {
      const geometry = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 64);
      const material = new THREE.MeshBasicMaterial({
        color: '#64ffda',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      });
      ringRef.current.geometry = geometry;
      ringRef.current.material = material;
      ringRef.current.rotation.x = Math.PI / 2;
    }
  }, [radius]);

  return <mesh ref={ringRef} />;
}

// Sun component using realistic planet generator
function Sun() {
  const meshRef = useRef();
  
  const RealisticSun = createRealisticPlanet({
    size: 1,
    color: '#FFA500',
    rotationSpeed: 0.01,
    ...planetConfigs.sun
  });

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={meshRef}>
      <RealisticSun />
      <pointLight intensity={2} color="#FFA500" />
    </group>
  );
}

// Planets component
function Planets() {
  const orbitConstant = 0.1;
  const planets = [
    { name: 'Mercury', orbitRadius: 2, size: 0.1, color: '#8C7853', orbitSpeed: 0.04 * orbitConstant, rotationSpeed: 0.02 * orbitConstant, type: 'mercury' },
    { name: 'Venus', orbitRadius: 3, size: 0.15, color: '#FFC649', orbitSpeed: 0.03 * orbitConstant, rotationSpeed: 0.015 * orbitConstant, type: 'venus' },
    { name: 'Earth', orbitRadius: 4, size: 0.16, color: '#6B93D6', orbitSpeed: 0.02 * orbitConstant, rotationSpeed: 0.01 * orbitConstant, type: 'earth' },
    { name: 'Mars', orbitRadius: 5.5, size: 0.12, color: '#CD5C5C', orbitSpeed: 0.015 * orbitConstant, rotationSpeed: 0.008 * orbitConstant, type: 'mars' },
    { name: 'Jupiter', orbitRadius: 8, size: 0.5, color: '#D8CA9D', orbitSpeed: 0.01 * orbitConstant, rotationSpeed: 0.012 * orbitConstant, type: 'jupiter' },
    { name: 'Saturn', orbitRadius: 11, size: 0.4, color: '#FAD5A5', orbitSpeed: 0.008 * orbitConstant, rotationSpeed: 0.01 * orbitConstant, type: 'saturn' },
    { name: 'Uranus', orbitRadius: 14, size: 0.25, color: '#4FD0E7', orbitSpeed: 0.006 * orbitConstant, rotationSpeed: 0.007 * orbitConstant, type: 'uranus' },
    { name: 'Neptune', orbitRadius: 16, size: 0.24, color: '#4B70DD', orbitSpeed: 0.005 * orbitConstant, rotationSpeed: 0.006 * orbitConstant, type: 'neptune' }
  ];

  return (
    <>
      {/* Sun */}
      <Sun />
      
      {/* Orbit rings */}
      {planets.map((planet, index) => (
        <OrbitRing key={`ring-${index}`} radius={planet.orbitRadius} />
      ))}
      
      {/* Planets */}
      {planets.map((planet, index) => (
        <Planet
          key={index}
          orbitRadius={planet.orbitRadius}
          size={planet.size}
          color={planet.color}
          orbitSpeed={planet.orbitSpeed}
          rotationSpeed={planet.rotationSpeed}
          planetType={planet.type}
        />
      ))}
    </>
  );
}

// Main component
function SolarSystem({ isVisible = true }) {
  const [systemOpacity, setSystemOpacity] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        setSystemOpacity(1);
      }, 100);
    }
  }, [isVisible]);

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
      // FOV: zoom level (smaller more zoomed in)
      // Position: camera position in 3D space
        camera={{ position: [0, 25, 30], fov: 40 }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        
        <Planets />
        
        <OrbitControls 
        // Sun's position on screen
          target={[0, -4, 0]}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={true}
          autoRotateSpeed={0.5}
          minDistance={5}
          maxDistance={40}
          dampingFactor={0.05}
          enableDamping={true}
        />
      </Canvas>
    </div>
  );
}

export default SolarSystem;
