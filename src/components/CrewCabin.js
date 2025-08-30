import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

// default layer config (texture name, depth name, textureZ, depthZ)
// note: texture names reference files in public/crew-cabin/textures/*.png
// depth names reference public/crew-cabin/depth-maps/*.png
const DEFAULT_LAYERS = [
  { id: 'room', texture: 'room', depth: 'room', textureZ: -300, depthZ: -320 },
  { id: 'table', texture: 'table', depth: 'table', textureZ: -200, depthZ: -210 },
  { id: 'typewriter', texture: 'typewriter-shadow', depth: 'typewriter', textureZ: -160, depthZ: -170 },
  { id: 'chair', texture: 'chair', depth: 'chair', textureZ: -120, depthZ: -130 },
  { id: 'picture', texture: 'picture-shadow', depth: 'picture', textureZ: -80, depthZ: -90 },
];

function CrewCabin({ layers = DEFAULT_LAYERS }) {
  const mountRef = useRef();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    let renderer, scene, camera, frameId;
    const meshCleanup = [];
    let isUnmounted = false;

    // size from mount; fallback to viewport
    let width = window.innerWidth;
    let height = window.innerHeight;
    if (mountRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      width = rect.width || width;
      height = rect.height || height;
    }

    // ensure mount is cleared
    while (mountRef.current && mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    // renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // transparent background
    mountRef.current.appendChild(renderer.domElement);

    // orthographic camera keeps layers same size regardless of Z (depthmap controls parallax)
    camera = new THREE.OrthographicCamera(
      width / -2, width / 2, height / 2, height / -2, -1000, 1000
    );
    camera.position.z = 1;

    scene = new THREE.Scene();

    // texture cache to avoid duplicate loads
    const loader = new THREE.TextureLoader();
    const cache = new Map();
    function loadTextureCached(url) {
      if (cache.has(url)) return cache.get(url);
      const p = new Promise((resolve, reject) => {
        loader.load(
          url,
          tex => {
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            resolve(tex);
          },
          undefined,
          () => reject(new Error('Failed to load: ' + url))
        );
      });
      cache.set(url, p);
      return p;
    }

    // build promises for each layer (texture + depth)
    const layerPromises = layers.map(layer => {
      const texUrl = process.env.PUBLIC_URL + `/crew-cabin/textures/${layer.texture}.png`;
      const depthUrl = process.env.PUBLIC_URL + `/crew-cabin/depth-maps/${layer.depth}.png`;
      return Promise.all([loadTextureCached(texUrl), loadTextureCached(depthUrl)])
        .then(([tex, depth]) => ({ layer, tex, depth }))
        .catch(err => {
          console.error(err.message);
          setShowFallback(true);
          throw err;
        });
    });

    Promise.all(layerPromises).then(results => {
      if (isUnmounted) return;

      // shared mouse uniform
      const mouse = new THREE.Vector2(0.5, 0.5);

      // create a shader per layer; depthmaps do not interact
      results
        .sort((a, b) => (a.layer.textureZ - b.layer.textureZ)) // far -> near
        .forEach(({ layer, tex, depth }) => {
          const uniforms = {
            u_image: { value: tex },
            u_depth: { value: depth },
            u_mouse: { value: mouse },
            u_strength: { value: 0.15 },
            u_texZ: { value: layer.textureZ || 0.0 },
            u_depthZ: { value: layer.depthZ || 0.0 },
            u_resolution: { value: new THREE.Vector2(width, height) }
          };

          const material = new THREE.ShaderMaterial({
            uniforms,
            transparent: true,
            vertexShader: `
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            // displacement uses only this layer's depth texture; u_texZ and u_depthZ allow per-layer tuning.
            fragmentShader: `
              uniform sampler2D u_image;
              uniform sampler2D u_depth;
              uniform vec2 u_mouse;
              uniform float u_strength;
              uniform float u_texZ;
              uniform float u_depthZ;
              varying vec2 vUv;
              void main() {
                float d = texture2D(u_depth, vUv).r;
                // compute a small scale from the Z difference so you can control how much parallax depthmap contributes
                float zFactor = (u_texZ - u_depthZ) * 0.005; // tuning constant
                vec2 center = u_mouse;
                vec2 disp = (vUv - center) * u_strength * (1.0 - d) * zFactor;
                vec2 uv = vUv + disp;
                vec4 color = texture2D(u_image, uv);
                gl_FragColor = color;
              }
            `
          });

          const plane = new THREE.PlaneGeometry(width, height);
          const mesh = new THREE.Mesh(plane, material);
          mesh.position.set(0, 0, layer.textureZ || 0);
          scene.add(mesh);
          meshCleanup.push(() => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
            scene.remove(mesh);
          });
        });

      // mouse handling updates shared mouse uniform for all materials
      function onMouseMove(e) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = (e.clientX - rect.left) / rect.width;
        mouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
      }
      renderer.domElement.addEventListener('mousemove', onMouseMove);

      // animation
      const animate = () => {
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };
      animate();

      // cleanup function
      const cleanup = () => {
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
        cancelAnimationFrame(frameId);
        meshCleanup.forEach(fn => { try { fn(); } catch(e){} });
        if (renderer) {
          renderer.dispose();
          if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
            mountRef.current.removeChild(renderer.domElement);
          }
        }
      };

      CrewCabin._cleanup = cleanup;
    }).catch(() => {
      // already handled by showing fallback
    });

    return () => {
      isUnmounted = true;
      if (CrewCabin._cleanup) CrewCabin._cleanup();
    };
    // eslint-disable-next-line
  }, [layers]);

  if (showFallback) {
    // minimal fallback display
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#111', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
      }}>
        <div>Image or depth map not found. Check public/crew-cabin/textures and depth-maps files.</div>
        <div style={{opacity: 0.6, fontSize: 12, marginTop: 8}}>{JSON.stringify(layers)}</div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0, left: 0, width: '100vw', height: '100vh',
        margin: 0, overflow: 'hidden', background: 'transparent'
      }}
    />
  );
}

export default CrewCabin;
