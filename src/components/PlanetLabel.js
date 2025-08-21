import React, { useRef, useMemo, forwardRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const PlanetLabel = forwardRef(({ planetRef, planetName, planetSize, isSun = false, sunData = null, onHover, labelWorldOffset = null }, ref) => {
  const labelRef = useRef();
  const htmlRef = useRef();
  const { camera, size, gl } = useThree();
  const [connectionLine, setConnectionLine] = useState(null);

  // Expose the label ref to parent
  React.useImperativeHandle(ref, () => labelRef.current);

  useFrame(() => {
    if (!labelRef.current) return;

    // For sun, use explicit labelWorldOffset if provided
    let labelPos;
    if (isSun && labelWorldOffset) {
      labelPos = new THREE.Vector3(...labelWorldOffset);
    } else {
      // Since we're in our own orbit, position label at origin with slight offset
      labelPos = new THREE.Vector3(0, 0, 0);
    }

    // Update label position
    labelRef.current.position.copy(labelPos);

    // Get screen coordinates for both label and planet/sun
    if (labelRef.current && planetRef?.current && htmlRef.current) {
      // Get world position of the label
      const labelWorldPosition = new THREE.Vector3();
      labelRef.current.getWorldPosition(labelWorldPosition);

      // Get world position of the planet/sun
      const planetWorldPosition = new THREE.Vector3();
      planetRef.current.getWorldPosition(planetWorldPosition);

      // For sun, adjust the connection line to connect to the right edge
      let connectPlanetWorldPos;
      if (isSun && labelWorldOffset) {
        // Move from sun center to its right edge (positive X)
        connectPlanetWorldPos = planetWorldPosition.clone().add(new THREE.Vector3(planetSize, 0, 0));
      } else {
        // For planets, always connect to the right edge (positive X)
        connectPlanetWorldPos = planetWorldPosition.clone().add(new THREE.Vector3(planetSize, 0, 0));
      }

      // Project 3D world positions to 2D screen coordinates
      const labelScreenPosition = labelWorldPosition.clone().project(camera);
      const planetScreenPosition = connectPlanetWorldPos.clone().project(camera);

      // Convert normalized device coordinates to screen pixels
      const labelScreenX = (labelScreenPosition.x * 0.5 + 0.5) * size.width;
      const labelScreenY = (labelScreenPosition.y * -0.5 + 0.5) * size.height;

      const planetScreenX = (planetScreenPosition.x * 0.5 + 0.5) * size.width;
      const planetScreenY = (planetScreenPosition.y * -0.5 + 0.5) * size.height;

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

      if (isSun && labelWorldOffset) {
        // For sun, always connect from right edge of sun to left edge of label
        planetEdgeX = planetScreenX;
        labelEdgeX = labelScreenX - (labelWidth / 2) - borderWidth * labelWidth;
      } else {
        // For planets, always connect from right edge of planet to left edge of label
        planetEdgeX = planetScreenX;
        labelEdgeX = labelScreenX - (labelWidth / 2) - borderWidth * labelWidth;
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

    // For sun, use reduced opacity instead of 0, for planets use CSS variable
    const lineOpacity = isSun ? '0.4' : '0.8';
    const lineColor = isSun ? '#00ff88' : `var(--line-color-${planetName}, rgba(100, 255, 218, 1))`;

    // Update the line element styles
    Object.assign(lineElement.style, {
      position: 'fixed',
      left: `${connectionLine.planetX}px`,
      top: `${connectionLine.planetY}px`,
      width: `${connectionLine.distance}px`,
      height: '2px',
      transformOrigin: '0 50%',
      transform: `rotate(${connectionLine.angle}deg)`,
      backgroundColor: lineColor,
      opacity: lineOpacity,
      zIndex: '999',
      pointerEvents: 'none',
      boxShadow: `0 0 10px ${lineColor}`,
    });

    // Cleanup function
    return () => {
      const existingLine = document.getElementById(`connection-line-${planetName}`);
      if (existingLine) {
        existingLine.remove();
      }
    };
  }, [connectionLine, planetName, isSun]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const existingLine = document.getElementById(`connection-line-${planetName}`);
      if (existingLine) {
        existingLine.remove();
      }
    };
  }, [planetName]);

  // For sun, determine content based on sunData
  const labelContent = isSun && sunData ? (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      <div style={{
        color: '#00ff88',
        fontFamily: "'Courier New', monospace",
        fontSize: '2rem', // larger for sun
        fontWeight: 'bold',
        margin: '0 0 0.2rem 0',
        textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
        whiteSpace: 'nowrap'
      }}>
        {sunData.systemName}
      </div>
      <div style={{
        color: '#88ffaa',
        fontFamily: "'Courier New', monospace",
        fontSize: '1.8rem', // larger for sun
        margin: '0',
        opacity: '0.8',
        whiteSpace: 'nowrap'
      }}>
        {sunData.subtitle}
      </div>
    </div>
  ) : (
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
  );

  // Determine label styles based on isSun
  const labelOpacity = isSun ? 'rgba(0, 20, 40, 0.95)' : 'var(--label-bg-color-' + planetName + ', rgba(26, 26, 46, 0.9))';
  const borderColor = isSun ? '#00ff88' : 'var(--label-inner-border-color-' + planetName + ', #64ffda)';
  const shadowColor = isSun ? 'rgba(0, 255, 136, 0.3)' : 'var(--label-border-shadow-color-' + planetName + ', #64ffda)';

  // Add mouse enter/leave handlers for label hover
  const handlePointerEnter = () => {
    if (onHover) onHover(true);
  };
  const handlePointerLeave = () => {
    if (onHover) onHover(false);
  };

  return (
    <group ref={labelRef}>
      <Html
        ref={htmlRef}
        center
        distanceFactor={10}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          animation: 'none'
        }}
        // Add pointer events for hover detection
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <div className="rpg-textbox" style={{ 
          position: 'relative',
          width: 'auto',
          minWidth: isSun ? '260px' : '200px', // wider for sun
          animation: 'none'
        }}>
          <div className="textbox-content" style={{
            background: labelOpacity,
            border: `3px solid ${borderColor}`,
            borderRadius: '12px',
            padding: isSun ? '1.2rem 1.5rem' : '0.75rem 1rem', // more padding for sun
            minHeight: 'auto',
            width: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: `0 0 20px ${shadowColor}`,
            position: 'relative',
            margin: '0',
            boxSizing: 'border-box',
            transform: 'scale(1.5)',
            opacity: '1',
            animation: 'none',
            transition: 'none'
          }}>
            {!isSun && (
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
            )}
            {labelContent}
          </div>
        </div>
      </Html>
    </group>
  );
});

export default PlanetLabel;
