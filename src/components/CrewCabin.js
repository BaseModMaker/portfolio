import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const imageDepthPairs = [
  {
    image: process.env.PUBLIC_URL + '/crew-cabin/textures/room.png',
    depth: process.env.PUBLIC_URL + '/crew-cabin/depth-maps/room.png',
    zIndex: 0,
    depthStart: 0.0
  },
  {
    image: process.env.PUBLIC_URL + '/crew-cabin/textures/space.png',
    depth: process.env.PUBLIC_URL + '/crew-cabin/depth-maps/black.png',
    zIndex: 0.1,
    depthStart: 0.0
  },
  {
    image: process.env.PUBLIC_URL + '/crew-cabin/textures/calendar.png',
    depth: process.env.PUBLIC_URL + '/crew-cabin/depth-maps/black.png',
    zIndex: 0.1,
    depthStart: 0.0
  },
  {
    image: process.env.PUBLIC_URL + '/crew-cabin/textures/table-legs.png',
    depth: process.env.PUBLIC_URL + '/crew-cabin/depth-maps/table-legs.png',
    zIndex: 0.1,
    depthStart: 0.1
  },
  {
    image: process.env.PUBLIC_URL + '/crew-cabin/textures/table-no-legs.png',
    depth: process.env.PUBLIC_URL + '/crew-cabin/depth-maps/table-no-legs.png',
    zIndex: 0.1,
    depthStart: 0.11
  },
  {
    image: process.env.PUBLIC_URL + '/crew-cabin/textures/picture-shadow.png',
    depth: process.env.PUBLIC_URL + '/crew-cabin/depth-maps/picture.png',
    zIndex: 0.3,
    depthStart: 0.2
  },
  {
    image: process.env.PUBLIC_URL + '/crew-cabin/textures/typewriter-shadow.png',
    depth: process.env.PUBLIC_URL + '/crew-cabin/depth-maps/typewriter.png',
    zIndex: 0.3,
    depthStart: 0.2
  },
  {
    image: process.env.PUBLIC_URL + '/crew-cabin/textures/chair-no-arm.png',
    depth: process.env.PUBLIC_URL + '/crew-cabin/depth-maps/chair-no-arm.png',
    zIndex: 0.5,
    depthStart: 0.3
  },
  {
    image: process.env.PUBLIC_URL + '/crew-cabin/textures/chair-arm.png',
    depth: process.env.PUBLIC_URL + '/crew-cabin/depth-maps/chair-arm.png',
    zIndex: 0.5,
    depthStart: 0.18
  },
];

// Define screen partitions and their descriptions
const hoverRegions = [
  {
    id: 'space',
    left: '30%',
    top: '20%',
    width: '30%',
    height: '40%',
    description: 'Space'
  },
  {
    id: 'typewriter',
    left: '35%',
    top: '55%',
    width: '21%',
    height: '20%',
    description: 'Typewriter'
  },
  {
    id: 'picture',
    left: '21%',
    top: '55%',
    width: '11%',
    height: '19%',
    description: 'Picture on the table'
  },
  {
    id: 'calendar',
    left: '64%',
    top: '30%',
    width: '12%',
    height: '24%',
    description: 'Calendar on the wall'
  },
];

