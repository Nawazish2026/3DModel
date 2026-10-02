## 🏗️ Architecture & Technical Highlights

```
┌─────────────────────────────────────────────────────────────┐
│                 React 19 + TypeScript UI                    │
│   (PromptBar, ControlsOverlay, ModelInspector, Modals)      │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
       [Text Prompt]                   [User Controls]
               ▼                               ▼
┌─────────────────────────────┐   ┌───────────────────────────┐
│     aiService Pipeline      │   │   Viewer3D (Three.js)     │
│                             │   │                           │
│  ├─ Hugging Face (Gradio)   │──►│  ├─ GLTFLoader Parser     │
│  ├─ Meshy.ai API            │   │  ├─ OrbitControls Camera  │
│  ├─ Tripo3D API             │   │  ├─ 4 Studio Lighting Rigs│
│  └─ Smart Procedural Engine │   │  ├─ Auto-Center & Scale   │
└─────────────────────────────┘   │  ├─ GPU Buffer Disposal   │
                                  │  └─ ResizeObserver Loop   │
                                  └─────────────┬─────────────┘
                                                │
                                        [Export Request]
                                                ▼
                                  ┌───────────────────────────┐
                                  │    exporterService        │
                                  │  ├─ GLTFExporter (.glb)   │
                                  │  ├─ OBJExporter (.obj)    │
                                  │  └─ STLExporter (.stl)    │
                                  └───────────────────────────┘
```

### 1. Robust GPU Resource Lifecycle Management
To prevent WebGL context exhaustion and browser tab crashes during multiple model generations:
- Every geometry buffer (`child.geometry.dispose()`) is explicitly freed.
- Every PBR material and texture map is systematically traversed and disposed.
- Directional light shadow map framebuffers (`light.shadow.map.dispose()`) are released when switching studio lighting presets.
- Viewport size updates are driven by a modern `ResizeObserver` instead of standard window resize listeners.

### 2. Fault-Tolerant Multi-Provider Fallback
Real-world AI 3D APIs often experience GPU queuing, cold starts, or rate limits. VoxelForge 3D implements an automatic fallback:
- If a remote Hugging Face Space or API endpoint times out or lacks GPU capacity, the app gracefully switches to the **Smart Neural-Procedural Generator** without disrupting the user experience or presenting a broken canvas.
- Covers an extensive taxonomy of real-world objects: furniture (chairs, desks, thrones), vessels (ceramic vases, chalices), vehicles (hovercars, void fighters), robotics (combat mechs), weapons/props, and mathematical harmonic knot sculptures.

### 3. Studio Lighting & Viewport Inspection
- **4 Lighting Environments:** Studio Neutral, Sunset Glow, Cyberpunk Neon, and Clay/Topology mode.
- **Wireframe Inspection:** One-click topology debugging toggle.
- **Live Telemetry:** Real-time calculation of vertex counts, triangle counts, bounding dimensions ($X \times Y \times Z$), and active material slots.

---

## ⌨️ Studio Keyboard Shortcuts

| Shortcut | Action |
|:---:|---|
| <kbd>Space</kbd> | Toggle Viewport Auto-Rotate |
| <kbd>W</kbd> | Toggle Wireframe / Topology Mode |
| <kbd>G</kbd> | Toggle Studio Ground Grid |
| <kbd>R</kbd> | Reset Camera to Focal Center |
| <kbd>1</kbd> | Switch to **Studio Neutral** Lighting |
| <kbd>2</kbd> | Switch to **Sunset Glow** Lighting |
| <kbd>3</kbd> | Switch to **Cyberpunk Neon** Lighting |
| <kbd>4</kbd> | Switch to **Clay / Topology** Lighting |

---

## 🛠️ Local Development & Build

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm

### Getting Started

```bash
# Clone the repository
git clone https://github.com/nawazishhassan/3DModelling.git
cd 3DModelling

# Install dependencies
npm install

# Start development server
npm run dev
# Open http://localhost:5173 in your browser

# Run linter
npm run lint

# Production build
npm run build
```


