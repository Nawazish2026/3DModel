import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { LightingPreset } from '../types/3d';

interface Viewer3DProps {
  model: THREE.Group | null;
  lightingPreset: LightingPreset;
  wireframe: boolean;
  autoRotate: boolean;
  showGrid: boolean;
  onControlsReady?: (controls: {
    resetCamera: () => void;
    captureScreenshot: (filename?: string) => void;
  }) => void;
}

/**
 * Recursive GPU resource cleanup for Three.js objects
 */
function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => disposeMaterial(m));
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });
}

function disposeMaterial(mat: THREE.Material) {
  const matAny = mat as unknown as Record<string, unknown>;
  for (const key of Object.keys(matAny)) {
    const val = matAny[key];
    if (val && typeof val === 'object' && 'isTexture' in val && typeof (val as THREE.Texture).dispose === 'function') {
      (val as THREE.Texture).dispose();
    }
  }
  mat.dispose();
}

export const Viewer3D: React.FC<Viewer3DProps> = ({
  model,
  lightingPreset,
  wireframe,
  autoRotate,
  showGrid,
  onControlsReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelAnchorRef = useRef<THREE.Group | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const shadowFloorRef = useRef<THREE.Mesh | null>(null);
  const originalMaterialsMap = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map());
  const clayMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const onControlsReadyRef = useRef(onControlsReady);

  useEffect(() => {
    onControlsReadyRef.current = onControlsReady;
  }, [onControlsReady]);

  // Initialize Three.js Viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.04);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.5, 2.5, 4.5);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.2;
    controls.maxDistance = 25;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Studio Ground Grid & Contact Shadow Plane
    const gridHelper = new THREE.GridHelper(20, 20, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const shadowFloorGeo = new THREE.PlaneGeometry(30, 30);
    const shadowFloorMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowFloor = new THREE.Mesh(shadowFloorGeo, shadowFloorMat);
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.position.y = -0.02;
    shadowFloor.receiveShadow = true;
    scene.add(shadowFloor);
    shadowFloorRef.current = shadowFloor;

    // 6. Anchor group for models
    const modelAnchor = new THREE.Group();
    scene.add(modelAnchor);
    modelAnchorRef.current = modelAnchor;

    // 7. Lighting Group
    const lightsGroup = new THREE.Group();
    scene.add(lightsGroup);
    lightsGroupRef.current = lightsGroup;

    // Pre-allocate Clay Material
    clayMaterialRef.current = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.8,
      metalness: 0.1,
    });

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // Use ResizeObserver on container element
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Expose Controls API
    if (onControlsReadyRef.current) {
      onControlsReadyRef.current({
        resetCamera: () => {
          if (!cameraRef.current || !controlsRef.current) return;
          cameraRef.current.position.set(3.5, 2.5, 4.5);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        },
        captureScreenshot: (filename = '3d-model-snapshot.png') => {
          if (!rendererRef.current) return;
          const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        },
      });
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      // Dispose lights and shadows
      if (lightsGroupRef.current) {
        lightsGroupRef.current.children.forEach((light) => {
          if ('shadow' in light && (light as THREE.DirectionalLight).shadow?.map) {
            (light as THREE.DirectionalLight).shadow.map?.dispose();
          }
        });
        lightsGroupRef.current.clear();
      }

      // Dispose ground & grid
      if (shadowFloorRef.current) {
        shadowFloorRef.current.geometry.dispose();
        if (Array.isArray(shadowFloorRef.current.material)) {
          shadowFloorRef.current.material.forEach((m) => m.dispose());
        } else {
          shadowFloorRef.current.material.dispose();
        }
      }
      if (gridHelperRef.current) {
        gridHelperRef.current.geometry.dispose();
        if (Array.isArray(gridHelperRef.current.material)) {
          gridHelperRef.current.material.forEach((m) => m.dispose());
        } else {
          gridHelperRef.current.material.dispose();
        }
      }

      // Dispose active model
      if (modelAnchorRef.current) {
        disposeObject(modelAnchorRef.current);
        modelAnchorRef.current.clear();
      }

      // Dispose clay material
      if (clayMaterialRef.current) {
        clayMaterialRef.current.dispose();
      }

      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Grid visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Update Auto-Rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [autoRotate]);

  // Update Lighting Presets with Shadow Map cleanup
  useEffect(() => {
    const lightsGroup = lightsGroupRef.current;
    if (!lightsGroup) return;

    // Clean up existing lights & shadow maps to prevent GPU memory leak
    lightsGroup.children.forEach((light) => {
      if ('shadow' in light && (light as THREE.DirectionalLight).shadow?.map) {
        (light as THREE.DirectionalLight).shadow.map?.dispose();
      }
    });
    lightsGroup.clear();

    switch (lightingPreset) {
      case 'sunset': {
        const ambient = new THREE.AmbientLight(0x4a1d4a, 0.6);
        const sun = new THREE.DirectionalLight(0xf97316, 2.5);
        sun.position.set(6, 4, 3);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);

        const fill = new THREE.DirectionalLight(0x8b5cf6, 1.2);
        fill.position.set(-5, 2, -4);

        lightsGroup.add(ambient, sun, fill);
        break;
      }

      case 'cyberpunk': {
        const ambient = new THREE.AmbientLight(0x0f172a, 0.4);
        const neonCyan = new THREE.PointLight(0x06b6d4, 4.0, 15);
        neonCyan.position.set(3, 3, 3);

        const neonPink = new THREE.PointLight(0xec4899, 4.0, 15);
        neonPink.position.set(-3, 2, -2);

        const key = new THREE.DirectionalLight(0x38bdf8, 1.5);
        key.position.set(0, 5, 4);
        key.castShadow = true;

        lightsGroup.add(ambient, neonCyan, neonPink, key);
        break;
      }

      case 'clay': {
        const ambient = new THREE.AmbientLight(0xffffff, 0.9);
        const main = new THREE.DirectionalLight(0xffffff, 1.5);
        main.position.set(5, 8, 5);
        main.castShadow = true;
        main.shadow.mapSize.set(2048, 2048);

        const back = new THREE.DirectionalLight(0x94a3b8, 0.8);
        back.position.set(-5, 3, -5);

        lightsGroup.add(ambient, main, back);
        break;
      }

      case 'studio':
      default: {
        const ambient = new THREE.AmbientLight(0xffffff, 0.85);
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
        keyLight.position.set(5, 7, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.bias = -0.0001;

        const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.8);
        fillLight.position.set(-5, 3, -3);

        const rimLight = new THREE.DirectionalLight(0xa855f7, 0.6);
        rimLight.position.set(0, 4, -6);

        lightsGroup.add(ambient, keyLight, fillLight, rimLight);
        break;
      }
    }
  }, [lightingPreset]);

  // Update Model in Anchor & Auto-center/fit camera (with strict GPU memory disposal)
  useEffect(() => {
    const anchor = modelAnchorRef.current;
    if (!anchor) return;

    // Properly dispose old GPU buffers
    disposeObject(anchor);
    anchor.clear();
    originalMaterialsMap.current.clear();

    if (!model) return;

    const instance = model.clone(true);

    // Cache original materials for clay/wireframe modes
    instance.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        originalMaterialsMap.current.set(child.uuid, child.material);
      }
    });

    // Compute bounding box and normalize
    const box = new THREE.Box3().setFromObject(instance);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const targetScale = maxDim > 0 ? 3.0 / maxDim : 1.0;

    instance.scale.setScalar(targetScale);

    // Re-center so model rests gracefully on ground grid (y = 0)
    const normalizedBox = new THREE.Box3().setFromObject(instance);
    instance.position.x = -center.x * targetScale;
    instance.position.z = -center.z * targetScale;
    instance.position.y = -normalizedBox.min.y;

    anchor.add(instance);

    // Smoothly focus camera
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.target.set(0, (normalizedBox.max.y - normalizedBox.min.y) * 0.4, 0);
      controlsRef.current.update();
    }
  }, [model]);

  // Handle Wireframe & Clay Material Overrides
  useEffect(() => {
    const anchor = modelAnchorRef.current;
    const clayMat = clayMaterialRef.current;
    if (!anchor || !clayMat) return;

    anchor.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const orig = originalMaterialsMap.current.get(child.uuid);

        if (lightingPreset === 'clay') {
          child.material = clayMat;
        } else if (orig) {
          child.material = orig;
        }

        // Apply wireframe flag
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => (m.wireframe = wireframe));
        } else if (child.material) {
          child.material.wireframe = wireframe;
        }
      }
    });
  }, [wireframe, lightingPreset, model]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        outline: 'none',
        overflow: 'hidden',
      }}
    />
  );
};
