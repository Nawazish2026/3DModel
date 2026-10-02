import React from 'react';
import { Box, Settings, Layers, Info, Code2 } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenInfo: () => void;
  provider: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenInfo, provider }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand-logo">
          <div className="logo-icon-wrap">
            <Box className="logo-icon" size={24} />
          </div>
          <div>
            <div className="brand-title">
              VoxelForge <span className="brand-badge">3D</span>
            </div>
            <div className="brand-subtitle">AI Text-to-3D Model Generation Studio</div>
          </div>
        </div>

        <div className="evaluation-tag">
          <span className="eval-dot" />
          <span>OneImmersive SDE Evaluation</span>
        </div>
      </div>

      <div className="header-right">
        <div className="engine-status">
          <Layers size={14} />
          <span>Engine: <strong className="capitalize">{provider}</strong></span>
        </div>

        <button
          className="header-btn"
          onClick={onOpenInfo}
          title="Architecture & Implementation Details"
          aria-label="System Info"
        >
          <Info size={18} />
          <span className="btn-label">Architecture</span>
        </button>

        <button
          className="header-btn"
          onClick={onOpenSettings}
          title="API Keys & Engine Settings"
          aria-label="Settings"
        >
          <Settings size={18} />
          <span className="btn-label">Settings</span>
        </button>

        <a
          href="https://github.com/nawazishhassan/3DModelling"
          target="_blank"
          rel="noopener noreferrer"
          className="header-btn primary-github"
          title="View GitHub Repository"
        >
          <Code2 size={18} />
          <span className="btn-label">Source Code</span>
        </a>
      </div>
    </header>
  );
};
