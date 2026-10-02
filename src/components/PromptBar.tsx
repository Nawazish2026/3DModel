import React, { useState } from 'react';
import { Sparkles, Dices, X, ArrowRight } from 'lucide-react';
import { PRESET_MODELS } from '../data/presets';

interface PromptBarProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  currentPrompt: string;
}

export const PromptBar: React.FC<PromptBarProps> = ({
  onGenerate,
  isGenerating,
  currentPrompt,
}) => {
  const [prevPrompt, setPrevPrompt] = useState(currentPrompt);
  const [prompt, setPrompt] = useState(currentPrompt);

  if (prevPrompt !== currentPrompt) {
    setPrevPrompt(currentPrompt);
    setPrompt(currentPrompt);
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onGenerate(prompt.trim());
    }
  };

  const handleRandomize = () => {
    const randomPreset = PRESET_MODELS[Math.floor(Math.random() * PRESET_MODELS.length)];
    setPrompt(randomPreset.prompt);
  };

  const handleChipClick = (presetPrompt: string) => {
    setPrompt(presetPrompt);
    onGenerate(presetPrompt);
  };

  return (
    <div className="prompt-bar-container">
      <form onSubmit={handleSubmit} className="prompt-input-wrapper">
        <div className="prompt-sparkle-icon">
          <Sparkles size={20} className={isGenerating ? 'spin-slow' : 'glow-pulse'} />
        </div>

        <input
          type="text"
          className="prompt-input"
          placeholder="Describe any 3D model (e.g., 'Cyberpunk hovercar with neon cyan repulsors')..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isGenerating}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        {prompt && !isGenerating && (
          <button
            type="button"
            className="input-tool-btn"
            onClick={() => setPrompt('')}
            title="Clear prompt"
          >
            <X size={16} />
          </button>
        )}

        <button
          type="button"
          className="input-tool-btn"
          onClick={handleRandomize}
          disabled={isGenerating}
          title="Randomize Prompt Idea"
        >
          <Dices size={18} />
        </button>

        <button
          type="submit"
          className={`generate-btn ${isGenerating ? 'generating' : ''}`}
          disabled={!prompt.trim() || isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="spinner-inline" />
              <span>Synthesizing...</span>
            </>
          ) : (
            <>
              <span>Generate 3D</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Preset Chips */}
      <div className="chips-wrapper">
        <span className="chips-label">Quick Ideas:</span>
        <div className="chips-scroll">
          {PRESET_MODELS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset-chip ${prompt === preset.prompt ? 'active' : ''}`}
              onClick={() => handleChipClick(preset.prompt)}
              disabled={isGenerating}
            >
              <span>{preset.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
