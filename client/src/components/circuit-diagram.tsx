import { Card, CardContent } from "@/components/ui/card";
import { GitBranch } from "lucide-react";

interface CircuitDiagramProps {
  switches: boolean[];
  currentConfig: {
    voltage: number;
    activeCells: number;
  };
  activeCellsSet?: Set<number>;
}

export default function CircuitDiagram({ switches, currentConfig, activeCellsSet = new Set() }: CircuitDiagramProps) {
  // Parse switches: R1A, R1B, R1C, R2A, R2B, R2C, R3A, R3B, R3C, R4A, R4B, R4C
  const [R1A, R1B, R1C, R2A, R2B, R2C, R3A, R3B, R3C, R4A, R4B, R4C] = switches;

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <GitBranch className="text-primary mr-2" size={24} />
          Circuit Diagram - Battery Pack Configuration
        </h2>
        
        <div className="bg-muted rounded-lg p-4">
          <svg viewBox="0 0 7000 3400" className="w-full h-auto" preserveAspectRatio="xMidYMid meet" data-testid="circuit-diagram">
            
            {/* Energy Source at bottom center */}
            <g id="energy-source">
              <rect x="2900" y="2700" width="800" height="500" rx="32" 
                className="fill-card stroke-primary stroke-28"/>
              <text x="3300" y="2900" textAnchor="middle" className="fill-primary font-bold" style={{ fontSize: '96px' }}>
                Energy Source
              </text>
              
              {/* Positive terminal (right side) */}
              <circle cx="3700" cy="2950" r="48" className="fill-blue-600"/>
              <text x="3820" y="2980" textAnchor="start" className="fill-blue-600 font-bold" style={{ fontSize: '80px' }}>+</text>
              
              {/* Negative terminal (left side) */}
              <circle cx="2900" cy="2950" r="48" className="fill-red-600"/>
              <text x="2780" y="2980" textAnchor="end" className="fill-red-600 font-bold" style={{ fontSize: '80px' }}>−</text>
            </g>

            {/* RA series bus - ES+ flows through R1A → R2A → R3A → R4A in series (BOTTOM) */}
            <g id="ra-series-bus">
              <text x="500" y="2830" className="fill-blue-600 font-bold" style={{ fontSize: '68px' }}>RA Bus (series)</text>
              
              {/* ES+ to R1A - THICKER */}
              <line x1="3700" y1="2950" x2="1000" y2="2950"
                className="stroke-blue-600 stroke-40"/>
              <text x="2300" y="2880" textAnchor="middle" className="fill-blue-600 font-bold" style={{ fontSize: '64px' }}>ES+</text>
            </g>

            {/* RB series bus - flows through R1B → R2B → R3B → R4B in series (TOP) */}
            <g id="rb-series-bus">
              <text x="500" y="380" className="fill-amber-600 font-bold" style={{ fontSize: '68px' }}>RB Bus (series)</text>
            </g>

            {/* Battery Cells - V1, V2, V3, V4 arranged horizontally */}
            {[
              { num: 1, x: 1200 },
              { num: 2, x: 2600 },
              { num: 3, x: 4000 },
              { num: 4, x: 5400 },
            ].map((cell) => {
              const { num, x } = cell;
              const isActive = activeCellsSet.has(num);
              const y = 1300;
              const cellCenterX = x;

              const RA = switches[(num - 1) * 3];
              const RB = switches[(num - 1) * 3 + 1];
              const RC = switches[(num - 1) * 3 + 2];

              return (
                <g key={num} id={`cell-${num}`}>
                  {/* Battery Cell */}
                  <rect 
                    x={x - 300} 
                    y={y} 
                    width="600" 
                    height="500" 
                    rx="36"
                    className={`stroke-28 ${
                      isActive 
                        ? 'fill-primary stroke-primary' 
                        : 'fill-gray-100 dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600'
                    }`}/>
                  
                  <text 
                    x={cellCenterX} 
                    y={y + 280} 
                    textAnchor="middle" 
                    className={`font-bold ${
                      isActive 
                        ? 'fill-primary-foreground' 
                        : 'fill-muted-foreground'
                    }`}
                    style={{ fontSize: '200px' }}>
                    V{num}
                  </text>
                  <text x={cellCenterX} y={y + 410} textAnchor="middle" className={isActive ? 'fill-primary-foreground' : 'fill-muted-foreground'} style={{ fontSize: '80px' }}>4V</text>

                  {/* Positive terminal (top) */}
                  <circle cx={cellCenterX} cy={y} r="40" className={isActive ? 'fill-red-500' : 'fill-gray-400'}/>
                  <text x={cellCenterX} y={y - 55} textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '76px' }}>+</text>

                  {/* Negative terminal (bottom) */}
                  <circle cx={cellCenterX} cy={y + 500} r="40" className={isActive ? 'fill-blue-500' : 'fill-gray-400'}/>
                  <text x={cellCenterX} y={y + 600} textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '76px' }}>−</text>

                  {/* RA switch - INLINE in series bus (BOTTOM), with tap to cell - */}
                  <g>
                    {/* Incoming line to RA switch - THICKER */}
                    {num === 1 ? (
                      <line x1="1000" y1="2950" x2={cellCenterX - 240} y2="2950"
                        className="stroke-blue-600 stroke-40"/>
                    ) : (
                      <line x1={x - 1400} y1="2950" x2={cellCenterX - 240} y2="2950"
                        className="stroke-blue-600 stroke-40"/>
                    )}
                    
                    {/* RA switch inline in bus */}
                    <circle cx={cellCenterX - 170} cy="2950" r="75"
                      className={`stroke-white stroke-14 ${RA ? 'fill-green-500' : 'fill-gray-500'}`}
                      data-testid={`circuit-switch-${num}a`}/>
                    <text x={cellCenterX - 170} y="3140" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '76px' }}>
                      R{num}A
                    </text>

                    {/* Outgoing line from RA switch to next switch - THICKER */}
                    {num < 4 && (
                      <line x1={cellCenterX - 95} y1="2950" x2={cellCenterX + 1000} y2="2950"
                        className="stroke-blue-600 stroke-40"/>
                    )}

                    {/* Tap from RA switch to cell - terminal - THICKER */}
                    <line x1={cellCenterX - 170} y1="2875" x2={cellCenterX - 170} y2="2200"
                      className={`${RA ? 'stroke-blue-500' : 'stroke-gray-300'} stroke-32`}/>
                    <line x1={cellCenterX - 170} y1="2200" x2={cellCenterX} y2="2200"
                      className={`${RA ? 'stroke-blue-500' : 'stroke-gray-300'} stroke-32`}/>
                    <line x1={cellCenterX} y1="2200" x2={cellCenterX} y2={y + 500}
                      className={`${RA ? 'stroke-blue-500' : 'stroke-gray-300'} stroke-32`}/>
                  </g>

                  {/* Cell + terminal connects upward - THICKER */}
                  <line x1={cellCenterX} y1={y} x2={cellCenterX} y2="950"
                    className="stroke-foreground stroke-32"/>

                  {/* Junction point AT cell + (where RB and RC meet) */}
                  <circle cx={cellCenterX} cy="950" r="36" className="fill-foreground"/>

                  {/* RB switch - INLINE in series bus (TOP), with tap to cell + junction */}
                  <g>
                    {/* Tap from RB switch to cell + junction - THICKER */}
                    <line x1={cellCenterX + 170} y1="640" x2={cellCenterX + 170} y2="950"
                      className={`${RB ? 'stroke-amber-500' : 'stroke-gray-300'} stroke-32`}/>
                    <line x1={cellCenterX + 170} y1="950" x2={cellCenterX} y2="950"
                      className={`${RB ? 'stroke-amber-500' : 'stroke-gray-300'} stroke-32`}/>

                    {/* Incoming line to RB switch - THICKER */}
                    {num === 1 ? (
                      <line x1="500" y1="560" x2={cellCenterX + 95} y2="560"
                        className="stroke-amber-500 stroke-40"/>
                    ) : (
                      <line x1={x - 1400} y1="560" x2={cellCenterX + 95} y2="560"
                        className="stroke-amber-500 stroke-40"/>
                    )}

                    {/* RB switch inline in bus */}
                    <circle cx={cellCenterX + 170} cy="560" r="75"
                      className={`stroke-white stroke-14 ${RB ? 'fill-green-500' : 'fill-gray-500'}`}
                      data-testid={`circuit-switch-${num}b`}/>
                    <text x={cellCenterX + 170} y="400" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '76px' }}>
                      R{num}B
                    </text>

                    {/* Outgoing line from RB switch to next switch - THICKER */}
                    {num < 4 && (
                      <line x1={cellCenterX + 245} y1="560" x2={cellCenterX + 1000} y2="560"
                        className="stroke-amber-500 stroke-40"/>
                    )}
                  </g>

                  {/* RC switches: AT cell + junction, connect to next cell - */}
                  {num < 4 && (
                    <g>
                      {/* Horizontal line from junction to RC switch - THICKER */}
                      <line x1={cellCenterX} y1="950" x2={cellCenterX + 400} y2="950"
                        className="stroke-foreground stroke-32"/>
                      
                      {/* RC switch AT the junction level */}
                      <circle cx={cellCenterX + 400} cy="950" r="75"
                        className={`stroke-white stroke-14 ${RC ? 'fill-green-500' : 'fill-gray-500'}`}
                        data-testid={`circuit-switch-${num}c`}/>
                      <text x={cellCenterX + 400} y="830" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '76px' }}>
                        R{num}C
                      </text>
                      
                      {/* Line from RC switch to next cell - terminal - THICKER */}
                      <line x1={cellCenterX + 475} y1="950" x2={cellCenterX + 1000} y2="950"
                        className={`${RC ? 'stroke-primary' : 'stroke-gray-400'} stroke-32`}/>
                      <line x1={cellCenterX + 1000} y1="950" x2={cellCenterX + 1000} y2={y + 500}
                        className={`${RC ? 'stroke-primary' : 'stroke-gray-400'} stroke-32`}/>
                      <line x1={cellCenterX + 1000} y1={y + 500} x2={cellCenterX + 1400} y2={y + 500}
                        className={`${RC ? 'stroke-primary' : 'stroke-gray-400'} stroke-32`}/>
                    </g>
                  )}

                  {/* R4C special case: connects V4+ junction to ES- */}
                  {num === 4 && (
                    <g>
                      {/* Horizontal line from junction to RC switch - THICKER */}
                      <line x1={cellCenterX} y1="950" x2={cellCenterX + 400} y2="950"
                        className="stroke-foreground stroke-32"/>
                      
                      {/* RC switch AT the junction level */}
                      <circle cx={cellCenterX + 400} cy="950" r="75"
                        className={`stroke-white stroke-14 ${RC ? 'fill-green-500' : 'fill-gray-500'}`}
                        data-testid="circuit-switch-4c"/>
                      <text x={cellCenterX + 400} y="830" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" style={{ fontSize: '76px' }}>R4C</text>
                      
                      {/* Line from RC switch down and left to ES- - THICKER */}
                      <line x1={cellCenterX + 400} y1="1025" x2={cellCenterX + 400} y2="2450"
                        className={`${RC ? 'stroke-red-500' : 'stroke-gray-400'} stroke-32`}/>
                      <line x1={cellCenterX + 400} y1="2450" x2="2900" y2="2450"
                        className={`${RC ? 'stroke-red-500' : 'stroke-gray-400'} stroke-32`}/>
                      <line x1="2900" y1="2450" x2="2900" y2="2950"
                        className={`${RC ? 'stroke-red-500' : 'stroke-gray-400'} stroke-40`}/>
                      <text x="3050" y="2500" className="fill-red-600 font-bold" style={{ fontSize: '68px' }}>ES−</text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Output display */}
            <g id="output">
              <rect x="200" y="100" width="900" height="650" rx="40" 
                className="fill-card stroke-primary stroke-28"/>
              <text x="650" y="350" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-semibold" style={{ fontSize: '96px' }}>
                Output VT
              </text>
              <text x="650" y="600" textAnchor="middle" className="fill-primary font-bold" style={{ fontSize: '210px' }}>
                {currentConfig.voltage.toFixed(1)}V
              </text>
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
