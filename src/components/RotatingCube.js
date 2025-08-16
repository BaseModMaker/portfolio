import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Cube component that rotates automatically
function Cube() {
  const meshRef = useRef();

  // Rotate the cube on each frame
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color={'#ff6b6b'} />
    </mesh>
  );
}

// Main component with canvas and controls
function RotatingCube() {
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Canvas camera={{ position: [0, 0, 6] }}>
        {/* Ambient light for general illumination */}
        <ambientLight intensity={0.5} />
        
        {/* Directional light for shadows and depth */}
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* The rotating cube */}
        <Cube />
        
        {/* OrbitControls for mouse interaction */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}

export default RotatingCube;
