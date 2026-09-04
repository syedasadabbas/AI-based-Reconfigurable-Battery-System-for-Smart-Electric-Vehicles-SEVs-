# Battery Configuration Simulator Web App

## Overview
This web application simulates and analyzes battery cell configurations, calculating voltage outputs for all 4,096 possible switch combinations across 4 battery cells. It enables interactive configuration testing, circuit diagram visualization, voltage grouping analysis via charts, result filtering, and data export. Key features include a 3D car simulation powered by battery configurations across diverse road profiles, a Pack Analysis tool with Excel model integration and terrain decoding, and an AI-Monitored Battery Pack Reconfiguration system. The AI system uses LSTM-based machine learning for intelligent cell usage, lifespan extension, and efficiency maximization through dynamic configuration selection and cell resting strategies. The project also includes a comprehensive research summary for academic proposals.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
**Technology Stack:** React 18, TypeScript, Vite, Wouter, TanStack Query.
**UI Framework:** Shadcn UI (built on Radix UI), Tailwind CSS (New York style variant), Lucide-React for icons.
**Key Design Patterns:** Component-based architecture, custom hooks, query-based data fetching, Zod for form validation.
**Core Pages:** Dashboard, interactive Simulation, 3D Car Simulation, Pack Analysis, AI Monitoring, Research Summary, Circuit visualization (SVG-based).

### Backend Architecture
**Server Framework:** Express.js with TypeScript.
**API Design:** RESTful endpoints for configuration management.
**Circuit Calculation Logic:** Graph-based circuit solver determines active cells and calculates total voltage (4V per active cell) by tracking current flow and bypass logic.

### Data Storage Solutions
**Primary Storage:** In-memory Maps for development, PostgreSQL via Drizzle ORM for production.
**Schema Design:** `battery_configurations` (config ID, switch states, voltage, connection type, active cells) and `simulation_sessions`. Switch states are stored as space-separated binary strings.
**Data Migration:** Drizzle Kit for PostgreSQL schema migrations.
**Configuration Data:** 4,096 total possible switch combinations, with 1,573 operational configurations.

### System Design Choices
- **UI/UX:** Accessible, performant components with a consistent design system, unified light theme, professional navigation, optimized contrast, and refined dark mode.
- **Data Flow:** End-to-end type safety from database to UI using Drizzle, Zod, and TanStack Query.
- **Visualization:** Advanced charts (radar, pie, bar) for voltage distribution and connection types, all exportable as PNG.
- **Filtering:** Comprehensive filtering by voltage class and connection type with active filter badges and interactive group filtering.
- **Auto-Run Simulation:** Sequential testing of all 4,096 configurations with progress tracking, pause/resume, and step controls.
- **Car Simulation:** 3D environment using Three.js, GLB models, dynamic environments, and terrain-specific road surfaces. Parses encoded road profiles (11 distinct terrain types) and automatically matches optimal battery configurations to required voltage. Features real-time visual and audio feedback.
- **Export Functionality:** CSV export includes all 12 individual switches, voltage, voltage class, combination type, and active cells, respecting current filters.
- **Pack Analysis:** Loads battery configuration models from XLSX files, parses road profile strings using A-Y terrain encoding (25 terrain types), tracks cell health (activation counts, SoH, SoC) with degradation calculations, and assigns configurations using round-robin for wear distribution. Provides charts for voltage distribution, switch usage, and cell health.
- **AI-Monitored Battery Pack Reconfiguration:** Selectable AI models (LSTM, Linear Regression, Ensemble) for SOC/SOH prediction and optimization. Features intelligent PRE-ANALYSIS system that examines battery SOC and SOH BEFORE configuration selection, with model-specific thresholds: LSTM (conservative: 25% SOC, 65% SOH), Linear Regression (aggressive: 40% SOC, 80% SOH), and Ensemble (balanced: 30% SOC, 70% SOH). Each model makes different resting decisions based on current and predicted cell states. System provides detailed per-cell rest reasons (e.g., "Current SOC 24.5% below threshold 25%"). Includes intelligent configuration selection balancing cell health, wear-leveling, and resting strategies. Features real-time monitoring of all 4 cells, integration with 3D visualization, an analytics dashboard, and segment-by-segment recording of road and cell states. Incorporates authentic physics for SOC depletion, SOH degradation, and recovery during rest.
- **Research Summary:** A 10-tab academic presentation layout detailing abstract, system architecture, literature review (2019-2025, 15+ papers, 3 research streams), circuit logic (Kirchhoff's Laws, graph-based solver), AI strategy (proposed, visual architecture diagram, 5-step workflow, expected insights with citations), results, novelty, enhancements, references, and conclusion. Highlights a complete configuration dataset (4,096 combinations), terrain-encoded road profile decoding (A-Y encoding), a real-time graph-based circuit solver, and an AI-ready framework.

## External Dependencies

**Database & ORM:**
- `@neondatabase/serverless`: Serverless PostgreSQL client.
- `drizzle-orm`: TypeScript ORM.
- `drizzle-zod`: Drizzle schema to Zod validation integration.

**UI Component Libraries:**
- `@radix-ui/*`: Headless accessible component primitives.
- `shadcn/ui`: Pre-built components based on Radix.
- `lucide-react`: Icon library.
- `embla-carousel-react`: Touch-friendly carousel.

**Form & Validation:**
- `react-hook-form`: Form state management.
- `@hookform/resolvers`: Validation resolver.
- `zod`: Schema validation.

**Utilities:**
- `date-fns`: Date formatting.
- `class-variance-authority`: Type-safe CSS variants.
- `clsx` & `tailwind-merge`: Conditional className utilities.

**Development Tools:**
- `vite`: Fast build tool.
- `esbuild`: JavaScript bundler.