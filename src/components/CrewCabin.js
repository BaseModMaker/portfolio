import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const imageDepthPairs = [
  {
    image: process.env.PUBLIC_URL + '/crew-cabin/textures/room.png',
    depth: process.env.PUBLIC_URL + '/crew-cabin/depth-maps/room.png'
  },
  {
    image: process.env.PUBLIC_URL + '/crew-cabin/textures/chair.png',
    depth: process.env.PUBLIC_URL + '/crew-cabin/depth-maps/chair.png'
  }
];

const CrewCabin = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);

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
          u_lightEnabled: { value: true }
        };

        // Vertex shader
        const vertexShader = `
          uniform sampler2D u_depth;
          uniform vec2 u_mouse;
          uniform float u_aspectRatio;
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vPosition;

          void main() {
            vUv = uv;
            vNormal = normal;

            vec4 depth = texture2D(u_depth, uv);
            float height = depth.r;

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
        planeMesh.position.z = idx * 0.2; // Each mesh slightly in front of previous
        scene.add(planeMesh);

        meshes.push(planeMesh);
        geometries.push(geometry);
        materials.push(material);
      });

      // Mouse interaction
      const handleMouseMove = (event) => {
        mouseUniform.value.x = event.clientX / window.innerWidth;
        mouseUniform.value.y = 1.0 - event.clientY / window.innerHeight;
      };
      document.addEventListener('mousemove', handleMouseMove);

      // Animation loop
      let time = 0;
      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);
        time += 0.016;
        materials.forEach(mat => {
          if (mat.uniforms.u_time) mat.uniforms.u_time.value = time;
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
    />
  );
};

export default CrewCabin;
