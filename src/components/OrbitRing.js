import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { getRingAppearance } from '../utils/planetAppearance';

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

export default OrbitRing;
