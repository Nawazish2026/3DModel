import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { Viewer3D } from './components/Viewer3D';
import { ControlsOverlay } from './components/ControlsOverlay';
import { PromptBar } from './components/PromptBar';
import { ModelInspector } from './components/ModelInspector';
import { GenerationModal } from './components/GenerationModal';
import { SettingsModal } from './components/SettingsModal';
import { InfoModal } from './components/InfoModal';
import { Toast, type ToastMessage } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { generate3DModel, calculateModelMetrics } from './services/aiService';
import { generateProceduralModel } from './services/proceduralGenerator';
import { exportModel } from './services/exporterService';
import type {
  AISettings,
  ExportFormat,
  GenerationStage,
  LightingPreset,
  ModelMetadata,
  ViewerControlsAPI,
} from './types/3d';
import './App.css';

export const App: React.FC = () => {
  // Settings & Configuration
  const [settings, setSettings] = useState<AISettings>(() => {
    const userDefaultToken = (import.meta.env.VITE_HF_TOKEN as string) || '';

    const saved = localStorage.getItem('voxelforge_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.hfModelSpace === 'JeffreyXiang/TRELLIS' || parsed.provider === 'smart-engine') {
          parsed.hfModelSpace = 'hysts/Shap-E';
          parsed.provider = 'huggingface';
        }
        if (!parsed.hfToken) {
          parsed.hfToken = userDefaultToken;
        }
        return parsed;
      } catch {
        // Fall through
      }
    }
    return {
      provider: 'huggingface',
      hfModelSpace: 'hysts/Shap-E',
      hfToken: userDefaultToken,
      meshyApiKey: '',
      tripoApiKey: '',
      generationQuality: 'balanced',
      autoRotate: true,
      castShadows: true,
      showGrid: true,
    };
  });

  const initialPrompt = 'Sleek futuristic cyberpunk hovercar with neon cyan repulsors';

  // Active 3D Model State
  const [currentModel, setCurrentModel] = useState<THREE.Group | null>(() => {
    return generateProceduralModel(initialPrompt);
  });
  const [metadata, setMetadata] = useState<ModelMetadata | null>(() => {
    const obj = generateProceduralModel(initialPrompt);
    return calculateModelMetrics(obj, initialPrompt, 'procedural');
  });

  // Viewport Settings State
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('studio');
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(settings.autoRotate);
  const [showGrid, setShowGrid] = useState<boolean>(settings.showGrid);

  // Generation Pipeline State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [stage, setStage] = useState<GenerationStage>('idle');
  const [stageMessage, setStageMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [activePrompt, setActivePrompt] = useState<string>(initialPrompt);

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Modals & Notifications
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Viewer Controls Bridge
  const viewerControlsRef = useRef<ViewerControlsAPI | null>(null);

  // Toast Helpers with unmount safety
  const addToast = useCallback((type: 'success' | 'warning' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimersRef.current = toastTimersRef.current.filter((t) => t !== timer);
    }, 4500);
    toastTimersRef.current.push(timer);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((t) => clearTimeout(t));
      toastTimersRef.current = [];
    };
  }, []);

  // Save Settings to LocalStorage
  const handleSaveSettings = (newSettings: AISettings) => {
    setSettings(newSettings);
    setAutoRotate(newSettings.autoRotate);
    setShowGrid(newSettings.showGrid);
    localStorage.setItem('voxelforge_settings', JSON.stringify(newSettings));
    addToast('success', 'Settings Saved', 'AI engine and viewport configurations updated.');
  };

  // Keyboard Shortcuts for 3D Studio Viewport
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        isSettingsOpen ||
        isInfoOpen
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setAutoRotate((prev) => !prev);
      } else if (e.code === 'KeyW') {
        setWireframe((prev) => !prev);
      } else if (e.code === 'KeyG') {
        setShowGrid((prev) => !prev);
      } else if (e.code === 'KeyR') {
        viewerControlsRef.current?.resetCamera();
        addToast('info', 'Camera Reset', 'Camera centered on model focal point.');
      } else if (e.key === '1') {
        setLightingPreset('studio');
      } else if (e.key === '2') {
        setLightingPreset('sunset');
      } else if (e.key === '3') {
        setLightingPreset('cyberpunk');
      } else if (e.key === '4') {
        setLightingPreset('clay');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, isInfoOpen, addToast]);

  // Generation Handler
  const handleGenerate = async (prompt: string) => {
    if (!prompt.trim() || isGenerating) return;

    setActivePrompt(prompt);
    setIsGenerating(true);
    setStage('analyzing');
    setProgress(5);
    setStageMessage('Starting 3D neural synthesis pipeline...');

    try {
      const result = await generate3DModel(prompt, settings, (nextStage, msg, pct) => {
        setStage(nextStage);
        setStageMessage(msg);
        setProgress(pct);
      });

      setCurrentModel(result.object);
      setMetadata(result.metadata);

      if (result.warningMessage) {
        addToast('warning', 'Notice', result.warningMessage);
      } else {
        addToast('success', 'Model Generated!', `“${result.metadata.name}” rendered in WebGL viewport.`);
      }

      // Celebratory micro-burst
      try {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#38bdf8', '#818cf8', '#a855f7'],
        });
      } catch {
        // ignore if window is resizing
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to complete 3D generation.';
      console.error('Generation failed:', error);
      addToast('warning', 'Synthesis Error', errorMsg);
    } finally {
      setIsGenerating(false);
      setStage('idle');
      setProgress(0);
    }
  };

  // Export 3D Model
  const handleExport = async (format: ExportFormat) => {
    if (!currentModel || isExporting) return;

    setIsExporting(true);
    try {
      const modelName = metadata?.name || 'model';
      await exportModel(currentModel, format, modelName);
      addToast('success', 'Export Complete', `Successfully downloaded ${modelName}.${format}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Could not export 3D geometry.';
      console.error('Export error:', err);
      addToast('warning', 'Export Failed', errMsg);
    } finally {
      setIsExporting(false);
    }
  };

  // Viewport Control Actions
  const handleResetCamera = () => {
    viewerControlsRef.current?.resetCamera();
    addToast('info', 'Camera Reset', 'Camera centered on model focal point.');
  };

  const handleCaptureScreenshot = () => {
    viewerControlsRef.current?.captureScreenshot(`${metadata?.name || '3d-model'}-screenshot.png`);
    addToast('success', 'Screenshot Captured', 'High-definition viewport snapshot downloaded.');
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInfo={() => setIsInfoOpen(true)}
        provider={settings.provider === 'smart-engine' ? 'Smart Neural Engine' : 'Hugging Face API'}
      />

      {/* Main 3D WebGL Viewport */}
      <main className="viewport-area">
        <ErrorBoundary
          fallbackTitle="3D Viewport Render Error"
          onReset={() => {
            const fallbackPrompt = 'Sleek futuristic cyberpunk hovercar';
            const fallbackObj = generateProceduralModel(fallbackPrompt);
            setCurrentModel(fallbackObj);
            setMetadata(calculateModelMetrics(fallbackObj, fallbackPrompt, 'procedural'));
          }}
        >
          <Viewer3D
            model={currentModel}
            lightingPreset={lightingPreset}
            wireframe={wireframe}
            autoRotate={autoRotate}
            showGrid={showGrid}
            onControlsReady={(api) => {
              viewerControlsRef.current = api;
            }}
          />
        </ErrorBoundary>

        {/* Viewport Floating Controls */}
        <ControlsOverlay
          lightingPreset={lightingPreset}
          onSelectLighting={setLightingPreset}
          wireframe={wireframe}
          onToggleWireframe={() => setWireframe(!wireframe)}
          autoRotate={autoRotate}
          onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onResetCamera={handleResetCamera}
          onCaptureScreenshot={handleCaptureScreenshot}
          onExport={handleExport}
          isExporting={isExporting}
        />

        {/* Model Telemetry Inspector */}
        <ModelInspector metadata={metadata} />
      </main>

      {/* Prompt Input & Suggestion Chips */}
      <PromptBar
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        currentPrompt={activePrompt}
      />

      {/* Generation Progress Modal */}
      <GenerationModal
        isOpen={isGenerating}
        stage={stage}
        message={stageMessage}
        progress={progress}
        prompt={activePrompt}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Info / Architecture Modal */}
      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