const CrewCabin = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [materialsReady, setMaterialsReady] = useState(false);

  // Use refs for materials, meshes, etc.
  const meshesRef = useRef([]);
  const materialsRef = useRef([]);
  const geometriesRef = useRef([]);
  const imageTexturesRef = useRef([]);
  const depthTexturesRef = useRef([]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Create light
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 5, 15);
    scene.add(light);

    const textureLoader = new THREE.TextureLoader();

    // Mouse interaction uniforms
    const mouseUniform = { value: new THREE.Vector2(0.5, 0.5) };
    const resolutionUniform = { value: new THREE.Vector2(window.innerWidth, window.innerHeight) };

    // Store all meshes/resources for cleanup
    const meshes = [];
    const geometries = [];
    const materials = [];
    const imageTextures = [];
    const depthTextures = [];

    // Helper to load a texture and return a promise
    const loadTexture = (url) =>
      new Promise((resolve) => {
        textureLoader.load(url, (texture) => {
          texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.minFilter = THREE.LinearFilter;
          resolve(texture);
        });
      });

    // Load all image/depth pairs
    Promise.all(
      imageDepthPairs.map(pair =>
        Promise.all([loadTexture(pair.image), loadTexture(pair.depth)])
      )
    ).then((loadedPairs) => {
      loadedPairs.forEach(([imageTexture, depthTexture], idx) => {
        imageTextures.push(imageTexture);
        depthTextures.push(depthTexture);

        // Plane geometry
        const aspect = window.innerWidth / window.innerHeight;
        const planeHeight = 4;
        const planeWidth = planeHeight * aspect;
        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 256, 256);

        // Shader uniforms
        const uniforms = {
          u_image: { value: imageTexture },
          u_depth: { value: depthTexture },
          u_mouse: mouseUniform,
          u_resolution: resolutionUniform,
          u_aspectRatio: { value: 1.0 },
          u_time: { value: 0 },
          u_lightPos: { value: light.position },
          u_lightColor: { value: new THREE.Color(light.color) },
          u_lightIntensity: { value: 1.0 },
          u_lightEnabled: { value: true },
          u_depthStart: { value: imageDepthPairs[idx].depthStart ?? 0.0 },
          u_highlight: { value: false }, // highlight uniform
        };

        // Vertex shader
        const vertexShader = `
          uniform sampler2D u_depth;
          uniform vec2 u_mouse;
          uniform float u_aspectRatio;
          uniform float u_depthStart;
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vPosition;

          void main() {
            vUv = uv;
            vNormal = normal;

            vec4 depth = texture2D(u_depth, uv);
            float height = depth.r + u_depthStart;

            vec3 newPosition = position + normal * height * 0.5;

            float parallaxX = (u_mouse.x - 0.5) * 0.2;
            float parallaxY = (u_mouse.y - 0.5) * 0.2;
            newPosition.x += parallaxX * (1.0 - height);
            newPosition.y += parallaxY * (1.0 - height) * u_aspectRatio;

            vPosition = newPosition;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `;

        // Fragment shader
        const fragmentShader = `
          uniform sampler2D u_image;
          uniform sampler2D u_depth;
          uniform vec2 u_resolution;
          uniform vec3 u_lightPos;
          uniform vec3 u_lightColor;
          uniform float u_lightIntensity;
          uniform bool u_lightEnabled;
          uniform bool u_highlight;
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vPosition;

          vec3 calculateNormal(vec2 uv) {
            vec2 texelSize = 1.0 / u_resolution;
            float left = texture2D(u_depth, uv - vec2(texelSize.x, 0.0)).r;
            float right = texture2D(u_depth, uv + vec2(texelSize.x, 0.0)).r;
            float top = texture2D(u_depth, uv + vec2(0.0, texelSize.y)).r;
            float bottom = texture2D(u_depth, uv - vec2(0.0, texelSize.y)).r;
            return normalize(vec3(left - right, bottom - top, 0.1));
          }

          void main() {
            vec4 color = texture2D(u_image, vUv);
            vec3 normal = calculateNormal(vUv);

            vec3 lightDir = normalize(u_lightPos - vPosition);

            float lightIntensity = u_lightEnabled ? max(dot(normal, lightDir), 0.0) * u_lightIntensity : 0.0;

            vec3 ambient = vec3(0.2);
            vec3 diffuse = u_lightColor * lightIntensity;

            vec3 finalColor = color.rgb * (ambient + diffuse);

            // Highlight effect: blend with yellow if highlighted
            if(u_highlight) {
              finalColor = mix(finalColor, vec3(1.0, 1.0, 0.2), 0.5);
            }

            gl_FragColor = vec4(finalColor, color.a);
          }
        `;

        const material = new THREE.ShaderMaterial({
          uniforms: uniforms,
          vertexShader,
          fragmentShader,
          side: THREE.DoubleSide,
          transparent: true
        });

        // Stack meshes with slight z-offset to avoid z-fighting
        const planeMesh = new THREE.Mesh(geometry, material);
        planeMesh.position.z = imageDepthPairs[idx].zIndex; // Set the z position based on the zIndex
        scene.add(planeMesh);

        meshes.push(planeMesh);
        geometries.push(geometry);
        materials.push(material);
      });

      // Save to refs for access in highlight effect
      meshesRef.current = meshes;
      materialsRef.current = materials;
      geometriesRef.current = geometries;
      imageTexturesRef.current = imageTextures;
      depthTexturesRef.current = depthTextures;

      setMaterialsReady(true); // <-- Mark materials as ready

      // Mouse interaction
      const handleMouseMove = (event) => {
        mouseUniform.value.x = event.clientX / window.innerWidth;
        mouseUniform.value.y = 1.0 - event.clientY / window.innerHeight;
      };
      document.addEventListener('mousemove', handleMouseMove);

      // Animation loop (use THREE.Clock for accurate timing)
      const clock = new THREE.Clock();
      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();
        materials.forEach(mat => {
          if (mat.uniforms.u_time) mat.uniforms.u_time.value = elapsed;
        });
        renderer.render(scene, camera);
      };
      animate();

      // Handle resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        resolutionUniform.value.set(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      // Cleanup
      animationRef.current = {
        dispose: () => {
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
          document.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('resize', handleResize);
          if (mountRef.current && renderer.domElement) {
            mountRef.current.removeChild(renderer.domElement);
          }
          meshes.forEach(mesh => scene.remove(mesh));
          geometries.forEach(g => g.dispose());
          materials.forEach(m => m.dispose());
          imageTextures.forEach(t => t.dispose());
          depthTextures.forEach(t => t.dispose());
          renderer.dispose();
        }
      };
    });

    // Cleanup
    return () => {
      if (animationRef.current && typeof animationRef.current.dispose === 'function') {
        animationRef.current.dispose();
      }
    };
  }, []);

  // Highlight logic: update highlight uniforms on hoveredRegion change
  useEffect(() => {
    if (!materialsReady) return; // Only run when materials are ready
    const materials = materialsRef.current;
    // Map region id to mesh index in imageDepthPairs
    const regionToImageIdx = {
      space: 1,
      calendar: 2,
      'table-legs': 3,
      'table-no-legs': 4,
      picture: 5,
      typewriter: 6,
      'chair-no-arm': 7,
      'chair-arm': 8,
    };
    // Find the mesh index for the hovered region
    let highlightIdx = null;
    if (hoveredRegion && regionToImageIdx[hoveredRegion] !== undefined) {
      highlightIdx = regionToImageIdx[hoveredRegion];
    }
    // Set highlight uniforms
    if (highlightIdx !== null && highlightIdx < materials.length) {
      materials.forEach((mat, idx) => {
        if (mat.uniforms && mat.uniforms.u_highlight) {
          mat.uniforms.u_highlight.value = idx === highlightIdx;
        }
      });
    } else {
      materials.forEach(mat => {
        if (mat.uniforms && mat.uniforms.u_highlight) {
          mat.uniforms.u_highlight.value = false;
        }
      });
    }
  }, [hoveredRegion, materialsReady]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
      }} 
    >
      {/* Overlay hover regions */}
      {hoverRegions.map(region => (
        <div
          key={region.id}
          style={{
            position: 'absolute',
            left: region.left,
            top: region.top,
            width: region.width,
            height: region.height,
            zIndex: 2,
            cursor: 'pointer',
            background: 'transparent'
          }}
          onMouseEnter={() => setHoveredRegion(region.id)}
          onMouseLeave={() => setHoveredRegion(null)}
        />
      ))}
      {/* No tooltip */}
    </div>
  );
};

export default CrewCabin;
