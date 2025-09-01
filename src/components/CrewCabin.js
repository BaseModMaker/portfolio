import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

// Max. Depth Map Size: Blocky & Fast <--- 1536 ---> Detailed & Slow
const MAX_DEPTH_MAP_SIZE = 1536;

// Depth Map Expansion: For better background separation. Only affects rendering. Tweak to avoid stretchy lines.
const DEPTH_MAP_EXPANSION = 0;

// Depth Map Scale: Tweak the scale of depth displacement.
const DEPTH_MAP_SCALE = 5.0;

// default layer config (texture name, depth name, textureZ, depthZ)
// note: texture names reference files in public/crew-cabin/textures/*.png
// depth names reference public/crew-cabin/depth-maps/*.png
const zposition = -300
const zoffset = -20
const DEFAULT_LAYERS = [
  { id: 'room', texture: 'room', depth: 'room', textureZ: zposition, depthZ: zposition + zoffset},
  { id: 'table', texture: 'table', depth: 'table', textureZ: zposition, depthZ: zposition + zoffset},
  { id: 'typewriter', texture: 'typewriter-shadow', depth: 'typewriter', textureZ: zposition, depthZ: zposition + zoffset},
  { id: 'chair', texture: 'chair', depth: 'chair-min', textureZ: zposition, depthZ: zposition + zoffset},
  { id: 'picture', texture: 'picture-shadow', depth: 'picture', textureZ: zposition, depthZ: zposition + zoffset},
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

    // use a perspective camera and compute plane sizes so each plane fills the view
    const fov = 45; // degrees
    camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 5000);
    camera.position.z = 0; // in front of the layers (layers use negative Z)
    // fixed focus point the camera always looks at (keeps the same lookAt target)
    const focusPoint = new THREE.Vector3(0, 0, zposition);
    // camera smoothing/tween state
    const cameraTarget = new THREE.Vector3(0, 0, 0);
    const cameraLerp = 0.08;

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

    // Helper to expand a depth map by DEPTH_MAP_EXPANSION pixels, using edge pixels
    function expandDepthMapTexture(depthTex, expansion) {
      if (!depthTex || !depthTex.image) return depthTex;
      const src = depthTex.image;
      const srcW = src.width, srcH = src.height;
      const dstW = srcW + 2 * expansion, dstH = srcH + 2 * expansion;

      // Create a canvas to draw the expanded image
      const canvas = document.createElement('canvas');
      canvas.width = dstW;
      canvas.height = dstH;
      const ctx = canvas.getContext('2d');

      // Draw the center
      ctx.drawImage(src, expansion, expansion);

      // Top and bottom borders
      ctx.drawImage(src, 0, 0, srcW, 1, expansion, 0, srcW, expansion); // top
      ctx.drawImage(src, 0, srcH - 1, srcW, 1, expansion, expansion + srcH, srcW, expansion); // bottom

      // Left and right borders
      ctx.drawImage(src, 0, 0, 1, srcH, 0, expansion, expansion, srcH); // left
      ctx.drawImage(src, srcW - 1, 0, 1, srcH, expansion + srcW, expansion, expansion, srcH); // right

      // Corners
      ctx.drawImage(src, 0, 0, 1, 1, 0, 0, expansion, expansion); // top-left
      ctx.drawImage(src, srcW - 1, 0, 1, 1, expansion + srcW, 0, expansion, expansion); // top-right
      ctx.drawImage(src, 0, srcH - 1, 1, 1, 0, expansion + srcH, expansion, expansion); // bottom-left
      ctx.drawImage(src, srcW - 1, srcH - 1, 1, 1, expansion + srcW, expansion + srcH, expansion, expansion); // bottom-right

      // Create a new texture from the canvas
      const expandedTex = new THREE.Texture(canvas);
      expandedTex.needsUpdate = true;
      expandedTex.minFilter = depthTex.minFilter;
      expandedTex.magFilter = depthTex.magFilter;
      expandedTex.generateMipmaps = depthTex.generateMipmaps;
      expandedTex.anisotropy = depthTex.anisotropy;
      return expandedTex;
    }

    Promise.all(layerPromises).then(results => {
      if (isUnmounted) return;

      // create textured, displaced planes (depthmap used in vertex shader)
      // sort far -> near
      results
        .sort((a, b) => (a.layer.textureZ - b.layer.textureZ))
        .forEach(({ layer, tex, depth }) => {
          const distance = Math.abs((layer.textureZ || 0) - camera.position.z);
          const fovRad = (fov * Math.PI) / 180;
          const planeHeight = 2 * distance * Math.tan(fovRad / 2);
          const planeWidth = planeHeight * (width / height);

          // improve texture sampling quality (mipmaps + anisotropy)
          try {
            const maxAniso = (renderer.capabilities && renderer.capabilities.getMaxAnisotropy)
              ? renderer.capabilities.getMaxAnisotropy()
              : (THREE.MathUtils ? THREE.MathUtils.clamp(1,1,16) : 1);
            if (depth) {
              depth.minFilter = THREE.LinearMipMapLinearFilter;
              depth.magFilter = THREE.LinearFilter;
              depth.generateMipmaps = true;
              depth.anisotropy = maxAniso;
              depth.needsUpdate = true;
            }
            if (tex) {
              tex.minFilter = THREE.LinearMipMapLinearFilter;
              tex.magFilter = THREE.LinearFilter;
              tex.generateMipmaps = true;
              tex.anisotropy = maxAniso;
              tex.needsUpdate = true;
            }
          } catch (e) { /* non-fatal */ }

          // Expand the depth map with a border of DEPTH_MAP_EXPANSION pixels
          const expandedDepth = expandDepthMapTexture(depth, DEPTH_MAP_EXPANSION);

          // adapt segments to depth-map resolution for finer displacement detail
          // clamp depth map size for performance
          const depthImgW = Math.min(
            (expandedDepth && expandedDepth.image && expandedDepth.image.width) ? expandedDepth.image.width : 1024,
            MAX_DEPTH_MAP_SIZE
          );
          const depthImgH = Math.min(
            (expandedDepth && expandedDepth.image && expandedDepth.image.height) ? expandedDepth.image.height : 1024,
            MAX_DEPTH_MAP_SIZE
          );
          const pxPerVertex = 3; // smaller -> more detail; tune for performance
          let segX = Math.max(Math.floor(depthImgW / pxPerVertex), 64);
          let segY = Math.max(Math.floor(depthImgH / pxPerVertex), 64);
          const MAX_SEGMENTS = 512; // clamp to avoid massive geometry
          segX = Math.min(segX, MAX_SEGMENTS);
          segY = Math.min(segY, MAX_SEGMENTS);
          const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, segX, segY);

          // depth scale derived from texture/depth Z difference (tunable multiplier)
          const depthDiff = Math.abs((layer.textureZ || 0) - (layer.depthZ || layer.textureZ || 0));
          const depthScale = depthDiff * DEPTH_MAP_SCALE;

          const uniforms = {
            u_map: { value: tex },
            u_depth: { value: expandedDepth },
            u_depthScale: { value: depthScale }
          };

          const material = new THREE.ShaderMaterial({
            uniforms,
            transparent: true,
            depthTest: true,
            depthWrite: false,
            vertexShader: `
              varying vec2 vUv;
              uniform sampler2D u_depth;
              uniform float u_depthScale;
              void main() {
                vUv = uv;
                float d = texture2D(u_depth, uv).r;
                float disp = (1.0 - d) * u_depthScale;
                vec3 displaced = position - normal * disp;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
              }
            `,
            fragmentShader: `
              varying vec2 vUv;
              uniform sampler2D u_map;
              void main() {
                gl_FragColor = texture2D(u_map, vUv);
              }
            `
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(0, 0, layer.textureZ || 0);
          scene.add(mesh);
          meshCleanup.push(() => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
            scene.remove(mesh);
          });
        });

      // shared mouse state (normalized 0..1)
      const mouse = { x: 0.5, y: 0.5 };

      // mouse handling updates camera target (not shader uniforms)
      function onMouseMove(e) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = (e.clientX - rect.left) / rect.width;
        mouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
      }
      renderer.domElement.addEventListener('mousemove', onMouseMove);

      // animate: smoothly move camera according to mouse to produce parallax, but always lookAt(focusPoint)
      const animate = () => {
        const maxOffsetX = 100;
        const maxOffsetY = 60;
        cameraTarget.x = (mouse.x - 0.5) * maxOffsetX;
        cameraTarget.y = (mouse.y - 0.5) * -maxOffsetY;

        // smooth camera position toward target
        camera.position.x += (cameraTarget.x - camera.position.x) * cameraLerp;
        camera.position.y += (cameraTarget.y - camera.position.y) * cameraLerp;

        // always look at the same focus point (keeps focal point constant)
        camera.lookAt(focusPoint);

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
