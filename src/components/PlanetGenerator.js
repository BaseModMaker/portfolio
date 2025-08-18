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

// Custom ring shader for realistic rings
const ringVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPositionW;
  varying float vDistanceFromCenter;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPositionW = worldPosition.xyz;
    
    // Calculate distance from center for ring effects
    vec2 center = vec2(0.5, 0.5);
    vDistanceFromCenter = distance(uv, center);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFragmentShader = `
  uniform vec3 sunPosition;
  uniform vec3 ringColor;
  uniform float ringOpacity;
  uniform vec3 planetPosition;
  uniform float planetRadius;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPositionW;
  varying float vDistanceFromCenter;
  
  void main() {
    // Create ring texture with gaps and density variations
    float ringDensity = sin(vDistanceFromCenter * 50.0) * 0.3 + 0.7;
    float ringGaps = step(0.8, sin(vDistanceFromCenter * 200.0));
    ringDensity *= (1.0 - ringGaps * 0.9);
    
    // Calculate lighting from sun - but keep minimum lighting
    vec3 lightDirection = normalize(sunPosition - vPositionW);
    float lightIntensity = max(dot(vNormal, lightDirection), 0.3); // Minimum 0.3 instead of 0.0
    
    // Calculate shadow from planet - simplified to avoid complete disappearance
    float shadowFactor = 1.0;
    vec3 planetToRing = vPositionW - planetPosition;
    float planetDistance = length(planetToRing);
    
    // Only apply shadow if very close to planet
    if (planetDistance < planetRadius * 2.0) {
      shadowFactor = 0.5; // Partial shadow instead of complete darkness
    }
    
    // Combine all effects with consistent base opacity
    float finalOpacity = ringDensity * (0.4 + 0.6 * lightIntensity) * shadowFactor * ringOpacity;
    
    // Add some color variation based on distance
    vec3 finalColor = ringColor * (0.7 + 0.3 * sin(vDistanceFromCenter * 30.0));
    
    gl_FragColor = vec4(finalColor, finalOpacity);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    }, []);

    // Create custom ring material
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const ringMaterial = useMemo(() => {
      if (!hasRings) return null;
      
      return new THREE.ShaderMaterial({
        vertexShader: ringVertexShader,
        fragmentShader: ringFragmentShader,
        uniforms: {
          sunPosition: { value: new THREE.Vector3(0, 0, 0) },
          ringColor: { value: new THREE.Color(ringColor) },
          ringOpacity: { value: 0.7 },
          planetPosition: { value: new THREE.Vector3(0, 0, 0) },
          planetRadius: { value: size }
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      });
    }, []);

    useFrame((state) => {
      if (meshRef.current) {
        meshRef.current.rotation.y += rotationSpeed;
      }
      if (atmosphereRef.current) {
        atmosphereRef.current.rotation.y += rotationSpeed * 0.5;
        
        // Update sun position for atmosphere shader
        if (atmosphereMaterial && atmosphereMaterial.uniforms) {
          atmosphereMaterial.uniforms.sunPosition.value.set(0, 0, 0);
        }
      }
      if (ringsRef.current && ringMaterial && ringMaterial.uniforms) {
        // Update uniforms for ring shader
        ringMaterial.uniforms.sunPosition.value.set(0, 0, 0);
        // Get world position of the planet for shadow calculations
        const worldPosition = new THREE.Vector3();
        meshRef.current.getWorldPosition(worldPosition);
        ringMaterial.uniforms.planetPosition.value.copy(worldPosition);
        
        // Slow ring rotation
        ringsRef.current.rotation.z += rotationSpeed * 0.1;
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

        {/* Realistic Rings */}
        {hasRings && ringMaterial && (
          <mesh ref={ringsRef} rotation={[Math.PI / 2, 0, 0]} material={ringMaterial}>
            <ringGeometry args={[size * 1.3, size * 2.8, 128]} />
          </mesh>
        )}
      </group>
    );
  });

  return RealisticPlanet;
}
