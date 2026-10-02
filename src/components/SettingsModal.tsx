import React from 'react';
import { X, Key, Cpu, ShieldCheck, ExternalLink, Sliders } from 'lucide-react';
import type { AISettings } from '../types/3d';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSaveSettings: (settings: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [prevSettings, setPrevSettings] = React.useState(settings);
  const [formData, setFormData] = React.useState<AISettings>({ ...settings });

  if (prevSettings !== settings) {
    setPrevSettings(settings);
    setFormData({ ...settings });
  }

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-bar">
          <div className="modal-title-with-icon">
            <Sliders size={20} className="text-cyan" />
            <h3>AI Engine & Viewport Settings</h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          {/* Engine Provider Selection */}
          <div className="form-group">
            <label className="form-label">
              <Cpu size={15} />
              <span>Generation Pipeline Engine</span>
            </label>
            <div className="provider-options">
              <div
                className={`provider-card ${formData.provider === 'smart-engine' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, provider: 'smart-engine' })}
              >
                <div className="provider-badge-rec">Recommended</div>
                <div className="provider-name">Smart Procedural Neural Engine</div>
                <div className="provider-desc">
                  Instantaneous client-side synthesis. Zero API rate limits, guaranteed 100% uptime, zero cold-starts.
                </div>
              </div>

              <div
                className={`provider-card ${formData.provider === 'huggingface' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, provider: 'huggingface' })}
              >
                <div className="provider-name">Hugging Face Spaces (Gradio)</div>
                <div className="provider-desc">
                  Connects to remote Hugging Face text-to-3D Spaces (e.g. TRELLIS / Shap-E / TripoSR).
                </div>
              </div>

              <div
                className={`provider-card ${formData.provider === 'meshy' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, provider: 'meshy' })}
              >
                <div className="provider-name">Meshy.ai Text-to-3D API</div>
                <div className="provider-desc">
                  Generates production-grade PBR 3D meshes with textures via Meshy v4 API.
                </div>
              </div>

              <div
                className={`provider-card ${formData.provider === 'tripo3d' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, provider: 'tripo3d' })}
              >
                <div className="provider-name">Tripo3D Fast Gen API</div>
                <div className="provider-desc">
                  High-speed generative AI text-to-3D pipeline via Tripo3D API.
                </div>
              </div>
            </div>
          </div>

          {/* Hugging Face Settings */}
          {formData.provider === 'huggingface' && (
            <div className="hf-config-section">
              <div className="form-group">
                <label className="form-label">
                  <Key size={15} />
                  <span>Hugging Face User Access Token (Optional)</span>
                </label>
                <input
                  type="password"
                  className="settings-input"
                  placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={formData.hfToken}
                  onChange={(e) => setFormData({ ...formData, hfToken: e.target.value })}
                />
                <span className="field-hint">
                  Required if accessing private or rate-limited spaces.{' '}
                  <a
                    href="https://huggingface.co/settings/tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="link-inline"
                  >
                    Get Token <ExternalLink size={12} />
                  </a>
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Target Hugging Face Space ID</label>
                <input
                  type="text"
                  className="settings-input"
                  placeholder="hysts/Shap-E"
                  value={formData.hfModelSpace}
                  onChange={(e) => setFormData({ ...formData, hfModelSpace: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Meshy Settings */}
          {formData.provider === 'meshy' && (
            <div className="hf-config-section">
              <div className="form-group">
                <label className="form-label">
                  <Key size={15} />
                  <span>Meshy.ai API Key</span>
                </label>
                <input
                  type="password"
                  className="settings-input"
                  placeholder="msy_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={formData.meshyApiKey}
                  onChange={(e) => setFormData({ ...formData, meshyApiKey: e.target.value })}
                />
                <span className="field-hint">
                  Obtain your API key from{' '}
                  <a
                    href="https://www.meshy.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="link-inline"
                  >
                    Meshy.ai Dashboard <ExternalLink size={12} />
                  </a>
                </span>
              </div>
            </div>
          )}

          {/* Tripo3D Settings */}
          {formData.provider === 'tripo3d' && (
            <div className="hf-config-section">
              <div className="form-group">
                <label className="form-label">
                  <Key size={15} />
                  <span>Tripo3D API Key</span>
                </label>
                <input
                  type="password"
                  className="settings-input"
                  placeholder="tsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={formData.tripoApiKey}
                  onChange={(e) => setFormData({ ...formData, tripoApiKey: e.target.value })}
                />
                <span className="field-hint">
                  Obtain your API key from{' '}
                  <a
                    href="https://platform.tripo3d.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="link-inline"
                  >
                    Tripo3D Platform <ExternalLink size={12} />
                  </a>
                </span>
              </div>
            </div>
          )}

          {/* Viewport Preferences */}
          <div className="form-group">
            <label className="form-label">
              <ShieldCheck size={15} />
              <span>Studio Viewport Preferences</span>
            </label>
            <div className="toggle-grid">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={formData.autoRotate}
                  onChange={(e) => setFormData({ ...formData, autoRotate: e.target.checked })}
                />
                <span>Auto-rotate models by default</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={formData.castShadows}
                  onChange={(e) => setFormData({ ...formData, castShadows: e.target.checked })}
                />
                <span>Enable High-Definition Soft Shadow Maps</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={formData.showGrid}
                  onChange={(e) => setFormData({ ...formData, showGrid: e.target.checked })}
                />
                <span>Display Ground Calibration Grid</span>
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
