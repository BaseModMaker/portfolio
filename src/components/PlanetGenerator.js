import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Function to create a realistic planet
export function createRealisticPlanet({
  size,
  color,
  surfaceColor = color,
  atmosphereColor = null,
  hasAtmosphere = false,
  hasRings = false,
  ringColor = '#CCCCCC',
  rotationSpeed = 0.01,
  surfaceRoughness = 0.8,
  metalness = 0.1,
  emissive = '#000000',
  emissiveIntensity = 0
}) {
  const RealisticPlanet = React.forwardRef((props, ref) => {
    const meshRef = useRef();
    const atmosphereRef = useRef();
    const ringsRef = useRef();

    // Create procedural surface texture
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const surfaceTexture = useMemo(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      
      // Create gradient for base color
      const gradient = context.createLinearGradient(0, 0, 0, 256);
      const baseColor = new THREE.Color(surfaceColor);
      const darkerColor = baseColor.clone().multiplyScalar(0.6);
      const lighterColor = baseColor.clone().multiplyScalar(1.2);
      
      gradient.addColorStop(0, lighterColor.getStyle());
      gradient.addColorStop(0.5, baseColor.getStyle());
      gradient.addColorStop(1, darkerColor.getStyle());
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, 512, 256);
      
      // Add some noise for surface detail
      const imageData = context.getImageData(0, 0, 512, 256);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 50;
        data[i] += noise;     // Red
        data[i + 1] += noise; // Green
        data[i + 2] += noise; // Blue
      }
      
      context.putImageData(imageData, 0, 0);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    }, []);

    // Create normal map for surface detail
    const normalTexture = useMemo(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      
      // Create noise pattern for normal map
      const imageData = context.createImageData(512, 256);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255;
        data[i] = noise;     // Red (X normal)
        data[i + 1] = noise; // Green (Y normal)
        data[i + 2] = 128;   // Blue (Z normal - pointing out)
        data[i + 3] = 255;   // Alpha
      }
      
      context.putImageData(imageData, 0, 0);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    }, []);

    useFrame((state) => {
      if (meshRef.current) {
        meshRef.current.rotation.y += rotationSpeed;
      }
      if (atmosphereRef.current) {
        atmosphereRef.current.rotation.y += rotationSpeed * 0.5;
      }
    });

    return (
      <group ref={ref} {...props}>
        {/* Main planet */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[size, 64, 32]} />
          <meshStandardMaterial
            map={surfaceTexture}
            normalMap={normalTexture}
            color={color}
            roughness={surfaceRoughness}
            metalness={metalness}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>

        {/* Atmosphere */}
        {hasAtmosphere && (
          <mesh ref={atmosphereRef}>
            <sphereGeometry args={[size * 1.02, 32, 16]} />
            <meshStandardMaterial
              color={atmosphereColor || color}
              transparent={true}
              opacity={0.05}
              side={THREE.FrontSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Rings */}
        {hasRings && (
          <mesh ref={ringsRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[size * 1.5, size * 2.5, 64]} />
            <meshBasicMaterial
              color={ringColor}
              transparent={true}
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
    );
  });

  return RealisticPlanet;
}

// Predefined planet configurations
export const planetConfigs = {
  mercury: {
    hasAtmosphere: false,
    surfaceRoughness: 0.9,
    metalness: 0.3,
    surfaceColor: '#8C7853'
  },
  venus: {
    hasAtmosphere: true,
    atmosphereColor: '#FFA500',
    surfaceRoughness: 0.3,
    metalness: 0.1,
    surfaceColor: '#FFC649'
  },
  earth: {
    hasAtmosphere: true,
    atmosphereColor: '#87CEEB',
    surfaceRoughness: 0.7,
    metalness: 0.2,
    surfaceColor: '#6B93D6'
  },
  mars: {
    hasAtmosphere: false,
    surfaceRoughness: 0.8,
    metalness: 0.1,
    surfaceColor: '#CD5C5C'
  },
  jupiter: {
    hasAtmosphere: false,
    surfaceRoughness: 0.4,
    metalness: 0.0,
    surfaceColor: '#D8CA9D'
  },
  saturn: {
    hasAtmosphere: false,
    hasRings: true,
    ringColor: '#DDD',
    surfaceRoughness: 0.4,
    metalness: 0.0,
    surfaceColor: '#FAD5A5'
  },
  uranus: {
    hasAtmosphere: false,
    hasRings: true,
    ringColor: '#888',
    surfaceRoughness: 0.3,
    metalness: 0.0,
    surfaceColor: '#4FD0E7'
  },
  neptune: {
    hasAtmosphere: false,
    surfaceRoughness: 0.3,
    metalness: 0.0,
    surfaceColor: '#4B70DD'
  },
  sun: {
    hasAtmosphere: false,
    surfaceRoughness: 0.1,
    metalness: 0.0,
    emissive: '#FF6600',
    emissiveIntensity: 0.8,
    surfaceColor: '#FFA500'
  }
};
