import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { createRealisticPlanet } from './PlanetGenerator';
import PlanetLabel from './PlanetLabel';
import { getRingAppearance } from '../utils/planetAppearance';

function Planet({ position, size, orbitRadius, orbitSpeed, rotationSpeed, startAngle, planetProps, planetRef, planetName, isSelected, hovered, followingPlanet, showLabel = true, onLabelHover }) {
  const orbitRef = useRef();
  const labelOrbitRef = useRef();
  const actualPlanetRef = useRef();
  const labelRef = useRef();
  const [labelHovered, setLabelHovered] = useState(false);

  // Memoize the component class so it's not recreated on every render
  const RealisticPlanet = useMemo(() => createRealisticPlanet({
    size,
    rotationSpeed,
    ...planetProps
  }), [size, rotationSpeed, planetProps]);

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

  // Notify parent when label hover changes
  useEffect(() => {
    if (onLabelHover) {
      if (labelHovered) {
        onLabelHover(planetName);
      } else {
        onLabelHover(null);
      }
    }
  }, [labelHovered, planetName, onLabelHover]);

  useFrame((state) => {
    // Always animate
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
          {showLabel && (
            <PlanetLabel 
              ref={labelRef}
              planetRef={actualPlanetRef} 
              planetName={planetName}
              planetSize={size}
              onHover={setLabelHovered}
            />
          )}
        </group>
      </group>
    </group>
  );
}

export default Planet;
