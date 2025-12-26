# End State Libraries & Versions

Based on source code analysis and system logs from the reconstruction process.

## 1. Core Framework & Build Tool

The End State architecture explicitly relies on **Create React App (CRA)**, not Vite. This was a critical discovery during the routing restoration, as the `setupProxy.js` file (which controls the routing between Frontend, Backend, and Graph Server) is only compatible with CRA/Webpack.

- **Build Tool:** `react-scripts` **v5.0.1**
  - *Evidence:* The logs explicitly confirmed the version: `"react-scripts": "5.0.1"` and confirmed the `start` script runs `react-scripts start`.
- **Framework:** **React** (Likely v18.x)
  - *Evidence:* Implied by the usage of `react-scripts` v5 and the functional component syntax (hooks like `useMemo`, `useEffect`) used in `NeoGraph.tsx`.
- **Language:** **TypeScript**
  - *Evidence:* All critical components (`ControlTower.tsx`, `NeoGraph.tsx`) utilize TypeScript interfaces (e.g., `interface NeoGraphProps`) and strict typing.

## 2. Visualization Libraries

The "Rectangles," "Dual Lens," and "Topology" visuals rely on two specific libraries.

- **Charts & HUD:** **Recharts**
  - *Used In:* `DualLensHUD.tsx` (Control Tower).
  - *Evidence:* The component imports `RadarChart`, `PolarGrid`, `PolarAngleAxis`, `ResponsiveContainer` from `'recharts'` to render the internal/external metric overlays.
- **Graph Topology:** **react-force-graph**
  - *Used In:* `NeoGraph.tsx` (Dependency Desk) and `RiskTopologyMap.tsx`.
  - *Evidence:* The code imports both `react-force-graph-3d` and `react-force-graph-2d` to support the hybrid view toggle.

## 3. Icons & UI

- **Icons:** **lucide-react**
  - *Evidence:* `NeoGraph.tsx` imports `Maximize2` and `Minimize2` icons from `lucide-react` for the 2D/3D toggle buttons.
- **Styling:** **CSS Modules / Standard CSS**
  - *Evidence:* The platform relies on global stylesheets like `josoor.css` (migrated from `josoor-v2.css`) rather than a CSS-in-JS library (like styled-components). The logs confirm standard CSS class usage (e.g., `.v2-panel`).

## 4. Backend & Runtime (End State)

- **Graph Server Runtime:** **tsx** (TypeScript Execute)
  - *Evidence:* The process list shows the Graph Server (Port 3001) running via `tsx --watch index-dev.ts`.
- **Main Backend:** **Python / FastAPI**
  - *Evidence:* The logs reference `uvicorn` and `main.py` running on Port 8008.
- **Node Version:** **v22.18.0**
  - *Evidence:* The active node process running the stack is explicitly listed as version 22.18.0.

## Summary Table

| Category | Library/Tool | Version/Notes | Source |
|----------|--------------|---------------|---------|
| **Build** | `react-scripts` | **5.0.1** (Strict requirement for `setupProxy.js`) | package.json |
| **Language** | `TypeScript` | Standard TSX implementation | *.tsx files |
| **Charts** | `recharts` | Used for Radar/Bar charts in Control Tower | DualLensHUD.tsx |
| **Graph** | `react-force-graph` | Supports 2D/3D modes in Dependency Desk | NeoGraph.tsx |
| **Icons** | `lucide-react` | Used for UI controls | NeoGraph.tsx |
| **Runtime** | `tsx` | Used to run the Graph Server | process list |

## Critical Notes

1. **React Version Mismatch:** Current package.json has React 19, but End State expects React 18.x (compatible with react-scripts v5.0.1)
2. **Recharts TypeScript Issue:** The PolarAngleAxis error is caused by React 19 type incompatibility with Recharts
3. **Build Tool:** Must use react-scripts, NOT Vite
