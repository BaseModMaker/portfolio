import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

// If your app is served from /portfolio/, use process.env.PUBLIC_URL
const IMAGE_URL = process.env.PUBLIC_URL + '/crew-cabin/textures/room.png';
const DEPTH_URL = process.env.PUBLIC_URL + '/crew-cabin/depth-maps/room.png';

function CrewCabin() {
  const mountRef = useRef();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    let renderer, scene, camera, uniforms, frameId, mesh, geometry, material, colorTexture, depthTexture;
    let isUnmounted = false;

    // Ensure the container has a size
    const width = mountRef.current?.offsetWidth || 600;
    const height = mountRef.current?.offsetHeight || 400;

    // Debug: Log container size
    console.log('CrewCabin container size:', width, height);

    // Test if images are accessible by creating Image objects
    const testImage = new window.Image();
    testImage.src = IMAGE_URL;
    testImage.onload = () => console.log('Image loaded via <img>:', IMAGE_URL);
    testImage.onerror = () => {
      console.error('Image NOT found:', IMAGE_URL);
      setShowFallback(true);
    };
    const testDepth = new window.Image();
    testDepth.src = DEPTH_URL;
    testDepth.onload = () => console.log('Depth map loaded via <img>:', DEPTH_URL);
    testDepth.onerror = () => {
      console.error('Depth map NOT found:', DEPTH_URL);
      setShowFallback(true);
    };

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
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
          texture => {
            console.log('Loaded texture:', url);
            resolve(texture);
          },
          undefined,
          err => {
            console.error('Failed to load texture:', url, err);
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
    }).catch((err) => {
      if (mountRef.current) {
        mountRef.current.innerHTML = `<div style="color:white;text-align:center;padding:2em;">${err.message}</div>`;
      }
      console.error('CrewCabin texture load error:', err);
    });

    return () => {
      isUnmounted = true;
      if (CrewCabin._cleanup) CrewCabin._cleanup();
    };
    // eslint-disable-next-line
  }, []);

  if (showFallback) {
    // Show fallback images for debugging
    return (
      <div style={{textAlign: 'center', background: '#111', padding: 16}}>
        <div style={{color: 'white'}}>Image or depth map not found.<br />Check the paths below:</div>
        <div>
          <img src={IMAGE_URL} alt="room" style={{maxWidth: 200, margin: 8, border: '1px solid #333'}} />
          <img src={DEPTH_URL} alt="depth" style={{maxWidth: 200, margin: 8, border: '1px solid #333'}} />
        </div>
        <div style={{color: '#aaa', fontSize: 12}}>
          {IMAGE_URL}<br />{DEPTH_URL}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        maxWidth: 600,
        minWidth: 300,
        height: 400,
        minHeight: 200,
        margin: '0 auto',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
        background: '#111'
      }}
    />
  );
}

export default CrewCabin;
