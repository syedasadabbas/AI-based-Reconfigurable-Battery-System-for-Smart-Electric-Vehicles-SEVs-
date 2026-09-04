import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { RoadProfile, RoadSegment, SceneType } from '@shared/schema';
import carImage from '@assets/carrr-removebg-preview_1759536122142.png';

interface ThreeJSCarRendererProps {
  roadProfile: RoadProfile;
  currentSegmentIndex: number;
  distanceInSegment: number;
  speed: number;
  voltage: number;
  activeCells: number;
  configId?: string;
}

export function ThreeJSCarRenderer({
  roadProfile,
  currentSegmentIndex,
  distanceInSegment,
  speed,
  voltage,
  activeCells,
  configId
}: ThreeJSCarRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ThreeCarRenderer | null>(null);
  const [webGLError, setWebGLError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const canvas = document.createElement('canvas');
    containerRef.current.appendChild(canvas);

    try {
      const renderer = new ThreeCarRenderer(canvas);
      rendererRef.current = renderer;

      const animate = () => {
        if (rendererRef.current) {
          rendererRef.current.render(
            roadProfile,
            currentSegmentIndex,
            distanceInSegment,
            speed,
            voltage,
            activeCells,
            configId
          );
        }
        requestAnimationFrame(animate);
      };
      animate();

      const handleResize = () => {
        if (rendererRef.current && containerRef.current) {
          rendererRef.current.resize(
            containerRef.current.clientWidth,
            containerRef.current.clientHeight
          );
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        rendererRef.current?.dispose();
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      };
    } catch (error) {
      setWebGLError(error instanceof Error ? error.message : 'WebGL not supported');
      console.warn('ThreeJS renderer failed:', error);
      return;
    }
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateProps(
        roadProfile,
        currentSegmentIndex,
        distanceInSegment,
        speed,
        voltage,
        activeCells,
        configId
      );
    }
  }, [roadProfile, currentSegmentIndex, distanceInSegment, speed, voltage, activeCells, configId]);

  if (webGLError) {
    return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 text-white"
        data-testid="threejs-webgl-error"
      >
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl">🚗</div>
          <h3 className="text-2xl font-bold">3D Rendering Unavailable</h3>
          <p className="text-slate-300 max-w-md">
            WebGL is not supported in your browser or environment. 
            The 3D car simulation requires WebGL for rendering.
          </p>
          <p className="text-sm text-slate-400">
            Try using a modern browser with WebGL enabled, or view this page in a non-headless environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      data-testid="threejs-car-renderer"
    />
  );
}

class ThreeCarRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private road: THREE.Group;
  private car: THREE.Group;
  private environment: THREE.Group;
  private carTexture: THREE.Texture | null = null;
  private textureLoader: THREE.TextureLoader;
  
  private lastStateDistance: number = 0;
  private lastStateSegment: number = -1;
  private interpolatedDistance: number = 0;
  private lastFrameTime: number = 0;

  private roadProfile: RoadProfile | null = null;
  private currentSegmentIndex: number = 0;
  private speed: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 2.5, 5);
    this.camera.lookAt(0, 1, -10);

    try {
      this.renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true,
        alpha: false,
        failIfMajorPerformanceCaveat: false
      });
      
      const width = canvas.parentElement?.clientWidth || window.innerWidth;
      const height = canvas.parentElement?.clientHeight || window.innerHeight;
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(window.devicePixelRatio);
    } catch (error) {
      throw new Error('Failed to create WebGL context. WebGL may not be supported in this environment.');
    }

    this.road = new THREE.Group();
    this.car = new THREE.Group();
    this.environment = new THREE.Group();
    
    this.scene.add(this.road);
    this.scene.add(this.car);
    this.scene.add(this.environment);

    this.textureLoader = new THREE.TextureLoader();
    this.loadCarTexture();
    this.setupLighting();
    this.createCar();
    
    this.lastFrameTime = performance.now();
  }

  private loadCarTexture() {
    this.textureLoader.load(carImage, (texture) => {
      this.carTexture = texture;
      this.createCar();
    });
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x545454, 0.5);
    this.scene.add(hemisphereLight);
  }

  private createCar() {
    this.car.clear();

    if (this.carTexture) {
      const carGeometry = new THREE.PlaneGeometry(3, 2);
      const carMaterial = new THREE.MeshBasicMaterial({ 
        map: this.carTexture, 
        transparent: true,
        side: THREE.DoubleSide
      });
      const carMesh = new THREE.Mesh(carGeometry, carMaterial);
      carMesh.rotation.x = -Math.PI / 2;
      carMesh.position.y = 0.1;
      this.car.add(carMesh);

      const shadowGeometry = new THREE.CircleGeometry(1.5, 32);
      const shadowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x000000, 
        transparent: true, 
        opacity: 0.3 
      });
      const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.01;
      this.car.add(shadow);
    } else {
      const carBody = new THREE.BoxGeometry(1.5, 0.8, 3);
      const carMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
      const carMesh = new THREE.Mesh(carBody, carMaterial);
      carMesh.position.y = 0.4;
      this.car.add(carMesh);
    }

    this.car.position.set(0, 0, 0);
  }

  private createRoad(roadProfile: RoadProfile) {
    this.road.clear();

    const roadSegments = 30;
    const segmentLength = 5;
    const roadWidth = 8;

    let accumulatedZ = -5;

    for (let i = 0; i < roadSegments; i++) {
      const segIdx = Math.min(this.currentSegmentIndex + i, roadProfile.segments.length - 1);
      const segment = roadProfile.segments[segIdx];

      const roadGeometry = new THREE.PlaneGeometry(roadWidth, segmentLength);
      const roadMaterial = new THREE.MeshStandardMaterial({ 
        color: this.getRoadColor(segment),
        roughness: 0.8,
        metalness: 0.2
      });
      
      const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
      roadMesh.rotation.x = -Math.PI / 2;
      
      const curveOffset = (segment.curveAngle / 90) * (i * 0.5);
      const gradeOffset = (segment.grade / 30) * (i * 0.3);
      
      roadMesh.position.set(curveOffset, gradeOffset, accumulatedZ);
      this.road.add(roadMesh);

      this.addRoadMarkings(roadWidth, segmentLength, accumulatedZ, curveOffset, gradeOffset);
      
      accumulatedZ -= segmentLength;
    }
  }

  private addRoadMarkings(roadWidth: number, segmentLength: number, z: number, xOffset: number, yOffset: number) {
    const lineGeometry = new THREE.BoxGeometry(0.2, 0.05, segmentLength);
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

    const leftLine = new THREE.Mesh(lineGeometry, lineMaterial);
    leftLine.position.set(-roadWidth / 2 + xOffset, yOffset + 0.05, z);
    this.road.add(leftLine);

    const rightLine = new THREE.Mesh(lineGeometry, lineMaterial);
    rightLine.position.set(roadWidth / 2 + xOffset, yOffset + 0.05, z);
    this.road.add(rightLine);

    const dashCount = 5;
    const dashLength = segmentLength / dashCount / 2;
    for (let i = 0; i < dashCount; i++) {
      const dashGeometry = new THREE.BoxGeometry(0.15, 0.05, dashLength);
      const dash = new THREE.Mesh(dashGeometry, lineMaterial);
      dash.position.set(xOffset, yOffset + 0.05, z - segmentLength / 2 + i * (segmentLength / dashCount) + dashLength / 2);
      this.road.add(dash);
    }
  }

  private createEnvironment(sceneType: SceneType) {
    this.environment.clear();

    const skyColor = this.getSkyColor(sceneType);
    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.Fog(skyColor, 50, 150);

    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: this.getGroundColor(sceneType),
      roughness: 1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    this.environment.add(ground);

    switch (sceneType) {
      case 'city':
      case 'urban':
        this.addBuildings();
        break;
      case 'highway':
      case 'rural':
        this.addTrees();
        break;
      case 'mountain':
        this.addMountains();
        break;
      case 'desert':
        this.addCacti();
        break;
    }
  }

  private addBuildings() {
    const buildingPositions = [
      [-15, 0, -30], [-15, 0, -60], [-15, 0, -90],
      [15, 0, -30], [15, 0, -60], [15, 0, -90]
    ];

    buildingPositions.forEach((pos, idx) => {
      const height = 10 + (idx % 3) * 5;
      const geometry = new THREE.BoxGeometry(8, height, 8);
      const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const building = new THREE.Mesh(geometry, material);
      building.position.set(pos[0], height / 2, pos[2]);
      this.environment.add(building);
    });
  }

  private addTrees() {
    const treePositions = [
      [-12, 0, -20], [-12, 0, -40], [-12, 0, -70], [-12, 0, -100],
      [12, 0, -30], [12, 0, -50], [12, 0, -80], [12, 0, -110]
    ];

    treePositions.forEach(pos => {
      const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 4);
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(pos[0], 2, pos[2]);
      this.environment.add(trunk);

      const foliageGeometry = new THREE.ConeGeometry(2, 4, 8);
      const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.set(pos[0], 5, pos[2]);
      this.environment.add(foliage);
    });
  }

  private addMountains() {
    const mountainPositions = [
      [-40, 0, -80], [40, 0, -80], [-30, 0, -120], [35, 0, -120]
    ];

    mountainPositions.forEach(pos => {
      const geometry = new THREE.ConeGeometry(15, 30, 4);
      const material = new THREE.MeshStandardMaterial({ color: 0x696969 });
      const mountain = new THREE.Mesh(geometry, material);
      mountain.position.set(pos[0], 15, pos[2]);
      this.environment.add(mountain);
    });
  }

  private addCacti() {
    const cactiPositions = [
      [-10, 0, -25], [-10, 0, -55], [-10, 0, -85],
      [10, 0, -35], [10, 0, -65], [10, 0, -95]
    ];

    cactiPositions.forEach(pos => {
      const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.6, 3);
      const cactusMaterial = new THREE.MeshStandardMaterial({ color: 0x6B8E23 });
      const body = new THREE.Mesh(bodyGeometry, cactusMaterial);
      body.position.set(pos[0], 1.5, pos[2]);
      this.environment.add(body);

      const armGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5);
      const leftArm = new THREE.Mesh(armGeometry, cactusMaterial);
      leftArm.rotation.z = Math.PI / 2;
      leftArm.position.set(pos[0] - 0.8, 2, pos[2]);
      this.environment.add(leftArm);

      const rightArm = new THREE.Mesh(armGeometry, cactusMaterial);
      rightArm.rotation.z = -Math.PI / 2;
      rightArm.position.set(pos[0] + 0.8, 2, pos[2]);
      this.environment.add(rightArm);
    });
  }

  private getRoadColor(segment: RoadSegment): number {
    switch (segment.surface) {
      case 'smooth': return 0x3A3A3A;
      case 'rough': return 0x4A4A4A;
      case 'gravel': return 0x8D6E63;
      case 'dirt': return 0xA1887F;
      default: return 0x3A3A3A;
    }
  }

  private getSkyColor(sceneType: SceneType): number {
    switch (sceneType) {
      case 'highway': return 0x87CEEB;
      case 'city': return 0xB0C4DE;
      case 'urban': return 0x778899;
      case 'mountain': return 0x6495ED;
      case 'desert': return 0xFFE4B5;
      case 'rural': return 0x87CEEB;
      default: return 0x87CEEB;
    }
  }

  private getGroundColor(sceneType: SceneType): number {
    switch (sceneType) {
      case 'desert': return 0xDEB887;
      case 'mountain': return 0x8B7355;
      case 'rural': return 0x6B8E23;
      default: return 0x228B22;
    }
  }

  updateProps(
    roadProfile: RoadProfile,
    currentSegmentIndex: number,
    distanceInSegment: number,
    speed: number,
    voltage: number,
    activeCells: number,
    configId?: string
  ) {
    this.roadProfile = roadProfile;
    this.currentSegmentIndex = currentSegmentIndex;
    this.speed = speed;

    if (this.currentSegmentIndex !== this.lastStateSegment) {
      this.createRoad(roadProfile);
      this.createEnvironment(roadProfile.sceneType);
      this.lastStateSegment = this.currentSegmentIndex;
    }
  }

  render(
    roadProfile: RoadProfile,
    currentSegmentIndex: number,
    distanceInSegment: number,
    speed: number,
    voltage: number,
    activeCells: number,
    configId?: string
  ) {
    if (!this.roadProfile) return;

    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    const segmentChanged = currentSegmentIndex !== this.lastStateSegment;
    const stateUpdated = distanceInSegment !== this.lastStateDistance;

    if (segmentChanged || (stateUpdated && Math.abs(distanceInSegment - this.lastStateDistance) > 1)) {
      this.interpolatedDistance = distanceInSegment;
      this.lastStateDistance = distanceInSegment;
      this.lastStateSegment = currentSegmentIndex;
    } else {
      if (speed > 0) {
        const frameIncrement = speed * deltaTime * 0.5;
        this.interpolatedDistance += frameIncrement;
      }
      this.lastStateDistance = distanceInSegment;
      this.lastStateSegment = currentSegmentIndex;
    }

    const currentSegment = roadProfile.segments[currentSegmentIndex];
    if (currentSegment) {
      const tiltAngle = (currentSegment.curveAngle / 90) * 0.2;
      this.car.rotation.z = tiltAngle;
      
      const pitchAngle = (currentSegment.grade / 30) * 0.15;
      this.car.rotation.x = pitchAngle;
    }

    const smoothScroll = this.interpolatedDistance * 0.3;
    this.road.position.z = smoothScroll;
    this.environment.position.z = smoothScroll * 0.5;

    this.renderer.render(this.scene, this.camera);
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    this.renderer.dispose();
    this.scene.clear();
  }
}
