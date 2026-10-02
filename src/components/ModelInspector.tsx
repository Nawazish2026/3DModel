import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronUp, Box, Cpu } from 'lucide-react';
import type { ModelMetadata } from '../types/3d';
import { formatNumber } from '../utils/format';

interface ModelInspectorProps {
  metadata: ModelMetadata | null;
}

export const ModelInspector: React.FC<ModelInspectorProps> = ({ metadata }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!metadata) return null;

  return (
    <div className={`inspector-card ${collapsed ? 'collapsed' : ''}`}>
      <div className="inspector-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="inspector-title">
          <Activity size={16} className="text-accent" />
          <span>Model Telemetry</span>
        </div>
        <button className="inspector-toggle-btn" aria-label="Toggle inspector">
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="inspector-body">
          <div className="metric-row main-name">
            <span className="metric-label">Model</span>
            <span className="metric-value truncate" title={metadata.prompt}>
              {metadata.name}
            </span>
          </div>

          <div className="metrics-grid">
            <div className="metric-box">
              <span className="metric-box-label">Triangles</span>
              <span className="metric-box-val text-cyan">
                {formatNumber(metadata.triangles)}
              </span>
            </div>

            <div className="metric-box">
              <span className="metric-box-label">Vertices</span>
              <span className="metric-box-val text-violet">
                {formatNumber(metadata.vertices)}
              </span>
            </div>

            <div className="metric-box">
              <span className="metric-box-label">Materials</span>
              <span className="metric-box-val text-amber">
                {metadata.materialCount} PBR
              </span>
            </div>

            <div className="metric-box">
              <span className="metric-box-label">Format</span>
              <span className="metric-box-val text-emerald">
                GLTF 2.0
              </span>
            </div>
          </div>

          <div className="dimensions-section">
            <div className="dim-title">
              <Box size={13} />
              <span>Bounding Dimensions (X × Y × Z)</span>
            </div>
            <div className="dim-values">
              <span className="dim-tag">W: {metadata.dimensions.x}m</span>
              <span className="dim-tag">H: {metadata.dimensions.y}m</span>
              <span className="dim-tag">D: {metadata.dimensions.z}m</span>
            </div>
          </div>

          <div className="inspector-footer">
            <div className="source-badge">
              <Cpu size={12} />
              <span>{metadata.source === 'ai' ? 'Neural 3D Diffusion' : 'Procedural Synthesis'}</span>
            </div>
            <div className="timestamp">
              {new Date(metadata.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
