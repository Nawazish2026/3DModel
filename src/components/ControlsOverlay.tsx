import React, { useState } from 'react';
import {
  Sun,
  Sunset,
  Zap,
  Box,
  RotateCw,
  Grid3X3,
  Camera,
  Maximize2,
  Download,
  ChevronDown,
  Check,
  Compass,
} from 'lucide-react';
import type { LightingPreset, ExportFormat } from '../types/3d';

interface ControlsOverlayProps {
  lightingPreset: LightingPreset;
  onSelectLighting: (preset: LightingPreset) => void;
  wireframe: boolean;
  onToggleWireframe: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onResetCamera: () => void;
  onCaptureScreenshot: () => void;
  onExport: (format: ExportFormat) => void;
  isExporting: boolean;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  lightingPreset,
  onSelectLighting,
  wireframe,
  onToggleWireframe,
  autoRotate,
  onToggleAutoRotate,
  showGrid,
  onToggleGrid,
  onResetCamera,
  onCaptureScreenshot,
  onExport,
  isExporting,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('glb');
  const exportMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!showExportMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  const lightingOptions: { id: LightingPreset; label: string; icon: React.ReactNode }[] = [
    { id: 'studio', label: 'Studio Neutral', icon: <Sun size={15} /> },
    { id: 'sunset', label: 'Sunset Glow', icon: <Sunset size={15} /> },
    { id: 'cyberpunk', label: 'Cyberpunk Neon', icon: <Zap size={15} /> },
    { id: 'clay', label: 'Clay / Topology', icon: <Box size={15} /> },
  ];

  const handleExportClick = (format: ExportFormat) => {
    setSelectedFormat(format);
    setShowExportMenu(false);
    onExport(format);
  };

  return (
    <>
      {/* Top Floating Viewport Control Toolbar */}
      <div className="viewport-top-toolbar">
        {/* Lighting Selector */}
        <div className="toolbar-pill-group">
          {lightingOptions.map((opt) => (
            <button
              key={opt.id}
              className={`toolbar-pill-btn ${lightingPreset === opt.id ? 'active' : ''}`}
              onClick={() => onSelectLighting(opt.id)}
              title={`Lighting: ${opt.label}`}
            >
              {opt.icon}
              <span className="pill-text">{opt.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Viewport Modes */}
        <div className="toolbar-pill-group">
          <button
            className={`toolbar-pill-btn ${wireframe ? 'active' : ''}`}
            onClick={onToggleWireframe}
            title="Toggle Wireframe Topology Mode"
          >
            <Maximize2 size={15} />
            <span className="pill-text">Wireframe</span>
          </button>

          <button
            className={`toolbar-pill-btn ${autoRotate ? 'active' : ''}`}
            onClick={onToggleAutoRotate}
            title="Toggle Continuous Turntable Auto-Rotation"
          >
            <RotateCw size={15} className={autoRotate ? 'spin-rotate' : ''} />
            <span className="pill-text">Auto Spin</span>
          </button>

          <button
            className={`toolbar-pill-btn ${showGrid ? 'active' : ''}`}
            onClick={onToggleGrid}
            title="Toggle Ground Grid Plane"
          >
            <Grid3X3 size={15} />
            <span className="pill-text">Grid</span>
          </button>
        </div>

        {/* Quick Tools */}
        <div className="toolbar-pill-group">
          <button
            className="toolbar-pill-btn"
            onClick={onResetCamera}
            title="Reset Camera & Re-center Model"
          >
            <Compass size={15} />
            <span className="pill-text">Center</span>
          </button>

          <button
            className="toolbar-pill-btn"
            onClick={onCaptureScreenshot}
            title="Capture High-Res Viewport PNG Screenshot"
          >
            <Camera size={15} />
            <span className="pill-text">Snapshot</span>
          </button>
        </div>
      </div>

      {/* Floating Download & Export Menu Button */}
      <div className="export-widget-container">
        <div className="export-dropdown-wrapper" ref={exportMenuRef}>
          {showExportMenu && (
            <div className="export-menu-dropdown">
              <div className="export-menu-header">Export 3D Model</div>
              
              <button
                className="export-menu-item"
                onClick={() => handleExportClick('glb')}
              >
                <div className="export-item-info">
                  <span className="format-title">GLB Format (.glb)</span>
                  <span className="format-desc">Standard PBR Binary glTF (Recommended)</span>
                </div>
                {selectedFormat === 'glb' && <Check size={16} className="item-check" />}
              </button>

              <button
                className="export-menu-item"
                onClick={() => handleExportClick('obj')}
              >
                <div className="export-item-info">
                  <span className="format-title">Wavefront OBJ (.obj)</span>
                  <span className="format-desc">Universal mesh format for Blender/Maya</span>
                </div>
                {selectedFormat === 'obj' && <Check size={16} className="item-check" />}
              </button>

              <button
                className="export-menu-item"
                onClick={() => handleExportClick('stl')}
              >
                <div className="export-item-info">
                  <span className="format-title">STL Format (.stl)</span>
                  <span className="format-desc">Triangulated mesh for 3D Printing & CAD</span>
                </div>
                {selectedFormat === 'stl' && <Check size={16} className="item-check" />}
              </button>
            </div>
          )}

          <div className="export-btn-group">
            <button
              className="export-main-btn"
              onClick={() => onExport(selectedFormat)}
              disabled={isExporting}
            >
              <Download size={16} />
              <span>{isExporting ? 'Exporting...' : `Download .${selectedFormat.toUpperCase()}`}</span>
            </button>

            <button
              className="export-arrow-btn"
              onClick={() => setShowExportMenu(!showExportMenu)}
              aria-label="Select export format"
              disabled={isExporting}
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Floating Navigation Gesture Hint */}
      <div className="gesture-hint">
        <span className="hint-item"><span className="key-icon">🖱️ Drag</span> Rotate</span>
        <span className="hint-divider">•</span>
        <span className="hint-item"><span className="key-icon">🖱️ Right-Click</span> Pan</span>
        <span className="hint-divider">•</span>
        <span className="hint-item"><span className="key-icon">⚙️ Scroll</span> Zoom</span>
      </div>
    </>
  );
};
