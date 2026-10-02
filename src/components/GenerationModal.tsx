import React from 'react';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import type { GenerationStage } from '../types/3d';

interface GenerationModalProps {
  isOpen: boolean;
  stage: GenerationStage;
  message: string;
  progress: number;
  prompt: string;
}

export const GenerationModal: React.FC<GenerationModalProps> = ({
  isOpen,
  stage,
  message,
  progress,
  prompt,
}) => {
  if (!isOpen) return null;

  const steps = [
    { id: 'analyzing', title: 'Prompt Semantics & Tokenization' },
    { id: 'diffusion', title: '3D Latent Field Synthesis' },
    { id: 'meshing', title: 'Manifold Iso-surface Meshing' },
    { id: 'texturing', title: 'PBR Shading & GLB Assembly' },
  ];

  const getStepStatus = (stepId: string) => {
    const order = ['analyzing', 'diffusion', 'meshing', 'texturing', 'optimizing', 'ready'];
    const currentIndex = order.indexOf(stage);
    const stepIndex = order.indexOf(stepId);

    if (currentIndex > stepIndex || stage === 'ready') return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="modal-backdrop">
      <div className="generation-modal-card">
        {/* Animated 3D Hologram Cube */}
        <div className="hologram-cube-wrap">
          <div className="hologram-cube">
            <div className="cube-face front" />
            <div className="cube-face back" />
            <div className="cube-face right" />
            <div className="cube-face left" />
            <div className="cube-face top" />
            <div className="cube-face bottom" />
          </div>
          <Sparkles className="hologram-sparkle" size={24} />
        </div>

        <div className="modal-header-content">
          <h3 className="modal-title">Synthesizing 3D Model</h3>
          <p className="modal-prompt-preview">“{prompt}”</p>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>
          <div className="progress-labels">
            <span className="progress-msg">{message}</span>
            <span className="progress-pct">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Multi-step Pipeline Timeline */}
        <div className="pipeline-steps">
          {steps.map((s) => {
            const status = getStepStatus(s.id);
            return (
              <div key={s.id} className={`pipeline-step-item ${status}`}>
                <div className="step-icon-wrap">
                  {status === 'completed' ? (
                    <CheckCircle2 size={16} className="text-emerald" />
                  ) : status === 'active' ? (
                    <Loader2 size={16} className="spin-fast text-cyan" />
                  ) : (
                    <div className="step-dot" />
                  )}
                </div>
                <span className="step-title">{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
