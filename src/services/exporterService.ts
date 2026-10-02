import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import type { ExportFormat } from '../types/3d';

/**
 * Triggers a native browser file download for a blob or data buffer
 */
export function downloadFile(data: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports a Three.js Object3D or Group into GLB format
 */
export function exportToGLB(object: THREE.Object3D, filename = 'model.glb'): Promise<void> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      object,
      (result) => {
        if (result instanceof ArrayBuffer) {
          downloadFile(result, filename, 'model/gltf-binary');
          resolve();
        } else {
          const output = JSON.stringify(result, null, 2);
          downloadFile(output, filename.replace(/\.glb$/, '.gltf'), 'application/json');
          resolve();
        }
      },
      (error) => {
        console.error('Error exporting GLB:', error);
        reject(error);
      },
      { binary: true }
    );
  });
}

/**
 * Exports a Three.js Object3D into standard Wavefront OBJ format
 */
export function exportToOBJ(object: THREE.Object3D, filename = 'model.obj'): void {
  const exporter = new OBJExporter();
  const result = exporter.parse(object);
  downloadFile(result, filename, 'text/plain');
}

/**
 * Exports a Three.js Object3D into STL format (for 3D printing / CAD)
 */
export function exportToSTL(object: THREE.Object3D, filename = 'model.stl'): void {
  const exporter = new STLExporter();
  const result = exporter.parse(object, { binary: true });
  const data = result instanceof DataView ? result.buffer : (result as BlobPart);
  downloadFile(data, filename, 'application/sla');
}

/**
 * Universal export dispatcher
 */
export async function exportModel(
  object: THREE.Object3D,
  format: ExportFormat,
  modelName = 'generated-model'
): Promise<void> {
  const sanitized = modelName.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 30);
  switch (format) {
    case 'glb':
      await exportToGLB(object, `${sanitized}.glb`);
      break;
    case 'obj':
      exportToOBJ(object, `${sanitized}.obj`);
      break;
    case 'stl':
      exportToSTL(object, `${sanitized}.stl`);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
