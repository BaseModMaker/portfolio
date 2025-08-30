import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const IMAGE_URL = process.env.PUBLIC_URL + '/crew-cabin/textures/room.png';
const DEPTH_URL = process.env.PUBLIC_URL + '/crew-cabin/depth-maps/room.png';

function CrewCabin() {
  const mountRef = useRef();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    let renderer, scene, camera, uniforms, frameId, mesh, geometry, material, colorTexture, depthTexture;
    let isUnmounted = false;

    let width = 600, height = 400;
    if (mountRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      width = rect.width || 600;
      height = rect.height || 400;
    }

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    while (mountRef.current && mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(
      width / -2, width / 2, height / 2, height / -2, 1, 1000
    );
    camera.position.z = 2;

    const loader = new THREE.TextureLoader();

    function loadTexture(url) {
      return new Promise((resolve, reject) => {
        loader.load(
          url,
          texture => resolve(texture),
          undefined,
          () => {
            setShowFallback(true);
            reject(new Error('Failed to load: ' + url));
          }
        );
      });
    }

    Promise.all([
      loadTexture(IMAGE_URL),
      loadTexture(DEPTH_URL)
    ]).then(([color, depth]) => {
      if (isUnmounted) return;
      colorTexture = color;
      depthTexture = depth;
      colorTexture.minFilter = THREE.LinearFilter;
      depthTexture.minFilter = THREE.LinearFilter;

      uniforms = {
        u_image: { value: colorTexture },
        u_depth: { value: depthTexture },
        u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
        u_strength: { value: 0.15 },
        u_resolution: { value: new THREE.Vector2(width, height) }
      };

      material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D u_image;
          uniform sampler2D u_depth;
          uniform vec2 u_mouse;
          uniform float u_strength;
          uniform vec2 u_resolution;
          varying vec2 vUv;
          void main() {
            float depth = texture2D(u_depth, vUv).r;
            vec2 center = u_mouse;
            vec2 disp = (vUv - center) * u_strength * (1.0 - depth);
            vec2 uv = vUv + disp;
            vec4 color = texture2D(u_image, uv);
            gl_FragColor = color;
          }
        `
      });

      geometry = new THREE.PlaneGeometry(width, height, 1, 1);
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      function onMouseMove(e) {
        const rect = renderer.domElement.getBoundingClientRect();
        uniforms.u_mouse.value.x = (e.clientX - rect.left) / rect.width;
        uniforms.u_mouse.value.y = 1.0 - (e.clientY - rect.top) / rect.height;
      }
      renderer.domElement.addEventListener('mousemove', onMouseMove);

      const animate = () => {
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };
      animate();

      const cleanup = () => {
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
        cancelAnimationFrame(frameId);
        renderer.dispose();
        if (geometry) geometry.dispose();
        if (material) material.dispose();
        if (colorTexture) colorTexture.dispose();
        if (depthTexture) depthTexture.dispose();
        if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
          mountRef.current.removeChild(renderer.domElement);
        }
      };

      CrewCabin._cleanup = cleanup;
    }).catch(() => {
      setShowFallback(true);
    });

    return () => {
      isUnmounted = true;
      if (CrewCabin._cleanup) CrewCabin._cleanup();
    };
  }, []);

  if (showFallback) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#111',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Image or depth map not found.</div>
        <div>
          <img src={IMAGE_URL} alt="room" style={{maxWidth: 200, margin: 8, border: '1px solid #333'}} />
          <img src={DEPTH_URL} alt="depth" style={{maxWidth: 200, margin: 8, border: '1px solid #333'}} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        minWidth: 0,
        minHeight: 0,
        margin: 0,
        borderRadius: 0,
        overflow: 'hidden',
        boxShadow: 'none',
        background: 'rgba(0, 0, 0, 0)'
      }}
    />
  );
}

export default CrewCabin;
