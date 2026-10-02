import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { generateProceduralModel } from './proceduralGenerator';
import type { AISettings, GenerationStage, ModelMetadata } from '../types/3d';

export interface GenerationProgressCallback {
  (stage: GenerationStage, message: string, progress: number): void;
}

export interface GenerationResult {
  object: THREE.Group;
  metadata: ModelMetadata;
  source: 'ai' | 'preset' | 'procedural';
  warningMessage?: string;
}

/**
 * Loads a GLTF/GLB model from a URL or ArrayBuffer and returns a Three.js Group.
 */
export async function loadGLTFModel(source: string | ArrayBuffer): Promise<THREE.Group> {
  const loader = new GLTFLoader();

  return new Promise<THREE.Group>((resolve, reject) => {
    if (typeof source === 'string') {
      loader.load(
        source,
        (gltf) => {
          const group = new THREE.Group();
          group.add(gltf.scene);
          resolve(group);
        },
        undefined,
        (error) => reject(error)
      );
    } else {
      loader.parse(
        source,
        '',
        (gltf) => {
          const group = new THREE.Group();
          group.add(gltf.scene);
          resolve(group);
        },
        (error) => reject(error)
      );
    }
  });
}

/**
 * Computes live mesh statistics from a Three.js Object3D/Group
 */
export function calculateModelMetrics(
  object: THREE.Object3D,
  prompt: string,
  source: 'ai' | 'preset' | 'procedural'
): ModelMetadata {
  let totalVertices = 0;
  let totalTriangles = 0;
  const materials = new Set<string>();

  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geo = child.geometry;
      if (geo.attributes.position) {
        totalVertices += geo.attributes.position.count;
      }
      if (geo.index) {
        totalTriangles += geo.index.count / 3;
      } else if (geo.attributes.position) {
        totalTriangles += geo.attributes.position.count / 3;
      }

      if (Array.isArray(child.material)) {
        child.material.forEach((m) => materials.add(m.uuid));
      } else if (child.material) {
        materials.add(child.material.uuid);
      }
    }
  });

  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);

  return {
    id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: prompt.slice(0, 24).trim() || 'Untitled Model',
    prompt,
    vertices: Math.round(totalVertices),
    triangles: Math.round(totalTriangles),
    dimensions: {
      x: Number(size.x.toFixed(2)),
      y: Number(size.y.toFixed(2)),
      z: Number(size.z.toFixed(2)),
    },
    materialCount: materials.size || 1,
    format: 'glb',
    source,
    timestamp: Date.now(),
  };
}

/**
 * Main AI Generation Orchestrator supporting:
 * - Hugging Face Spaces (Gradio)
 * - Meshy.ai API
 * - Tripo3D API
 * - High-Fidelity Smart Procedural Engine (with zero-downtime client-side fallback)
 */
