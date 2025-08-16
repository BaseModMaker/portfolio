import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Custom atmosphere shader
const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPositionW;
  varying vec3 vViewDirection;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPositionW = worldPosition.xyz;
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  uniform vec3 sunPosition;
  uniform vec3 atmosphereColor;
  uniform float atmosphereIntensity;
  
  varying vec3 vNormal;
  varying vec3 vPositionW;
  varying vec3 vViewDirection;
  
  void main() {
    // Calculate fresnel effect
    float fresnel = dot(vNormal, vViewDirection);
    fresnel = pow(1.0 - fresnel, 2.0);
    
    // Calculate light direction
    vec3 lightDirection = normalize(sunPosition - vPositionW);
    
    // Calculate how much light hits this part of atmosphere
    float lightIntensity = max(dot(vNormal, lightDirection), 0.0);
    
    // Create scattering effect
    float scattering = pow(lightIntensity, 0.5);
    
    // Combine effects
    float atmosphereStrength = fresnel * (0.3 + 0.7 * scattering);
    
    gl_FragColor = vec4(atmosphereColor, atmosphereStrength * atmosphereIntensity);
  }
`;

// Function to create a realistic planet
export function createRealisticPlanet({
  size,
  surfaceColor,
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

    // Create custom atmosphere material
    const atmosphereMaterial = useMemo(() => {
      if (!hasAtmosphere) return null;
      
      return new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        uniforms: {
          sunPosition: { value: new THREE.Vector3(0, 0, 0) },
          atmosphereColor: { value: new THREE.Color(atmosphereColor || surfaceColor) },
          atmosphereIntensity: { value: 0.8 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
      });
    }, [hasAtmosphere, atmosphereColor, surfaceColor]);

    useFrame((state) => {
      if (meshRef.current) {
        meshRef.current.rotation.y += rotationSpeed;
      }
      if (atmosphereRef.current) {
        atmosphereRef.current.rotation.y += rotationSpeed * 0.5;
        
        // Update sun position for atmosphere shader
        if (atmosphereMaterial && atmosphereMaterial.uniforms) {
          // Sun is at origin (0,0,0) in our solar system
          atmosphereMaterial.uniforms.sunPosition.value.set(0, 0, 0);
        }
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
            color={surfaceColor}
            roughness={surfaceRoughness}
            metalness={metalness}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>

        {/* Realistic Atmosphere */}
        {hasAtmosphere && atmosphereMaterial && (
          <mesh ref={atmosphereRef} material={atmosphereMaterial}>
            <sphereGeometry args={[size * 1.15, 32, 16]} />
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
