import { useEffect, useRef } from 'react';
import type { RoadProfile, RoadSegment, SceneType, SurfaceType } from '@shared/schema';
import carImage from '@assets/carrr-removebg-preview_1759536122142.png';

interface FPSCarRendererProps {
  roadProfile: RoadProfile;
  currentSegmentIndex: number;
  distanceInSegment: number;
  speed: number;
  voltage: number;
  activeCells: number;
  configId?: string;
}

export function FPSCarRenderer({
  roadProfile,
  currentSegmentIndex,
  distanceInSegment,
  speed,
  voltage,
  activeCells,
  configId,
}: FPSCarRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const rendererRef = useRef<FPSRenderer | null>(null);
  
  // Store props in refs to avoid recreating render loop
  const propsRef = useRef({
    roadProfile,
    currentSegmentIndex,
    distanceInSegment,
    speed,
    voltage,
    activeCells,
    configId,
  });

  // Update refs when props change
  useEffect(() => {
    propsRef.current = {
      roadProfile,
      currentSegmentIndex,
      distanceInSegment,
      speed,
      voltage,
      activeCells,
      configId,
    };
  }, [roadProfile, currentSegmentIndex, distanceInSegment, speed, voltage, activeCells, configId]);

  // Stable initialization and render loop (empty deps)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        if (rendererRef.current) {
          rendererRef.current.updateDimensions(canvas.width, canvas.height);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    rendererRef.current = new FPSRenderer(ctx, canvas.width, canvas.height);

    const render = () => {
      const props = propsRef.current;
      if (rendererRef.current) {
        rendererRef.current.clear();
        rendererRef.current.drawScene(
          props.roadProfile,
          props.currentSegmentIndex,
          props.distanceInSegment,
          props.speed,
          props.voltage,
          props.activeCells,
          props.configId
        );
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []); // Empty deps - stable loop

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
}

class FPSRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private roadWidth: number = 400;
  private horizonY: number;
  private environmentCache: Map<string, any> = new Map();
  private lastFrameTime: number = 0;
  private lastStateDistance: number = 0;
  private lastStateSegment: number = 0;
  private interpolatedDistance: number = 0;
  private carImageElement: HTMLImageElement | null = null;
  private carImageLoaded: boolean = false;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.horizonY = height * 0.35; // Horizon line at 35% from top
    this.initializeEnvironmentCache();
    this.lastFrameTime = performance.now();
    this.loadCarImage();
  }

  private loadCarImage() {
    this.carImageElement = new Image();
    this.carImageElement.onload = () => {
      this.carImageLoaded = true;
    };
    this.carImageElement.src = carImage;
  }

  updateDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.horizonY = height * 0.35;
    this.initializeEnvironmentCache();
  }

  // Pre-generate deterministic environment elements
  private initializeEnvironmentCache() {
    this.environmentCache.clear();
    
    // Cache building positions and heights
    const buildings = [];
    for (let i = 0; i < 8; i++) {
      buildings.push({
        height: 60 + (i * 17) % 80, // Deterministic height
        offset: i * 150,
      });
    }
    this.environmentCache.set('buildings', buildings);

    // Cache tree positions
    const trees = [];
    for (let i = 0; i < 10; i++) {
      trees.push({
        offset: i * 150,
      });
    }
    this.environmentCache.set('trees', trees);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawScene(
    roadProfile: RoadProfile,
    currentSegmentIndex: number,
    distanceInSegment: number,
    speed: number,
    voltage: number,
    activeCells: number,
    configId?: string
  ) {
    const currentSegment = roadProfile.segments[currentSegmentIndex];
    if (!currentSegment) return;

    // Calculate frame delta time for smooth interpolation
    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = now;

    // Detect state updates (segment change or distance jump)
    const segmentChanged = currentSegmentIndex !== this.lastStateSegment;
    const stateUpdated = distanceInSegment !== this.lastStateDistance;

    if (segmentChanged || (stateUpdated && Math.abs(distanceInSegment - this.lastStateDistance) > 1)) {
      // Discrete state update detected - reset interpolation to match state
      this.interpolatedDistance = distanceInSegment;
      this.lastStateDistance = distanceInSegment;
      this.lastStateSegment = currentSegmentIndex;
    } else {
      // Smooth interpolation between state updates
      if (speed > 0) {
        const frameIncrement = speed * deltaTime * 10; // Scale for visible motion
        this.interpolatedDistance += frameIncrement;
      }
      // Keep track of state for next comparison
      this.lastStateDistance = distanceInSegment;
      this.lastStateSegment = currentSegmentIndex;
    }

    // Use interpolated distance for smooth scrolling
    const smoothDistance = this.interpolatedDistance;

    // Store current segment for car animation
    (this as any).currentSegmentForAnimation = currentSegment;

    // Draw layers from back to front
    this.drawSky(roadProfile.sceneType);
    this.drawEnvironment(roadProfile.sceneType, smoothDistance);
    this.drawRoad(currentSegment, roadProfile.segments, currentSegmentIndex, smoothDistance);
    this.drawCar();
    this.drawHUD(speed, voltage, activeCells, configId, currentSegment);
  }

  private drawSky(sceneType: SceneType) {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.horizonY);

    switch (sceneType) {
      case 'highway':
        gradient.addColorStop(0, '#87CEEB'); // Sky blue
        gradient.addColorStop(1, '#E0F6FF'); // Lighter blue at horizon
        break;
      case 'city':
      case 'urban':
        gradient.addColorStop(0, '#7C9CBF'); // Urban sky
        gradient.addColorStop(1, '#C8D8E4'); // Hazy horizon
        break;
      case 'mountain':
        gradient.addColorStop(0, '#4A90E2'); // Mountain sky
        gradient.addColorStop(1, '#B8D4E8'); // Lighter at horizon
        break;
      case 'desert':
        gradient.addColorStop(0, '#F4E4C1'); // Desert sky
        gradient.addColorStop(1, '#FFE5B4'); // Sandy horizon
        break;
      case 'rural':
        gradient.addColorStop(0, '#87CEEB'); // Clear sky
        gradient.addColorStop(1, '#D4E9F7'); // Horizon
        break;
    }

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.horizonY);

    // Ground/environment fill
    const groundColor = this.getGroundColor(sceneType);
    this.ctx.fillStyle = groundColor;
    this.ctx.fillRect(0, this.horizonY, this.width, this.height - this.horizonY);
  }

  private getGroundColor(sceneType: SceneType): string {
    switch (sceneType) {
      case 'highway': return '#7CB342'; // Green grass
      case 'city': return '#78909C'; // Gray urban
      case 'urban': return '#90A4AE'; // Light gray
      case 'mountain': return '#795548'; // Brown earth
      case 'desert': return '#DEB887'; // Sand
      case 'rural': return '#8BC34A'; // Bright green
      default: return '#7CB342';
    }
  }

  private drawEnvironment(sceneType: SceneType, distanceOffset: number) {
    // Parallax background elements
    const offset = distanceOffset * 2; // Parallax effect

    switch (sceneType) {
      case 'city':
      case 'urban':
        this.drawBuildings(offset, sceneType === 'city');
        break;
      case 'highway':
        this.drawHighwayElements(offset);
        break;
      case 'mountain':
        this.drawMountains(offset);
        break;
      case 'desert':
        this.drawDesertElements(offset);
        break;
      case 'rural':
        this.drawRuralElements(offset);
        break;
    }
  }

  private drawBuildings(offset: number, dense: boolean) {
    const buildings = this.environmentCache.get('buildings') || [];
    const buildingWidth = 80;
    const count = dense ? 8 : 4;

    for (let i = 0; i < count; i++) {
      const building = buildings[i % buildings.length];
      const x = ((building.offset + offset * 3) % this.width);
      const height = building.height;
      const buildingY = this.horizonY - height;

      // Left side building
      this.ctx.fillStyle = '#546E7A';
      this.ctx.fillRect(50 + x, buildingY, buildingWidth, height);
      this.ctx.strokeStyle = '#37474F';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(50 + x, buildingY, buildingWidth, height);

      // Windows (deterministic grid)
      this.ctx.fillStyle = '#FFA726';
      const rows = Math.floor(height / 15);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < 4; col++) {
          this.ctx.fillRect(
            60 + x + col * 15,
            buildingY + 10 + row * 15,
            8,
            8
          );
        }
      }

      // Right side building
      this.ctx.fillStyle = '#455A64';
      this.ctx.fillRect(this.width - 150 - x, buildingY + 20, buildingWidth, height - 20);
      this.ctx.strokeStyle = '#37474F';
      this.ctx.strokeRect(this.width - 150 - x, buildingY + 20, buildingWidth, height - 20);
    }
  }

  private drawHighwayElements(offset: number) {
    const trees = this.environmentCache.get('trees') || [];
    const treeHeight = 40;
    const treeY = this.horizonY - treeHeight;

    trees.forEach((tree: any) => {
      const x = (tree.offset + offset * 3) % this.width;

      // Left tree
      this.ctx.fillStyle = '#5D4037';
      this.ctx.fillRect(80 + x, treeY + 20, 8, 20);
      this.ctx.fillStyle = '#4CAF50';
      this.ctx.beginPath();
      this.ctx.arc(84 + x, treeY + 10, 15, 0, Math.PI * 2);
      this.ctx.fill();

      // Right tree
      this.ctx.fillStyle = '#5D4037';
      this.ctx.fillRect(this.width - 100 - x, treeY + 20, 8, 20);
      this.ctx.fillStyle = '#4CAF50';
      this.ctx.beginPath();
      this.ctx.arc(this.width - 96 - x, treeY + 10, 15, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  private drawMountains(offset: number) {
    // Draw mountain silhouettes (deterministic sine wave)
    this.ctx.fillStyle = '#5D4037';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.horizonY);
    
    const segments = Math.ceil(this.width / 100) + 1;
    for (let i = 0; i < segments; i++) {
      const x = i * 100;
      const adjustedX = x - (offset / 2);
      const peakHeight = 80 + Math.sin(adjustedX * 0.01) * 40;
      this.ctx.lineTo(adjustedX, this.horizonY - peakHeight);
      this.ctx.lineTo(adjustedX + 100, this.horizonY - peakHeight + 30);
    }
    
    this.ctx.lineTo(this.width, this.horizonY);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawDesertElements(offset: number) {
    // Draw cacti
    for (let i = 0; i < 6; i++) {
      const x = (i * 200 + offset * 4) % this.width;
      this.ctx.fillStyle = '#2E7D32';
      this.ctx.fillRect(100 + x, this.horizonY - 30, 12, 30);
      this.ctx.fillRect(106 + x, this.horizonY - 20, 8, -8);
    }
  }

  private drawRuralElements(offset: number) {
    // Draw fence posts
    for (let i = 0; i < 20; i++) {
      const x = (i * 80 + offset * 5) % this.width;
      this.ctx.fillStyle = '#795548';
      this.ctx.fillRect(70 + x, this.horizonY - 15, 4, 15);
      this.ctx.fillRect(this.width - 80 - x, this.horizonY - 15, 4, 15);
    }
  }

  private drawRoad(
    currentSegment: RoadSegment,
    allSegments: RoadSegment[],
    currentIndex: number,
    distanceInSegment: number
  ) {
    const centerX = this.width / 2;
    
    // Draw upcoming road segments for perspective
    const lookAheadSegments = 3;
    for (let i = 0; i < lookAheadSegments; i++) {
      const segmentIndex = currentIndex + i;
      if (segmentIndex >= allSegments.length) break;

      const segment = allSegments[segmentIndex];
      const isCurrentSegment = i === 0;
      const progress = isCurrentSegment ? distanceInSegment / segment.distance : 0;

      this.drawRoadSegment(
        segment,
        i,
        progress,
        centerX,
        currentSegment.curveAngle
      );
    }

    // Draw lane markings
    this.drawLaneMarkings(currentSegment, distanceInSegment);
  }

  private drawRoadSegment(
    segment: RoadSegment,
    depth: number,
    progress: number,
    centerX: number,
    curveAngle: number
  ) {
    // Calculate perspective scaling - REDUCED for straighter road
    const nearY = this.height * (0.65 + depth * 0.1);
    const farY = this.height * (0.4 + depth * 0.08);
    const nearWidth = this.roadWidth * (1 - depth * 0.05); // Much less taper
    const farWidth = this.roadWidth * (0.95 - depth * 0.05); // Straighter road

    // Apply curve offset
    const curveOffset = (curveAngle / 90) * 100 * (1 + depth * 0.5);

    // Draw road surface with texture
    const roadColor = this.getRoadSurfaceColor(segment.surface);
    this.ctx.fillStyle = roadColor;
    
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - nearWidth / 2 + curveOffset, nearY);
    this.ctx.lineTo(centerX + nearWidth / 2 + curveOffset, nearY);
    this.ctx.lineTo(centerX + farWidth / 2 + curveOffset / 2, farY);
    this.ctx.lineTo(centerX - farWidth / 2 + curveOffset / 2, farY);
    this.ctx.closePath();
    this.ctx.fill();

    // Add road texture pattern
    if (depth === 0) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (let i = 0; i < 5; i++) {
        const y = nearY - i * 20;
        this.ctx.fillRect(centerX - nearWidth / 2 + curveOffset, y, nearWidth, 1);
      }
    }

    // Road edges with white lines
    this.ctx.strokeStyle = '#FFF';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - nearWidth / 2 + curveOffset, nearY);
    this.ctx.lineTo(centerX - farWidth / 2 + curveOffset / 2, farY);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(centerX + nearWidth / 2 + curveOffset, nearY);
    this.ctx.lineTo(centerX + farWidth / 2 + curveOffset / 2, farY);
    this.ctx.stroke();

    // Outer road edges (darker)
    this.ctx.strokeStyle = '#222';
    this.ctx.lineWidth = 6;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - nearWidth / 2 + curveOffset - 3, nearY);
    this.ctx.lineTo(centerX - farWidth / 2 + curveOffset / 2 - 3, farY);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(centerX + nearWidth / 2 + curveOffset + 3, nearY);
    this.ctx.lineTo(centerX + farWidth / 2 + curveOffset / 2 + 3, farY);
    this.ctx.stroke();

    // Incline/decline visual indicator (darker/lighter shading)
    if (segment.grade !== 0) {
      const gradeAlpha = Math.abs(segment.grade) / 30 * 0.3;
      this.ctx.fillStyle = segment.grade > 0 
        ? `rgba(0, 0, 0, ${gradeAlpha})` 
        : `rgba(255, 255, 255, ${gradeAlpha})`;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - nearWidth / 2 + curveOffset, nearY);
      this.ctx.lineTo(centerX + nearWidth / 2 + curveOffset, nearY);
      this.ctx.lineTo(centerX + farWidth / 2 + curveOffset / 2, farY);
      this.ctx.lineTo(centerX - farWidth / 2 + curveOffset / 2, farY);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  private getRoadSurfaceColor(surface: SurfaceType): string {
    switch (surface) {
      case 'smooth': return '#3A3A3A'; // Darker asphalt
      case 'rough': return '#4A4A4A'; // Worn asphalt
      case 'gravel': return '#8D6E63'; // Gravel
      case 'dirt': return '#A1887F'; // Dirt road
      default: return '#3A3A3A';
    }
  }

  private drawLaneMarkings(segment: RoadSegment, distanceInSegment: number) {
    const centerX = this.width / 2;
    const dashLength = 40;
    const dashGap = 30;
    const offset = (distanceInSegment * 10) % (dashLength + dashGap);

    this.ctx.strokeStyle = '#FFF';
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([dashLength, dashGap]);
    this.ctx.lineDashOffset = offset;

    this.ctx.beginPath();
    this.ctx.moveTo(centerX, this.height * 0.6);
    this.ctx.lineTo(centerX, this.height * 0.9);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  private drawCar() {
    const centerX = this.width / 2;
    const carY = this.height * 0.7;

    if (this.carImageLoaded && this.carImageElement) {
      // Calculate car dimensions to maintain aspect ratio - ENLARGED
      const carWidth = 200; // Much larger for better visibility
      const aspectRatio = this.carImageElement.height / this.carImageElement.width;
      const carHeight = carWidth * aspectRatio;

      // Save context for transformations
      this.ctx.save();

      // Move to car center for rotation
      this.ctx.translate(centerX, carY + carHeight / 2);

      // Apply rotation based on current segment (stored from drawScene)
      const currentSeg = (this as any).currentSegmentForAnimation;
      if (currentSeg) {
        // Tilt for turns
        const tiltAngle = (currentSeg.curveAngle / 90) * 0.15; // Slight tilt for turns
        this.ctx.rotate(tiltAngle);

        // Vertical tilt for inclines/declines
        const pitchOffset = (currentSeg.grade / 30) * 10; // Visual pitch effect
        this.ctx.translate(0, pitchOffset);
      }

      // Car shadow (drawn first, under the car)
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.beginPath();
      this.ctx.ellipse(0, carHeight / 2 + 10, carWidth / 2, carWidth / 4, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw the car image centered
      this.ctx.drawImage(
        this.carImageElement,
        -carWidth / 2,
        -carHeight / 2,
        carWidth,
        carHeight
      );

      // Restore context
      this.ctx.restore();
    } else {
      // Fallback: simple car drawing while image loads
      const carWidth = 80;
      const carLength = 120;

      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.beginPath();
      this.ctx.ellipse(centerX, carY + carLength / 2 + 10, carWidth / 2, carLength / 3, 0, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillRect(centerX - carWidth / 2, carY, carWidth, carLength);
    }
  }

  private drawHUD(
    speed: number,
    voltage: number,
    activeCells: number,
    configId?: string,
    segment?: RoadSegment
  ) {
    // Semi-transparent HUD background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(10, 10, 250, 140);

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 16px monospace';
    
    // Speed display
    this.ctx.fillText(`SPEED: ${speed.toFixed(1)} m/s`, 20, 35);
    
    // Voltage display with color
    const voltageColor = voltage >= 12 ? '#F44336' : voltage >= 8 ? '#FFA726' : '#4CAF50';
    this.ctx.fillStyle = voltageColor;
    this.ctx.fillText(`POWER: ${voltage}V`, 20, 60);
    
    // Active cells
    this.ctx.fillStyle = '#FFF';
    this.ctx.fillText(`CELLS: ${activeCells}/4`, 20, 85);
    
    // Configuration
    if (configId) {
      this.ctx.fillText(`CONFIG: ${configId}`, 20, 110);
    }

    // Terrain indicator
    if (segment) {
      this.ctx.fillStyle = '#00BCD4';
      this.ctx.fillText(`TERRAIN: ${segment.terrainName}`, 20, 135);
    }

    // Speedometer circle (top right)
    const speedoX = this.width - 100;
    const speedoY = 80;
    const speedoRadius = 60;

    this.ctx.strokeStyle = '#FFF';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(speedoX, speedoY, speedoRadius, 0.75 * Math.PI, 2.25 * Math.PI);
    this.ctx.stroke();

    // Speed needle
    const maxSpeed = 20;
    const speedAngle = 0.75 * Math.PI + (Math.min(speed, maxSpeed) / maxSpeed) * 1.5 * Math.PI;
    this.ctx.strokeStyle = voltageColor;
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(speedoX, speedoY);
    this.ctx.lineTo(
      speedoX + Math.cos(speedAngle) * (speedoRadius - 10),
      speedoY + Math.sin(speedAngle) * (speedoRadius - 10)
    );
    this.ctx.stroke();

    // Center dot
    this.ctx.fillStyle = voltageColor;
    this.ctx.beginPath();
    this.ctx.arc(speedoX, speedoY, 5, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
