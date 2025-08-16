import React, { useRef, useMemo, forwardRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const PlanetLabel = forwardRef(({ planetRef, planetName, planetSize }, ref) => {
  const labelRef = useRef();
  const { camera } = useThree();

  // Expose the label ref to parent
  React.useImperativeHandle(ref, () => labelRef.current);

  useFrame(() => {
    if (!labelRef.current) return;

    // Since we're in our own orbit, position label at origin with slight offset
    const labelPos = new THREE.Vector3(0, 0, 0);
    
    // Update label position
    labelRef.current.position.copy(labelPos);
  });

  return (
    <group ref={labelRef}>
      <Html
        center
        distanceFactor={10}
        style={{
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        {/* Connection line as HTML element */}
        <div 
          className="planet-connection-line"
          style={{
            position: 'absolute',
            left: `var(--label-left-alignment-${planetName}, -300px)`,
            top: '50%',
            width: 'auto',
            right: '250px',
            height: '2px',
            backgroundColor: `var(--line-color-${planetName}, #64ffda)`,
            transform: 'translateY(-50%)',
            opacity: 0.8,
            zIndex: -1
          }}
        />
        
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
            boxShadow: `0 0 20px var(--label-border-color-${planetName}, #64ffda)33, inset 0 2px 0 rgba(255, 0, 0, 0.1)`,
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
