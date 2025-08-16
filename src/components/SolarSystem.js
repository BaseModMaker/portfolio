import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { createRealisticPlanet } from './PlanetGenerator';
import planetsData from '../data/planetsData.json';

// Planet component using realistic planet generator
function Planet({ position, size, orbitRadius, orbitSpeed, rotationSpeed, startAngle, planetProps }) {
  const orbitRef = useRef();
  
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
  }, [startAngle]);

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
function OrbitRing({ radius, planetName }) {
  const ringRef = useRef();
  const collisionRef = useRef();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (ringRef.current) {
      const geometry = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 64);
      const material = new THREE.MeshBasicMaterial({
        color: hovered ? '#ffffff' : '#64ffda',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: hovered ? 0.8 : 0.3
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
      // Offset the collision ring slightly above the visible ring to prevent Z-fighting
      collisionRef.current.position.y = 0.01;
    }
  }, [radius, hovered]);

  return (
    <group>
      {/* Visible ring */}
      <mesh ref={ringRef} />
      
      {/* Invisible collision detection ring */}
      <mesh 
        ref={collisionRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
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
function Planets() {
  const orbitConstant = 0.1;
  const planets = planetsData.planets.map(planet => ({
    ...planet,
    orbitSpeed: planet.orbitSpeed * orbitConstant,
    rotationSpeed: planet.rotationSpeed * orbitConstant
  }));

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
          autoRotate={false}
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
