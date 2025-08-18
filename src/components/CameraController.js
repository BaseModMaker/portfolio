import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function CameraController({ followingPlanet, planets, planetRefs }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const [isAnimating, setIsAnimating] = useState(false);
  const lastLogTime = useRef(0);
  const wasPointingAtSun = useRef(false);
  const wasInDefaultPosition = useRef(false);

  // Default camera position for comparison
  const defaultPosition = new THREE.Vector3(0, 25, 30);
  const defaultTarget = new THREE.Vector3(0, -4, 0);
  const sunTarget = new THREE.Vector3(0, -4, 0); // Sun position
  const positionTolerance = 0.5; // Tolerance for position comparison

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

export default CameraController;