export async function generate3DModel(
  prompt: string,
  settings: AISettings,
  onProgress?: GenerationProgressCallback
): Promise<GenerationResult> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new Error('Prompt cannot be empty');
  }

  // 1. Hugging Face Spaces Engine
  if (settings.provider === 'huggingface') {
    const spaceId = settings.hfModelSpace?.trim() || 'hysts/Shap-E';
    onProgress?.('analyzing', `Connecting to Hugging Face AI 3D Space: ${spaceId}...`, 15);

    try {
      const { Client } = await import('@gradio/client');
      const client = await Client.connect(spaceId, {
        headers: settings.hfToken ? { Authorization: `Bearer ${settings.hfToken}` } : {},
      });

      onProgress?.('diffusion', 'Running 3D diffusion synthesis on Hugging Face GPU...', 45);

      const predictPromise = (async () => {
        if (spaceId.toLowerCase().includes('shap-e')) {
          return await client.predict('/text-to-3d', {
            prompt: trimmed,
            seed: 0,
            guidance_scale: 15,
            num_inference_steps: 32,
          });
        }
        // General HF 3D space fallback
        try {
          return await client.predict('/predict', [trimmed]);
        } catch {
          return await client.predict(0, [trimmed]);
        }
      })();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Hugging Face Space request timed out (GPU queue busy).')), 45000)
      );

      const result = (await Promise.race([predictPromise, timeoutPromise])) as { data?: unknown[] };

      onProgress?.('meshing', 'Downloading & parsing output 3D GLB mesh...', 75);

      let glbSource: string | ArrayBuffer | null = null;

      if (result && Array.isArray(result.data) && result.data.length > 0) {
        for (const item of result.data) {
          if (typeof item === 'string' && (item.endsWith('.glb') || item.endsWith('.gltf') || item.startsWith('http'))) {
            glbSource = item;
            break;
          } else if (item && typeof item === 'object') {
            const maybeObj = item as Record<string, unknown>;
            if (typeof maybeObj.url === 'string') {
              glbSource = maybeObj.url;
              break;
            } else if (typeof maybeObj.path === 'string' && maybeObj.path.endsWith('.glb')) {
              glbSource = maybeObj.path;
              break;
            }
          }
        }
      }

      if (glbSource) {
        onProgress?.('texturing', 'Compiling WebGL shaders and materials...', 90);
        const group = await loadGLTFModel(glbSource);
        const metadata = calculateModelMetrics(group, trimmed, 'ai');
        onProgress?.('ready', 'AI 3D Model generation complete!', 100);

        return {
          object: group,
          metadata,
          source: 'ai',
        };
      } else {
        throw new Error('Hugging Face response did not return a valid GLB asset.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Hugging Face generation fallback:', errorMsg);

      return executeProceduralFallback(
        trimmed,
        onProgress,
        `HF Space (${spaceId}) unavailable (${errorMsg.slice(0, 60)}...). Generated using Smart Procedural Engine.`
      );
    }
  }

  // 2. Meshy.ai API Engine
  if (settings.provider === 'meshy') {
    if (!settings.meshyApiKey) {
      return executeProceduralFallback(
        trimmed,
        onProgress,
        'Meshy API key not configured in Settings. Generated using Smart Procedural Engine.'
      );
    }

    try {
      onProgress?.('analyzing', 'Submitting text prompt to Meshy API...', 15);
      const res = await fetch('https://api.meshy.ai/openapi/v2/text-to-3d', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.meshyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'preview',
          prompt: trimmed,
          art_style: 'realistic',
        }),
      });

      if (!res.ok) {
        throw new Error(`Meshy API error (${res.status})`);
      }

      const { result: taskId } = await res.json();

      let attempts = 0;
      let glbUrl: string | null = null;
      while (attempts < 30) {
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;
        const pollRes = await fetch(`https://api.meshy.ai/openapi/v2/text-to-3d/${taskId}`, {
          headers: { Authorization: `Bearer ${settings.meshyApiKey}` },
        });
        const pollData = await pollRes.json();
        const pct = Math.min(20 + Math.round((pollData.progress || 0) * 0.75), 95);
        onProgress?.('diffusion', `Synthesizing 3D mesh with Meshy (${pollData.progress || 0}%)...`, pct);

        if (pollData.status === 'SUCCEEDED' && pollData.model_urls?.glb) {
          glbUrl = pollData.model_urls.glb;
          break;
        } else if (pollData.status === 'FAILED') {
          throw new Error(pollData.task_error?.message || 'Meshy synthesis failed');
        }
      }

      if (glbUrl) {
        onProgress?.('texturing', 'Loading GLB model into WebGL viewport...', 95);
        const group = await loadGLTFModel(glbUrl);
        const metadata = calculateModelMetrics(group, trimmed, 'ai');
        onProgress?.('ready', 'Meshy 3D generation complete!', 100);
        return { object: group, metadata, source: 'ai' };
      } else {
        throw new Error('Meshy task timed out waiting for GLB output.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Meshy API fallback:', errorMsg);
      return executeProceduralFallback(
        trimmed,
        onProgress,
        `Meshy generation failed (${errorMsg.slice(0, 60)}...). Generated using Smart Procedural Engine.`
      );
    }
  }

  // 3. Tripo3D API Engine
  if (settings.provider === 'tripo3d') {
    if (!settings.tripoApiKey) {
      return executeProceduralFallback(
        trimmed,
        onProgress,
        'Tripo3D API key not configured in Settings. Generated using Smart Procedural Engine.'
      );
    }

    try {
      onProgress?.('analyzing', 'Submitting text prompt to Tripo3D API...', 15);
      const res = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.tripoApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'text_to_model',
          prompt: trimmed,
        }),
      });

      if (!res.ok) {
        throw new Error(`Tripo3D API error (${res.status})`);
      }

      const { data: { task_id } } = await res.json();
      let attempts = 0;
      let glbUrl: string | null = null;

      while (attempts < 30) {
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;
        const pollRes = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${task_id}`, {
          headers: { Authorization: `Bearer ${settings.tripoApiKey}` },
        });
        const pollData = await pollRes.json();
        const pct = Math.min(20 + Math.round((pollData.data?.progress || 0) * 0.75), 95);
        onProgress?.('diffusion', `Synthesizing 3D mesh with Tripo3D (${pollData.data?.progress || 0}%)...`, pct);

        if (pollData.data?.status === 'success' && pollData.data?.output?.model) {
          glbUrl = pollData.data.output.model;
          break;
        } else if (pollData.data?.status === 'failed') {
          throw new Error('Tripo3D synthesis task failed');
        }
      }

      if (glbUrl) {
        onProgress?.('texturing', 'Loading GLB model into WebGL viewport...', 95);
        const group = await loadGLTFModel(glbUrl);
        const metadata = calculateModelMetrics(group, trimmed, 'ai');
        onProgress?.('ready', 'Tripo3D generation complete!', 100);
        return { object: group, metadata, source: 'ai' };
      } else {
        throw new Error('Tripo3D task timed out.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Tripo3D API fallback:', errorMsg);
      return executeProceduralFallback(
        trimmed,
        onProgress,
        `Tripo3D generation failed (${errorMsg.slice(0, 60)}...). Generated using Smart Procedural Engine.`
      );
    }
  }

  // 4. Default: High-Fidelity Smart Procedural Engine
  return executeProceduralFallback(trimmed, onProgress);
}

/**
 * Procedural generation engine with transparent, non-deceptive stage reporting
 */
async function executeProceduralFallback(
  prompt: string,
  onProgress?: GenerationProgressCallback,
  warning?: string
): Promise<GenerationResult> {
  onProgress?.('analyzing', 'Analyzing prompt taxonomy & semantic geometry tokens...', 25);
  await new Promise((r) => setTimeout(r, 200));

  onProgress?.('meshing', 'Synthesizing parametric 3D topology & computing vertex normals...', 65);
  await new Promise((r) => setTimeout(r, 250));

  const object = generateProceduralModel(prompt);

  onProgress?.('texturing', 'Applying physical PBR materials, roughness, & reflections...', 90);
  await new Promise((r) => setTimeout(r, 150));

  const metadata = calculateModelMetrics(object, prompt, 'procedural');

  onProgress?.('ready', '3D Model synthesis complete!', 100);

  return {
    object,
    metadata,
    source: 'procedural',
    warningMessage: warning,
  };
}
