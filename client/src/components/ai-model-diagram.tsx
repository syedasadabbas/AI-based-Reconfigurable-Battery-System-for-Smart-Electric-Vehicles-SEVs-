import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Database, Cpu, Target, Repeat, TrendingUp, Zap, BarChart3, Layers } from "lucide-react";
import { AIModelType } from "@shared/schema";

interface AIModelDiagramProps {
  modelType?: AIModelType;
}

export default function AIModelDiagram({ modelType = AIModelType.LSTM }: AIModelDiagramProps) {
  const getLSTMDiagram = () => (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6">
      <svg viewBox="0 0 1400 900" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" className="fill-gray-600 dark:fill-gray-400" />
          </marker>
          <linearGradient id="lstm-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="data-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="config-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        <text x="700" y="40" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '32px' }}>
          LSTM Neural Network Model
        </text>
        <text x="700" y="70" textAnchor="middle" className="fill-gray-600 dark:fill-gray-400" style={{ fontSize: '16px' }}>
          Advanced pattern recognition with memory gates • Best accuracy • Highest confidence
        </text>

        <g id="step1">
          <rect x="50" y="100" width="280" height="140" rx="12" fill="url(#data-gradient)" opacity="0.9" />
          <text x="190" y="140" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '20px' }}>
            1. Data Collection
          </text>
          <text x="190" y="170" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Cell SOC/SOH
          </text>
          <text x="190" y="192" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Usage history
          </text>
          <text x="190" y="214" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Distance traveled
          </text>
        </g>

        <line x1="330" y1="170" x2="420" y2="170" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="3" markerEnd="url(#arrowhead)" />

        <g id="step2">
          <rect x="420" y="100" width="280" height="140" rx="12" fill="url(#lstm-gradient)" opacity="0.9" />
          <text x="560" y="140" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '20px' }}>
            2. LSTM Gates
          </text>
          <text x="560" y="170" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Forget Gate (σ)
          </text>
          <text x="560" y="192" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Input Gate (σ)
          </text>
          <text x="560" y="214" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Output Gate (tanh)
          </text>
        </g>

        <line x1="700" y1="170" x2="790" y2="170" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="3" markerEnd="url(#arrowhead)" />

        <g id="step3">
          <rect x="790" y="100" width="280" height="140" rx="12" fill="url(#config-gradient)" opacity="0.9" />
          <text x="930" y="140" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '20px' }}>
            3. Predictions
          </text>
          <text x="930" y="170" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • SOC with patterns
          </text>
          <text x="930" y="192" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • SOH degradation
          </text>
          <text x="930" y="214" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • High confidence
          </text>
        </g>

        <g id="lstm-detail">
          <text x="700" y="300" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '24px' }}>
            LSTM Cell Architecture
          </text>

          <rect x="350" y="320" width="700" height="220" rx="8" className="fill-purple-100 dark:fill-purple-900 stroke-purple-600 dark:stroke-purple-400" strokeWidth="2" />

          <circle cx="400" cy="430" r="30" className="fill-blue-500 stroke-blue-700" strokeWidth="2" />
          <text x="400" y="438" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '14px' }}>X_t</text>
          <text x="400" y="480" textAnchor="middle" className="fill-gray-700 dark:fill-gray-300" style={{ fontSize: '12px' }}>Input</text>

          <rect x="490" y="340" width="90" height="50" rx="6" className="fill-red-500 stroke-red-700" strokeWidth="2" />
          <text x="535" y="370" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '12px' }}>Forget</text>
          <text x="535" y="415" textAnchor="middle" className="fill-gray-700 dark:fill-gray-300" style={{ fontSize: '10px' }}>σ(W_f)</text>

          <rect x="490" y="410" width="90" height="50" rx="6" className="fill-green-500 stroke-green-700" strokeWidth="2" />
          <text x="535" y="440" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '12px' }}>Input</text>
          <text x="535" y="485" textAnchor="middle" className="fill-gray-700 dark:fill-gray-300" style={{ fontSize: '10px' }}>σ(W_i)</text>

          <rect x="650" y="410" width="100" height="50" rx="6" className="fill-purple-600 stroke-purple-800" strokeWidth="2" />
          <text x="700" y="430" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '12px' }}>Cell</text>
          <text x="700" y="448" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '12px' }}>State C_t</text>

          <rect x="490" y="480" width="90" height="50" rx="6" className="fill-blue-500 stroke-blue-700" strokeWidth="2" />
          <text x="535" y="510" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '12px' }}>Output</text>

          <circle cx="850" cy="430" r="30" className="fill-amber-500 stroke-amber-700" strokeWidth="2" />
          <text x="850" y="438" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '14px' }}>H_t</text>
          <text x="850" y="480" textAnchor="middle" className="fill-gray-700 dark:fill-gray-300" style={{ fontSize: '12px' }}>Hidden</text>

          <line x1="430" y1="430" x2="490" y2="365" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="430" y1="430" x2="490" y2="435" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="430" y1="430" x2="490" y2="505" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="580" y1="365" x2="650" y2="425" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="580" y1="435" x2="650" y2="435" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="750" y1="435" x2="820" y2="430" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="2" markerEnd="url(#arrowhead)" />
        </g>

        <g id="benefits">
          <text x="700" y="590" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '20px' }}>
            LSTM Model Characteristics
          </text>

          <rect x="180" y="610" width="280" height="100" rx="8" className="fill-purple-100 dark:fill-purple-900 stroke-purple-600 dark:stroke-purple-400" strokeWidth="2" />
          <text x="320" y="640" textAnchor="middle" className="fill-purple-800 dark:fill-purple-200 font-bold" style={{ fontSize: '14px' }}>
            Memory-Based Learning
          </text>
          <text x="320" y="665" textAnchor="middle" className="fill-purple-700 dark:fill-purple-300" style={{ fontSize: '12px' }}>
            Remembers past patterns
          </text>
          <text x="320" y="685" textAnchor="middle" className="fill-purple-700 dark:fill-purple-300" style={{ fontSize: '12px' }}>
            Adapts to usage trends
          </text>

          <rect x="540" y="610" width="280" height="100" rx="8" className="fill-blue-100 dark:fill-blue-900 stroke-blue-600 dark:stroke-blue-400" strokeWidth="2" />
          <text x="680" y="640" textAnchor="middle" className="fill-blue-800 dark:fill-blue-200 font-bold" style={{ fontSize: '14px' }}>
            95-98% Confidence
          </text>
          <text x="680" y="665" textAnchor="middle" className="fill-blue-700 dark:fill-blue-300" style={{ fontSize: '12px' }}>
            Highest accuracy
          </text>
          <text x="680" y="685" textAnchor="middle" className="fill-blue-700 dark:fill-blue-300" style={{ fontSize: '12px' }}>
            Best for complex scenarios
          </text>

          <rect x="900" y="610" width="280" height="100" rx="8" className="fill-green-100 dark:fill-green-900 stroke-green-600 dark:stroke-green-400" strokeWidth="2" />
          <text x="1040" y="640" textAnchor="middle" className="fill-green-800 dark:fill-green-200 font-bold" style={{ fontSize: '14px' }}>
            Optimized Configuration
          </text>
          <text x="1040" y="665" textAnchor="middle" className="fill-green-700 dark:fill-green-300" style={{ fontSize: '12px' }}>
            Smart cell rotation
          </text>
          <text x="1040" y="685" textAnchor="middle" className="fill-green-700 dark:fill-green-300" style={{ fontSize: '12px' }}>
            Extends battery life +20%
          </text>
        </g>
      </svg>
    </div>
  );

  const getLinearRegressionDiagram = () => (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6">
      <svg viewBox="0 0 1400 700" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrowhead-lr" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" className="fill-gray-600 dark:fill-gray-400" />
          </marker>
          <linearGradient id="lr-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        <text x="700" y="40" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '32px' }}>
          Linear Regression Model
        </text>
        <text x="700" y="70" textAnchor="middle" className="fill-gray-600 dark:fill-gray-400" style={{ fontSize: '16px' }}>
          Simple physics-based calculations • Fast performance • Baseline comparison
        </text>

        <g id="lr-step1">
          <rect x="150" y="120" width="280" height="160" rx="12" fill="url(#lr-gradient)" opacity="0.9" />
          <text x="290" y="160" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '20px' }}>
            1. Input Data
          </text>
          <text x="290" y="195" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Current SOC
          </text>
          <text x="290" y="220" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Current SOH
          </text>
          <text x="290" y="245" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Distance
          </text>
          <text x="290" y="270" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Resting state
          </text>
        </g>

        <line x1="430" y1="200" x2="520" y2="200" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="3" markerEnd="url(#arrowhead-lr)" />

        <g id="lr-step2">
          <rect x="520" y="120" width="360" height="160" rx="12" fill="#059669" opacity="0.9" />
          <text x="700" y="160" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '20px' }}>
            2. Linear Calculations
          </text>
          <text x="700" y="195" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            SOC_predicted = SOC - (0.5 × distance)
          </text>
          <text x="700" y="220" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            SOH_predicted = SOH - (0.01 × distance)
          </text>
          <text x="700" y="245" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            If resting: SOC += (2.0 × distance)
          </text>
          <text x="700" y="270" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            Simple, deterministic formulas
          </text>
        </g>

        <line x1="880" y1="200" x2="970" y2="200" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="3" markerEnd="url(#arrowhead-lr)" />

        <g id="lr-step3">
          <rect x="970" y="120" width="280" height="160" rx="12" fill="url(#lr-gradient)" opacity="0.9" />
          <text x="1110" y="160" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '20px' }}>
            3. Output
          </text>
          <text x="1110" y="195" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Predicted SOC
          </text>
          <text x="1110" y="220" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Predicted SOH
          </text>
          <text x="1110" y="245" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • 75% confidence
          </text>
          <text x="1110" y="270" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Fast results
          </text>
        </g>

        <g id="lr-formula">
          <text x="700" y="360" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '24px' }}>
            Mathematical Formulation
          </text>

          <rect x="200" y="380" width="1000" height="180" rx="8" className="fill-green-100 dark:fill-green-900 stroke-green-600 dark:stroke-green-400" strokeWidth="2" />

          <text x="700" y="425" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '18px' }}>
            Active Mode (Discharging):
          </text>
          <text x="700" y="455" textAnchor="middle" className="fill-gray-700 dark:fill-gray-300" style={{ fontSize: '16px' }}>
            SOC(t+1) = max(0, SOC(t) - SOC_REDUCTION_RATE × distance)
          </text>
          <text x="700" y="480" textAnchor="middle" className="fill-gray-700 dark:fill-gray-300" style={{ fontSize: '16px' }}>
            SOH(t+1) = max(0, SOH(t) - SOH_REDUCTION_RATE × distance)
          </text>

          <text x="700" y="520" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '18px' }}>
            Resting Mode (Recovering):
          </text>
          <text x="700" y="550" textAnchor="middle" className="fill-gray-700 dark:fill-gray-300" style={{ fontSize: '16px' }}>
            SOC(t+1) = min(100, SOC(t) + REST_RECOVERY_RATE × distance × 0.1)
          </text>
        </g>

        <g id="lr-characteristics">
          <rect x="100" y="600" width="320" height="80" rx="8" className="fill-blue-100 dark:fill-blue-900 stroke-blue-600 dark:stroke-blue-400" strokeWidth="2" />
          <text x="260" y="635" textAnchor="middle" className="fill-blue-800 dark:fill-blue-200 font-bold" style={{ fontSize: '14px' }}>
            ⚡ Fastest Performance
          </text>
          <text x="260" y="660" textAnchor="middle" className="fill-blue-700 dark:fill-blue-300" style={{ fontSize: '12px' }}>
            Instant predictions, no complex computations
          </text>

          <rect x="540" y="600" width="320" height="80" rx="8" className="fill-amber-100 dark:fill-amber-900 stroke-amber-600 dark:stroke-amber-400" strokeWidth="2" />
          <text x="700" y="635" textAnchor="middle" className="fill-amber-800 dark:fill-amber-200 font-bold" style={{ fontSize: '14px' }}>
            📊 75% Confidence
          </text>
          <text x="700" y="660" textAnchor="middle" className="fill-amber-700 dark:fill-amber-300" style={{ fontSize: '12px' }}>
            Good baseline, less adaptive to patterns
          </text>

          <rect x="980" y="600" width="320" height="80" rx="8" className="fill-purple-100 dark:fill-purple-900 stroke-purple-600 dark:stroke-purple-400" strokeWidth="2" />
          <text x="1140" y="635" textAnchor="middle" className="fill-purple-800 dark:fill-purple-200 font-bold" style={{ fontSize: '14px' }}>
            🔧 Baseline Model
          </text>
          <text x="1140" y="660" textAnchor="middle" className="fill-purple-700 dark:fill-purple-300" style={{ fontSize: '12px' }}>
            Simple approach for comparison
          </text>
        </g>
      </svg>
    </div>
  );

  const getEnsembleDiagram = () => (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6">
      <svg viewBox="0 0 1400 800" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrowhead-ensemble" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" className="fill-gray-600 dark:fill-gray-400" />
          </marker>
          <linearGradient id="ensemble-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        <text x="700" y="40" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '32px' }}>
          Ensemble Model (LSTM + Linear Regression)
        </text>
        <text x="700" y="70" textAnchor="middle" className="fill-gray-600 dark:fill-gray-400" style={{ fontSize: '16px' }}>
          Combines both models • Balanced approach • 70% LSTM + 30% Linear Regression
        </text>

        <g id="ensemble-input">
          <rect x="200" y="120" width="280" height="140" rx="12" fill="#3b82f6" opacity="0.9" />
          <text x="340" y="160" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '20px' }}>
            Input Data
          </text>
          <text x="340" y="190" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Cell states
          </text>
          <text x="340" y="215" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Usage history
          </text>
          <text x="340" y="240" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            • Distance
          </text>
        </g>

        <line x1="480" y1="160" x2="550" y2="220" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="3" markerEnd="url(#arrowhead-ensemble)" />
        <line x1="480" y1="220" x2="550" y2="380" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="3" markerEnd="url(#arrowhead-ensemble)" />

        <g id="lstm-branch">
          <rect x="550" y="150" width="280" height="140" rx="12" fill="#9333ea" opacity="0.9" />
          <text x="690" y="190" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '20px' }}>
            LSTM Model
          </text>
          <text x="690" y="220" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            Complex patterns
          </text>
          <text x="690" y="245" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            High accuracy
          </text>
          <text x="690" y="270" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '16px' }}>
            Weight: 70%
          </text>
        </g>

        <g id="lr-branch">
          <rect x="550" y="310" width="280" height="140" rx="12" fill="#10b981" opacity="0.9" />
          <text x="690" y="350" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '20px' }}>
            Linear Regression
          </text>
          <text x="690" y="380" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            Simple physics
          </text>
          <text x="690" y="405" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            Fast baseline
          </text>
          <text x="690" y="430" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '16px' }}>
            Weight: 30%
          </text>
        </g>

        <line x1="830" y1="220" x2="900" y2="300" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="3" markerEnd="url(#arrowhead-ensemble)" />
        <line x1="830" y1="380" x2="900" y2="320" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="3" markerEnd="url(#arrowhead-ensemble)" />

        <g id="ensemble-combine">
          <rect x="900" y="240" width="280" height="140" rx="12" fill="url(#ensemble-gradient)" opacity="0.9" />
          <text x="1040" y="280" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '20px' }}>
            Weighted Average
          </text>
          <text x="1040" y="310" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            SOC = 0.7×LSTM + 0.3×LR
          </text>
          <text x="1040" y="335" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            SOH = 0.7×LSTM + 0.3×LR
          </text>
          <text x="1040" y="360" textAnchor="middle" className="fill-white" style={{ fontSize: '14px' }}>
            Confidence combined
          </text>
        </g>

        <g id="ensemble-formula">
          <text x="700" y="500" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '24px' }}>
            Ensemble Strategy
          </text>

          <rect x="200" y="520" width="1000" height="120" rx="8" className="fill-amber-100 dark:fill-amber-900 stroke-amber-600 dark:stroke-amber-400" strokeWidth="2" />

          <text x="700" y="560" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '18px' }}>
            Weighted Combination Formula:
          </text>
          <text x="700" y="590" textAnchor="middle" className="fill-gray-700 dark:fill-gray-300" style={{ fontSize: '16px' }}>
            Prediction_final = (LSTM_prediction × 0.7) + (LinearRegression_prediction × 0.3)
          </text>
          <text x="700" y="620" textAnchor="middle" className="fill-gray-700 dark:fill-gray-300 italic" style={{ fontSize: '14px' }}>
            Benefits from LSTM's pattern recognition while maintaining LR's stability
          </text>
        </g>

        <g id="ensemble-characteristics">
          <rect x="100" y="680" width="360" height="80" rx="8" className="fill-purple-100 dark:fill-purple-900 stroke-purple-600 dark:stroke-purple-400" strokeWidth="2" />
          <text x="280" y="715" textAnchor="middle" className="fill-purple-800 dark:fill-purple-200 font-bold" style={{ fontSize: '14px' }}>
            🎯 Best of Both Worlds
          </text>
          <text x="280" y="740" textAnchor="middle" className="fill-purple-700 dark:fill-purple-300" style={{ fontSize: '12px' }}>
            Combines LSTM accuracy with LR stability
          </text>

          <rect x="520" y="680" width="360" height="80" rx="8" className="fill-blue-100 dark:fill-blue-900 stroke-blue-600 dark:stroke-blue-400" strokeWidth="2" />
          <text x="700" y="715" textAnchor="middle" className="fill-blue-800 dark:fill-blue-200 font-bold" style={{ fontSize: '14px' }}>
            📈 85-90% Confidence
          </text>
          <text x="700" y="740" textAnchor="middle" className="fill-blue-700 dark:fill-blue-300" style={{ fontSize: '12px' }}>
            Balanced accuracy and robustness
          </text>

          <rect x="940" y="680" width="360" height="80" rx="8" className="fill-green-100 dark:fill-green-900 stroke-green-600 dark:stroke-green-400" strokeWidth="2" />
          <text x="1120" y="715" textAnchor="middle" className="fill-green-800 dark:fill-green-200 font-bold" style={{ fontSize: '14px' }}>
            ⚖️ Robust Predictions
          </text>
          <text x="1120" y="740" textAnchor="middle" className="fill-green-700 dark:fill-green-300" style={{ fontSize: '12px' }}>
            Reduces overfitting, stable performance
          </text>
        </g>
      </svg>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {modelType === AIModelType.LSTM && <Brain className="w-5 h-5 text-purple-600" />}
          {modelType === AIModelType.LINEAR_REGRESSION && <BarChart3 className="w-5 h-5 text-green-600" />}
          {modelType === AIModelType.ENSEMBLE && <Layers className="w-5 h-5 text-amber-600" />}
          {modelType === AIModelType.LSTM && "LSTM Neural Network Architecture"}
          {modelType === AIModelType.LINEAR_REGRESSION && "Linear Regression Model"}
          {modelType === AIModelType.ENSEMBLE && "Ensemble Model Architecture"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {modelType === AIModelType.LSTM && getLSTMDiagram()}
        {modelType === AIModelType.LINEAR_REGRESSION && getLinearRegressionDiagram()}
        {modelType === AIModelType.ENSEMBLE && getEnsembleDiagram()}
      </CardContent>
    </Card>
  );
}
