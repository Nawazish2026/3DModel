export type LightingPreset = 'studio' | 'sunset' | 'cyberpunk' | 'clay';

export type ExportFormat = 'glb' | 'obj' | 'stl';

export interface ViewerControlsAPI {
  resetCamera: () => void;
  captureScreenshot: (filename?: string) => void;
}

export type GenerationStage = 
  | 'idle'
  | 'analyzing'
  | 'diffusion'
  | 'meshing'
  | 'texturing'
  | 'optimizing'
  | 'ready'
  | 'error';

export interface ModelMetadata {
  id: string;
  name: string;
  prompt: string;
  vertices: number;
  triangles: number;
  dimensions: {
    x: number;
    y: number;
    z: number;
  };
  materialCount: number;
  format: string;
  source: 'ai' | 'preset' | 'procedural';
  timestamp: number;
  thumbnailUrl?: string;
  rawUrl?: string;
}

export interface AISettings {
  provider: 'huggingface' | 'smart-engine' | 'meshy' | 'tripo3d';
  hfToken: string;
  hfModelSpace: string;
  meshyApiKey: string;
  tripoApiKey: string;
  generationQuality: 'draft' | 'balanced' | 'ultra';
  autoRotate: boolean;
  castShadows: boolean;
  showGrid: boolean;
}

export interface PresetModel {
  id: string;
  title: string;
  prompt: string;
  category: string;
  description: string;
  url?: string;
  type: 'glb' | 'procedural';
  icon: string;
}
