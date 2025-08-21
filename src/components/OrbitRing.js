import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { getRingAppearance } from '../utils/planetAppearance';
import { useThree } from '@react-three/fiber';

// Global state to track currently hovered ring
let globalHoveredRing = null;
let hoverCandidates = new Set();

function OrbitRing({ radius, planetName, onPlanetSelect, isSelected, followingPlanet, disableHighlight = false }) {
  const ringRef = useRef();
  const collisionRef = useRef();
  const [hovered, setHovered] = useState(false);
  const { raycaster, camera, pointer } = useThree();

  useEffect(() => {
    if (ringRef.current) {
      const geometry = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 64);
      // If highlight is disabled, force hovered to false for appearance
      const appearance = getRingAppearance(isSelected, disableHighlight ? false : hovered, planetName, followingPlanet);
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
  }, [radius, hovered, isSelected, followingPlanet, disableHighlight]);

  // --- Reset hover state on solar system change or planetName change ---
  useEffect(() => {
    // If the current hovered ring or any hover candidate is not in the new system, clear them
    if (globalHoveredRing && globalHoveredRing.planetName !== planetName) {
      globalHoveredRing.setHovered(false);
      globalHoveredRing = null;
    }
    // Remove all hover candidates not matching this planet
    hoverCandidates.forEach(candidate => {
      if (candidate.planetName !== planetName) {
        candidate.setHovered(false);
        hoverCandidates.delete(candidate);
      }
    });
    // Also, if highlight is disabled, clear hovered state
    if (disableHighlight && hovered) {
      setHovered(false);
    }
  }, [planetName, disableHighlight]);
  // ---------------------------------------------------------------------

  const calculateDistanceToRing = () => {
    if (!collisionRef.current) return Infinity;
    
    // Get world position of ring center
    const ringCenter = new THREE.Vector3();
    collisionRef.current.getWorldPosition(ringCenter);
    
    // Project to screen coordinates
    const screenPos = ringCenter.clone().project(camera);
    
    // Calculate distance from mouse pointer to ring center in screen space
    const distance = Math.sqrt(
      Math.pow(pointer.x - screenPos.x, 2) + 
      Math.pow(pointer.y - screenPos.y, 2)
    );
    
    return distance;
  };

  const updateHoverState = () => {
    if (hoverCandidates.size === 0) {
      globalHoveredRing = null;
      return;
    }

    // Find the closest ring among candidates
    let closestRing = null;
    let closestDistance = Infinity;

    hoverCandidates.forEach(candidate => {
      const distance = candidate.calculateDistanceToRing();
      if (distance < closestDistance) {
        closestDistance = distance;
        closestRing = candidate;
      }
    });

    // Update global hovered ring
    if (closestRing && closestRing !== globalHoveredRing) {
      // Unhover previous ring
      if (globalHoveredRing) {
        globalHoveredRing.setHovered(false);
      }
      // Hover new closest ring
      globalHoveredRing = closestRing;
      closestRing.setHovered(true);
    }
  };

  const handleClick = (e) => {
    if (disableHighlight) return;
    e.stopPropagation();
    onPlanetSelect(isSelected ? null : planetName);
  };

  const handlePointerEnter = () => {
    if (disableHighlight) return;
    // Add this ring to hover candidates
    const ringCandidate = {
      planetName,
      calculateDistanceToRing,
      setHovered
    };
    hoverCandidates.add(ringCandidate);
    updateHoverState();
  };

  const handlePointerLeave = () => {
    if (disableHighlight) return;
    // Remove this ring from hover candidates
    const candidateToRemove = Array.from(hoverCandidates).find(c => c.planetName === planetName);
    if (candidateToRemove) {
      hoverCandidates.delete(candidateToRemove);
      
      // If this was the hovered ring, clear it
      if (globalHoveredRing && globalHoveredRing.planetName === planetName) {
        setHovered(false);
        globalHoveredRing = null;
        // Update hover state to potentially select a new closest ring
        updateHoverState();
      }
    }
  };

  // If highlight is disabled, forcibly set hovered to false
  useEffect(() => {
    if (disableHighlight && hovered) {
      setHovered(false);
    }
  }, [disableHighlight, hovered]);

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
