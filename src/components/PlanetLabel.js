import React, { useRef, useMemo, forwardRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const PlanetLabel = forwardRef(({ planetRef, planetName, planetSize }, ref) => {
  const labelRef = useRef();
  const htmlRef = useRef();
  const { camera, size, gl } = useThree();
  const [connectionLine, setConnectionLine] = useState(null);

  // Expose the label ref to parent
  React.useImperativeHandle(ref, () => labelRef.current);

  useFrame(() => {
    if (!labelRef.current) return;

    // Since we're in our own orbit, position label at origin with slight offset
    const labelPos = new THREE.Vector3(0, 0, 0);
    
    // Update label position
    labelRef.current.position.copy(labelPos);

    // Get screen coordinates for both label and planet
    if (labelRef.current && planetRef?.current && htmlRef.current) {
      // Get world position of the label
      const labelWorldPosition = new THREE.Vector3();
      labelRef.current.getWorldPosition(labelWorldPosition);
      
      // Get world position of the planet
      const planetWorldPosition = new THREE.Vector3();
      planetRef.current.getWorldPosition(planetWorldPosition);
      
      // Project 3D world positions to 2D screen coordinates
      const labelScreenPosition = labelWorldPosition.clone().project(camera);
      const planetScreenPosition = planetWorldPosition.clone().project(camera);
      
      // Convert normalized device coordinates to screen pixels
      const labelScreenX = (labelScreenPosition.x * 0.5 + 0.5) * size.width;
      const labelScreenY = (labelScreenPosition.y * -0.5 + 0.5) * size.height;
      
      const planetScreenX = (planetScreenPosition.x * 0.5 + 0.5) * size.width;
      const planetScreenY = (planetScreenPosition.y * -0.5 + 0.5) * size.height;
      
      // Calculate planet radius in screen pixels
      const planetRadius3D = planetSize;
      const planetEdgePosition = planetWorldPosition.clone();
      planetEdgePosition.x += planetRadius3D;
      const planetEdgeScreenPosition = planetEdgePosition.project(camera);
      const planetEdgeScreenX = (planetEdgeScreenPosition.x * 0.5 + 0.5) * size.width;
      const planetRadiusScreen = Math.abs(planetEdgeScreenX - planetScreenX);
      
      // Get actual label dimensions from DOM element
      const labelElement = htmlRef.current?.querySelector('.rpg-textbox');
      let labelWidth = 200; // fallback
      let labelHeight = 60; // fallback
      
      if (labelElement) {
        const rect = labelElement.getBoundingClientRect();
        labelWidth = rect.width;
        labelHeight = rect.height;
      }
      
      // Calculate edge positions with border consideration
      let planetEdgeX, planetEdgeY, labelEdgeX, labelEdgeY;
      
      // Add border width to get to the actual visual edge
      const borderWidth = 0.25; // border from CSS
      
      // Determine which edge to use based on relative positions
      if (labelScreenX > planetScreenX) {
        // Label is to the right of planet
        planetEdgeX = planetScreenX + planetRadiusScreen;
        // For labels to the right, connect to the actual left edge (including border)
        labelEdgeX = labelScreenX - (labelWidth / 2) - borderWidth * labelElement.getBoundingClientRect().width;
      } else {
        // Label is to the left of planet
        planetEdgeX = planetScreenX - planetRadiusScreen;
        // For labels to the left, connect to the actual right edge (including border)
        labelEdgeX = labelScreenX + (labelWidth / 2) + borderWidth * labelElement.getBoundingClientRect().width;
      }
      
      // Use center Y positions for both
      planetEdgeY = planetScreenY;
      labelEdgeY = labelScreenY;
      
      // Calculate distance and angle for the connection line from edges
      const deltaX = labelEdgeX - planetEdgeX;
      const deltaY = labelEdgeY - planetEdgeY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      
      // Update connection line data using edge positions
      setConnectionLine({
        planetX: planetEdgeX,
        planetY: planetEdgeY,
        labelX: labelEdgeX,
        labelY: labelEdgeY,
        distance: distance,
        angle: angle
      });
    }
  });

  // Create a portal for the connection line that renders outside the HTML component
  useEffect(() => {
    if (!connectionLine) return;

    // Find or create the connection line element
    let lineElement = document.getElementById(`connection-line-${planetName}`);
    
    if (!lineElement) {
      lineElement = document.createElement('div');
      lineElement.id = `connection-line-${planetName}`;
      lineElement.className = 'planet-connection-line-global';
      document.body.appendChild(lineElement);
    }

    // Update the line element styles
    Object.assign(lineElement.style, {
      position: 'fixed',
      left: `${connectionLine.planetX}px`,
      top: `${connectionLine.planetY}px`,
      width: `${connectionLine.distance}px`,
      height: '2px',
      transformOrigin: '0 50%',
      transform: `rotate(${connectionLine.angle}deg)`,
      backgroundColor: `var(--line-color-${planetName}, rgba(100, 255, 218, 1))`,
      opacity: '0.8',
      zIndex: '999',
      pointerEvents: 'none',
      boxShadow: `0 0 10px var(--line-color-${planetName}, rgba(100, 255, 218, 1))`,
    });

    // Cleanup function
    return () => {
      const existingLine = document.getElementById(`connection-line-${planetName}`);
      if (existingLine) {
        existingLine.remove();
      }
    };
  }, [connectionLine, planetName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const existingLine = document.getElementById(`connection-line-${planetName}`);
      if (existingLine) {
        existingLine.remove();
      }
    };
  }, [planetName]);

  return (
    <group ref={labelRef}>
      <Html
        ref={htmlRef}
        center
        distanceFactor={10}
        style={{
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        <div className="rpg-textbox" style={{ 
          position: 'relative',
          width: 'auto',
          minWidth: '200px'
        }}>
          <div className="textbox-content" style={{
            background: `var(--label-bg-color-${planetName}, rgba(26, 26, 46, 0.9))`,
            border: `3px solid var(--label-inner-border-color-${planetName}, #64ffda)`,
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            minHeight: 'auto',
            width: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: `0 0 20px var(--label-border-shadow-color-${planetName}, #64ffda)`,
            position: 'relative',
            margin: '0',
            boxSizing: 'border-box',
            transform: 'scale(1.5)'
          }}>
            <div style={{
              content: '',
              position: 'absolute',
              top: '8px',
              left: '8px',
              right: '8px',
              bottom: '8px',
              border: `1px solid var(--label-inner-border-color-${planetName}, rgba(100, 255, 218, 0.3))`,
              borderRadius: '8px',
              pointerEvents: 'none'
            }} />
            <p className="greeting-text" style={{
              color: 'var(--label-font-color-' + planetName + ', #ffffff)',
              fontFamily: "'Courier New', monospace",
              fontSize: '2rem',
              lineHeight: '1.4',
              margin: '0',
              textShadow: `0 0 10px var(--label-border-color-${planetName}, #64ffda)80`,
              height: 'auto',
              textAlign: 'center',
              overflow: 'visible',
              wordWrap: 'break-word',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}>
              {planetName}
            </p>
          </div>
        </div>
      </Html>
    </group>
  );
});

export default PlanetLabel;
