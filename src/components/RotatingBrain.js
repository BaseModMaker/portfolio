import React, { useRef, Suspense, useEffect, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { TextureLoader } from 'three';
import GreetingSequence from './GreetingSequence';

// Brain model component
function BrainModel() {
  const meshRef = useRef();
  
  // Load materials from MTL
  const materials = useLoader(MTLLoader, '/portfolio/brain/Brain.mtl', (loader) => {
    loader.setResourcePath('/portfolio/brain/');
  });
  
  // Load textures manually (try common texture file names)
  const textures = useLoader(TextureLoader, [
    '/portfolio/brain/Brain_Textures/BrainDiff03.png',
    '/portfolio/brain/Brain_Textures/BrainNormals.png',
    '/portfolio/brain/Brain_Textures/BrainSpec.png'
  ].filter(Boolean));
  
  // Load object
  const obj = useLoader(OBJLoader, '/portfolio/brain/Brain.obj');

  useEffect(() => {
    if (obj && materials && textures) {
      materials.preload();
      
      obj.traverse((child) => {
        if (child.isMesh) {
          // Apply material from MTL
          const materialName = child.material?.name;
          if (materialName && materials.materials[materialName]) {
            const material = materials.materials[materialName];
            
            // Manually apply textures to fix incorrect paths
            if (textures[0]) material.map = textures[0]; // Diffuse
            if (textures[1]) material.normalMap = textures[1]; // Normal
            if (textures[2]) material.specularMap = textures[2]; // Specular
            
            material.needsUpdate = true;
            child.material = material;
          }
        }
      });
    }
  }, [obj, materials, textures]);

  return (
    <primitive 
      ref={meshRef}
      object={obj}
      scale={1}
      position={[0, 0, 0]}
    />
  );
}

// Main component with canvas and controls
function RotatingBrain() {
  const [showBrain, setShowBrain] = useState(false);
  const [greetingComplete, setGreetingComplete] = useState(false);
  const [brainOpacity, setBrainOpacity] = useState(0);

  const handleGreetingComplete = () => {
    setGreetingComplete(true);
    setTimeout(() => {
      setShowBrain(true);
      setTimeout(() => {
        setBrainOpacity(1);
      }, 100);
    }, 200);
  };

  return (
    <>
      {!greetingComplete && (
        <GreetingSequence onComplete={handleGreetingComplete} />
      )}
      
      {showBrain && (
        <div style={{ 
          width: '100%', 
          height: '500px',
          opacity: brainOpacity,
          transition: 'opacity 1.5s ease-in'
        }}>
          <Canvas 
            camera={{ position: [0, 0, 8], fov: 60 }}
          >
            {/* Ambient light for general illumination */}
            <ambientLight intensity={0.6} />
            
            {/* Directional light for shadows and depth */}
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            
            {/* Point lights for better brain illumination */}
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#64ffda" />
            <pointLight position={[10, 10, 10]} intensity={0.5} color="#ff6b9d" />
            
            {/* The rotating brain */}
            <Suspense fallback={null}>
              <BrainModel />
            </Suspense>
            
            {/* OrbitControls for mouse interaction */}
            <OrbitControls 
              target={[0, 1, 0]}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              autoRotate={true}
              minDistance={3}
              maxDistance={20}
              dampingFactor={0.05}
              enableDamping={true}
            />
          </Canvas>
        </div>
      )}
    </>
  );
}

export default RotatingBrain;
