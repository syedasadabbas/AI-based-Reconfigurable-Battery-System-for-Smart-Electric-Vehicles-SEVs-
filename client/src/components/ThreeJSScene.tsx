import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { RoadProfile, RoadSegment, SceneType } from '@shared/schema';

interface ThreeJSSceneProps {
  roadProfile: RoadProfile;
  currentSegmentIndex: number;
  distanceInSegment: number;
  speed: number;
  voltage: number;
  activeCells: number;
  configId?: string;
}

export function ThreeJSScene({
  roadProfile,
  currentSegmentIndex,
  distanceInSegment,
  speed,
  voltage,
  activeCells,
  configId
}: ThreeJSSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ThreeJSCarScene | null>(null);
  const [webGLError, setWebGLError] = useState<string | null>(null);
  const animationRef = useRef<number>(0);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // Store latest prop values in refs so animation loop can access them
  const propsRef = useRef({
    roadProfile,
    currentSegmentIndex,
    distanceInSegment,
    speed,
    voltage,
    activeCells,
    configId
  });

  // Update refs whenever props change
  useEffect(() => {
    propsRef.current = {
      roadProfile,
      currentSegmentIndex,
      distanceInSegment,
      speed,
      voltage,
      activeCells,
      configId
    };
  }, [roadProfile, currentSegmentIndex, distanceInSegment, speed, voltage, activeCells, configId]);

  useEffect(() => {
    if (!mountRef.current) return;

    try {
      const carScene = new ThreeJSCarScene(mountRef.current);
      sceneRef.current = carScene;

      const animate = () => {
        if (sceneRef.current) {
          const props = propsRef.current;
          sceneRef.current.update(
            props.roadProfile,
            props.currentSegmentIndex,
            props.distanceInSegment,
            props.speed,
            props.voltage,
            props.activeCells,
            props.configId
          );
          sceneRef.current.render();
        }
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();

      const handleResize = () => {
        sceneRef.current?.handleResize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationRef.current);
        sceneRef.current?.dispose();
      };
    } catch (error) {
      setWebGLError(error instanceof Error ? error.message : 'WebGL not supported');
      console.error('Three.js scene initialization failed:', error);
    }
  }, []);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateSimulationState(
        roadProfile,
        currentSegmentIndex,
        distanceInSegment,
        speed
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
            WebGL is required for 3D rendering. Please use a modern browser with WebGL support.
          </p>
        </div>
      </div>
    );
  }

  const handleAudioToggle = () => {
    if (sceneRef.current) {
      const newState = sceneRef.current.toggleAudio();
      setAudioEnabled(newState);
    }
  };

  return (
    <div className="w-full h-full relative">
      <div 
        ref={mountRef} 
        className="w-full h-full"
        data-testid="threejs-car-renderer"
      />
      {/* Voltage Display Overlay */}
      <div 
        className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none"
        data-testid="voltage-display-overlay"
      >
        <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-8 py-6 border-2 border-yellow-400/50 shadow-2xl">
          <div className="text-center space-y-1">
            <div className="text-yellow-400/80 text-sm font-medium tracking-wider uppercase">
              Battery Power
            </div>
            <div className="text-6xl font-bold text-yellow-300 tabular-nums tracking-tight">
              {voltage.toFixed(1)}
              <span className="text-3xl ml-2 text-yellow-400/80">V</span>
            </div>
            <div className="text-yellow-400/60 text-xs font-medium">
              {activeCells} {activeCells === 1 ? 'Cell' : 'Cells'} Active
            </div>
          </div>
        </div>
      </div>
      
      {/* Config ID Display */}
      {configId && (
        <div 
          className="absolute bottom-8 right-8 pointer-events-none"
          data-testid="config-display-overlay"
        >
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="text-white/80 text-xs font-mono">
              {configId}
            </div>
          </div>
        </div>
      )}

      {/* Audio Toggle Button */}
      <button
        onClick={handleAudioToggle}
        className="absolute top-8 right-8 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-lg p-3 transition-all pointer-events-auto"
        data-testid="button-audio-toggle"
        title={audioEnabled ? "Mute audio" : "Unmute audio"}
        aria-label={audioEnabled ? "Mute audio" : "Unmute audio"}
      >
        {audioEnabled ? (
          <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </div>
  );
}

class ThreeJSCarScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  
  // Scene objects
  private car: THREE.Group;
  private road: THREE.Group;
  private environment: THREE.Group;
  private lights: THREE.Group;
  private gltfLoader: GLTFLoader;
  private carModel: THREE.Object3D | null = null;
  
  // Animation state
  private carPosition: THREE.Vector3;
  private carRotation: THREE.Euler;
  private cameraOffset: THREE.Vector3;
  private targetCameraPosition: THREE.Vector3;
  private currentCameraPosition: THREE.Vector3;
  private currentCurve: THREE.CatmullRomCurve3 | null = null;
  
  // Smooth interpolation
  private targetDistance: number = 0;
  private displayDistance: number = 0;
  private cumulativeDistance: number = 0; // Total distance traveled
  private targetTilt: number = 0;
  private displayTilt: number = 0;
  private targetPitch: number = 0;
  private displayPitch: number = 0;
  
  // Simulation tracking
  private lastStateDistance: number = 0;
  private lastStateSegment: number = -1;
  private lastSceneType: SceneType | null = null;
  private lastRoadProfileId: string | null = null;
  private lastFrameTime: number = 0;
  private currentSpeed: number = 0;
  private currentSegment: RoadSegment | null = null;
  private segmentLength: number = 1.0; // Default segment length in km
  
  // Geometry caching
  private roadSegmentsCache: Map<number, THREE.Group> = new Map();
  private environmentCache: Map<SceneType, THREE.Group> = new Map();
  
  // Audio engine sound
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isAudioInitialized: boolean = false;
  private isAudioMuted: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 300);
    
    // Setup camera with proper perspective
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 500);
    this.cameraOffset = new THREE.Vector3(0, 8, 15);
    
    // Setup WebGL renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    
    // Initialize groups
    this.car = new THREE.Group();
    this.road = new THREE.Group();
    this.environment = new THREE.Group();
    this.lights = new THREE.Group();
    
    this.scene.add(this.car);
    this.scene.add(this.road);
    this.scene.add(this.environment);
    this.scene.add(this.lights);
    
    // Car initial position
    this.carPosition = new THREE.Vector3(0, 0, 0);
    this.carRotation = new THREE.Euler(0, Math.PI, 0);
    
    // Camera positions for smooth following
    this.targetCameraPosition = new THREE.Vector3(0, 8, 15);
    this.currentCameraPosition = new THREE.Vector3(0, 8, 15);
    
    // Initialize GLTF Loader
    this.gltfLoader = new GLTFLoader();
    
    // Build the scene
    this.setupLights();
    this.loadGLBCar(); // Try to load GLB model first
    this.createGround();
    
    this.lastFrameTime = performance.now();
  }

  private loadGLBCar() {
    // Try to load a GLB car model from the assets folder
    // Users can replace this with any GLB car model they want
    const glbPath = '/car-model.glb'; // Placeholder path
    
    this.gltfLoader.load(
      glbPath,
      (gltf) => {
        // GLB model loaded successfully
        console.log('GLB car model loaded successfully');
        this.carModel = gltf.scene;
        
        // Scale and position the model appropriately
        this.carModel.scale.set(1.5, 1.5, 1.5);
        this.carModel.position.set(0, 0, 0);
        this.carModel.rotation.y = Math.PI;
        
        // Enable shadows and mark wheels for animation
        this.carModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Mark wheels for rotation animation
            // Detect wheels by name (wheel, tire, rim) or by being cylindrical geometry low in the model
            const name = child.name.toLowerCase();
            if (name.includes('wheel') || name.includes('tire') || name.includes('rim')) {
              child.userData.isWheel = true;
            }
          }
        });
        
        // Add to car group
        this.car.add(this.carModel);
      },
      (progress) => {
        // Loading progress
        const percent = (progress.loaded / progress.total) * 100;
        console.log(`Loading GLB car model: ${percent.toFixed(2)}%`);
      },
      (error) => {
        // GLB loading failed - fall back to primitive car
        console.warn('GLB car model not found, using primitive fallback:', error);
        this.create3DCar();
      }
    );
  }

  private setupLights() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.lights.add(ambientLight);
    
    // Directional light (sun) with shadows
    const sunLight = new THREE.DirectionalLight(0xffffee, 1.0);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this.lights.add(sunLight);
    
    // Hemisphere light for natural sky/ground lighting
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x6B8E23, 0.5);
    this.lights.add(hemiLight);
    
    // Point light following car for better visibility
    const carLight = new THREE.PointLight(0xffffff, 0.3, 30);
    carLight.position.set(0, 5, 0);
    this.car.add(carLight);
  }

  private create3DCar() {
    this.car.clear();
    
    // Re-add point light following car for better visibility
    const carLight = new THREE.PointLight(0xffffff, 0.3, 30);
    carLight.position.set(0, 5, 0);
    this.car.add(carLight);
    
    // Car body (main chassis)
    const bodyGeometry = new THREE.BoxGeometry(2.5, 1.2, 4.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFD700,
      metalness: 0.6,
      roughness: 0.3
    });
    const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    carBody.position.y = 1.0;
    carBody.castShadow = true;
    carBody.receiveShadow = true;
    this.car.add(carBody);
    
    // Car roof/cabin
    const roofGeometry = new THREE.BoxGeometry(2.0, 0.8, 2.5);
    const roofMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFC700,
      metalness: 0.6,
      roughness: 0.3
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 1.9, -0.3);
    roof.castShadow = true;
    this.car.add(roof);
    
    // Windows (darker, glossy)
    const windowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x222222,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.6
    });
    
    // Front windshield
    const windshieldGeometry = new THREE.BoxGeometry(2.0, 0.7, 0.1);
    const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
    windshield.position.set(0, 1.9, 1.0);
    this.car.add(windshield);
    
    // Rear window
    const rearWindow = new THREE.Mesh(windshieldGeometry, windowMaterial);
    rearWindow.position.set(0, 1.9, -1.6);
    this.car.add(rearWindow);
    
    // Side windows
    const sideWindowGeometry = new THREE.BoxGeometry(0.1, 0.6, 1.8);
    const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    leftWindow.position.set(-1.0, 1.9, -0.3);
    this.car.add(leftWindow);
    
    const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    rightWindow.position.set(1.0, 1.9, -0.3);
    this.car.add(rightWindow);
    
    // Wheels (4 wheels)
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      metalness: 0.3,
      roughness: 0.8
    });
    
    const wheelPositions = [
      { x: -1.3, z: 1.8 },  // Front left
      { x: 1.3, z: 1.8 },   // Front right
      { x: -1.3, z: -1.8 }, // Rear left
      { x: 1.3, z: -1.8 }   // Rear right
    ];
    
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, 0.5, pos.z);
      wheel.castShadow = true;
      wheel.userData.isWheel = true; // Mark for rotation animation
      this.car.add(wheel);
      
      // Wheel rims
      const rimGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.45, 16);
      const rimMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc,
        metalness: 0.9,
        roughness: 0.1
      });
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(pos.x, 0.5, pos.z);
      rim.userData.isWheel = true; // Mark for rotation animation
      this.car.add(rim);
    });
    
    // Headlights
    const headlightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.2);
    const headlightMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      emissive: 0xffffaa,
      emissiveIntensity: 0.5
    });
    
    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-0.8, 0.9, 2.3);
    this.car.add(leftHeadlight);
    
    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(0.8, 0.9, 2.3);
    this.car.add(rightHeadlight);
    
    // Taillights
    const taillightMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.3
    });
    
    const leftTaillight = new THREE.Mesh(headlightGeometry, taillightMaterial);
    leftTaillight.position.set(-0.8, 0.9, -2.3);
    this.car.add(leftTaillight);
    
    const rightTaillight = new THREE.Mesh(headlightGeometry, taillightMaterial);
    rightTaillight.position.set(0.8, 0.9, -2.3);
    this.car.add(rightTaillight);
    
    // Set initial car position and rotation
    this.car.position.copy(this.carPosition);
    this.car.rotation.copy(this.carRotation);
  }

  private createGround() {
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x6B8E23,
      roughness: 0.9,
      metalness: 0.0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.environment.add(ground);
  }

  private create3DRoad(roadProfile: RoadProfile, startSegmentIndex: number) {
    this.road.clear();
    
    const roadWidth = 10;
    const segmentsToRender = 20; // Render more segments for visibility
    const kmToUnits = 10;
    
    // Build road starting from 0, extending ahead (negative Z)
    // NO cumulative offset baked into positions - that's handled by road.position.z
    let zPos = 0;
    
    for (let i = 0; i < segmentsToRender; i++) {
      const segIdx = Math.min(startSegmentIndex + i, roadProfile.segments.length - 1);
      const segment = roadProfile.segments[segIdx];
      const segmentLengthUnits = segment.distance * kmToUnits;
      
      // Create road segment geometry
      const roadGeometry = new THREE.PlaneGeometry(roadWidth, segmentLengthUnits);
      const roadMaterial = new THREE.MeshStandardMaterial({ 
        color: this.getRoadColor(segment),
        roughness: this.getRoadRoughness(segment),
        metalness: 0.1
      });
      
      const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
      roadMesh.receiveShadow = true;
      roadMesh.castShadow = false;
      
      // Position segment extending ahead
      roadMesh.position.set(0, 0, zPos - (segmentLengthUnits / 2));
      roadMesh.rotation.x = -Math.PI / 2;
      
      this.road.add(roadMesh);
      
      // Add road markings
      this.addSimpleRoadMarkings(roadWidth, segmentLengthUnits, zPos - (segmentLengthUnits / 2));
      
      // Move to next segment position
      zPos -= segmentLengthUnits;
    }
    
    this.currentCurve = null;
  }
  
  private getRoadRoughness(segment: RoadSegment): number {
    switch (segment.surface) {
      case 'smooth': return 0.3;
      case 'rough': return 0.7;
      case 'gravel': return 0.9;
      case 'dirt': return 0.95;
      default: return 0.8;
    }
  }

  private addSimpleRoadMarkings(width: number, length: number, zPos: number) {
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    
    // Left edge line
    const leftEdge = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.1, length),
      lineMaterial
    );
    leftEdge.position.set(-width / 2 + 0.5, 0.05, zPos);
    leftEdge.rotation.x = -Math.PI / 2;
    this.road.add(leftEdge);
    
    // Right edge line
    const rightEdge = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.1, length),
      lineMaterial
    );
    rightEdge.position.set(width / 2 - 0.5, 0.05, zPos);
    rightEdge.rotation.x = -Math.PI / 2;
    this.road.add(rightEdge);
    
    // Center dashed line
    const dashCount = Math.floor(length / 10);
    const dashLength = 3;
    const gapLength = 7;
    
    for (let i = 0; i < dashCount; i++) {
      const dash = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.1, dashLength),
        lineMaterial
      );
      const dashZ = zPos - length / 2 + i * (dashLength + gapLength) + dashLength / 2;
      dash.position.set(0, 0.05, dashZ);
      dash.rotation.x = -Math.PI / 2;
      this.road.add(dash);
    }
  }

  private addCurvedRoadMarkings(width: number, length: number, point: THREE.Vector3, tangent: THREE.Vector3, banking: number) {
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    
    // Calculate angle from tangent for proper orientation
    const angle = Math.atan2(tangent.x, -tangent.z);
    
    // Calculate perpendicular direction (90 degrees from tangent)
    const perpX = Math.cos(angle + Math.PI / 2);
    const perpZ = Math.sin(angle + Math.PI / 2);
    
    // Edge lines (parallel to road direction)
    const edgeGeometry = new THREE.BoxGeometry(0.3, 0.1, length);
    
    // Left edge
    const leftEdge = new THREE.Mesh(edgeGeometry, lineMaterial);
    leftEdge.position.set(
      point.x + perpX * (-width / 2 + 0.5),
      point.y + 0.05,
      point.z + perpZ * (-width / 2 + 0.5)
    );
    leftEdge.rotation.set(-Math.PI / 2, angle, banking);
    this.road.add(leftEdge);
    
    // Right edge
    const rightEdge = new THREE.Mesh(edgeGeometry, lineMaterial);
    rightEdge.position.set(
      point.x + perpX * (width / 2 - 0.5),
      point.y + 0.05,
      point.z + perpZ * (width / 2 - 0.5)
    );
    rightEdge.rotation.set(-Math.PI / 2, angle, banking);
    this.road.add(rightEdge);
    
    // Center dashed line
    const dashCount = 8;
    const dashLength = length / dashCount / 2;
    const dashGeometry = new THREE.BoxGeometry(0.2, 0.1, dashLength);
    
    for (let i = 0; i < dashCount; i++) {
      const dash = new THREE.Mesh(dashGeometry, lineMaterial);
      const dashOffset = (i / dashCount - 0.5) * length;
      dash.position.set(
        point.x + tangent.x * dashOffset,
        point.y + 0.05,
        point.z + tangent.z * dashOffset
      );
      dash.rotation.set(-Math.PI / 2, angle, banking);
      this.road.add(dash);
    }
  }

  private create3DEnvironment(sceneType: SceneType, startZ: number) {
    this.environment.clear();
    this.createGround();
    
    // Update scene colors
    const skyColor = this.getSkyColor(sceneType);
    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.Fog(skyColor, 50, 300);
    
    switch (sceneType) {
      case 'city':
      case 'urban':
        this.addBuildings(startZ);
        break;
      case 'highway':
      case 'rural':
        this.addTrees(startZ);
        break;
      case 'mountain':
        this.addMountains();
        break;
      case 'desert':
        this.addCacti(startZ);
        break;
    }
  }

  private addBuildings(startZ: number) {
    const buildingCount = 12;
    
    for (let i = 0; i < buildingCount; i++) {
      const height = 15 + Math.random() * 30;
      const width = 8 + Math.random() * 6;
      const depth = 8 + Math.random() * 6;
      
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color().setHSL(0, 0, 0.3 + Math.random() * 0.2),
        roughness: 0.9,
        metalness: 0.1
      });
      
      const building = new THREE.Mesh(geometry, material);
      building.position.set(
        (i % 2 === 0 ? -20 : 20) + (Math.random() - 0.5) * 10,
        height / 2,
        startZ - i * 40
      );
      building.castShadow = true;
      building.receiveShadow = true;
      this.environment.add(building);
    }
  }

  private addTrees(startZ: number) {
    const treeCount = 20;
    
    for (let i = 0; i < treeCount; i++) {
      const treeGroup = new THREE.Group();
      
      // Trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, 6);
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 3;
      trunk.castShadow = true;
      treeGroup.add(trunk);
      
      // Foliage
      const foliageGeometry = new THREE.ConeGeometry(3, 6, 8);
      const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.y = 8;
      foliage.castShadow = true;
      treeGroup.add(foliage);
      
      treeGroup.position.set(
        (i % 2 === 0 ? -15 : 15) + (Math.random() - 0.5) * 8,
        0,
        startZ - i * 25
      );
      this.environment.add(treeGroup);
    }
  }

  private addMountains() {
    const mountainCount = 6;
    
    for (let i = 0; i < mountainCount; i++) {
      const geometry = new THREE.ConeGeometry(20, 40, 4);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x696969,
        roughness: 0.9
      });
      const mountain = new THREE.Mesh(geometry, material);
      mountain.position.set(
        (Math.random() - 0.5) * 150,
        20,
        -100 - i * 50
      );
      mountain.castShadow = true;
      this.environment.add(mountain);
    }
  }

  private addCacti(startZ: number) {
    const cactiCount = 15;
    
    for (let i = 0; i < cactiCount; i++) {
      const cactusGroup = new THREE.Group();
      
      // Main body
      const bodyGeometry = new THREE.CylinderGeometry(0.7, 0.8, 5);
      const cactusMaterial = new THREE.MeshStandardMaterial({ color: 0x6B8E23 });
      const body = new THREE.Mesh(bodyGeometry, cactusMaterial);
      body.position.y = 2.5;
      body.castShadow = true;
      cactusGroup.add(body);
      
      // Arms
      const armGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2);
      const leftArm = new THREE.Mesh(armGeometry, cactusMaterial);
      leftArm.rotation.z = Math.PI / 2;
      leftArm.position.set(-1.5, 3, 0);
      leftArm.castShadow = true;
      cactusGroup.add(leftArm);
      
      const rightArm = new THREE.Mesh(armGeometry, cactusMaterial);
      rightArm.rotation.z = -Math.PI / 2;
      rightArm.position.set(1.5, 3, 0);
      rightArm.castShadow = true;
      cactusGroup.add(rightArm);
      
      cactusGroup.position.set(
        (i % 2 === 0 ? -15 : 15) + (Math.random() - 0.5) * 10,
        0,
        startZ - i * 30
      );
      this.environment.add(cactusGroup);
    }
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

  updateSimulationState(
    roadProfile: RoadProfile,
    currentSegmentIndex: number,
    distanceInSegment: number,
    speed: number
  ) {
    this.currentSpeed = speed;
    
    // Detect profile changes or resets
    const profileChanged = roadProfile.id !== this.lastRoadProfileId;
    const segmentWentBackward = currentSegmentIndex < this.lastStateSegment;
    const isReset = profileChanged || segmentWentBackward;
    
    if (isReset) {
      // Calculate cumulative distance for current segment index
      // (sum of all segments before the current one)
      this.cumulativeDistance = 0;
      for (let i = 0; i < currentSegmentIndex; i++) {
        if (roadProfile.segments[i]) {
          this.cumulativeDistance += roadProfile.segments[i].distance;
        }
      }
      
      // Reset display values
      this.displayDistance = this.cumulativeDistance;
      this.targetDistance = this.cumulativeDistance + distanceInSegment;
      this.displayTilt = 0;
      this.displayPitch = 0;
      this.targetTilt = 0;
      this.targetPitch = 0;
      
      // Reset road/environment positions
      this.road.position.z = 0;
      this.environment.position.z = 0;
      
      // Rebuild scene
      this.create3DRoad(roadProfile, currentSegmentIndex);
      this.lastStateSegment = currentSegmentIndex;
      this.lastRoadProfileId = roadProfile.id;
    } else if (currentSegmentIndex !== this.lastStateSegment && this.lastStateSegment >= 0) {
      // Normal segment transition: Add PREVIOUS segment's full length
      const prevSegment = roadProfile.segments[this.lastStateSegment];
      if (prevSegment) {
        this.cumulativeDistance += prevSegment.distance;
      }
      
      // Rebuild road when segment changes
      this.create3DRoad(roadProfile, currentSegmentIndex);
      this.lastStateSegment = currentSegmentIndex;
    } else if (this.lastStateSegment < 0) {
      // First segment initialization
      this.cumulativeDistance = 0;
      this.displayDistance = 0;
      this.lastStateSegment = currentSegmentIndex;
      this.lastRoadProfileId = roadProfile.id;
      this.create3DRoad(roadProfile, currentSegmentIndex);
    }
    
    // Update current segment properties
    if (roadProfile.segments[currentSegmentIndex]) {
      this.currentSegment = roadProfile.segments[currentSegmentIndex];
      this.segmentLength = this.currentSegment.distance;
    }
    
    // Calculate target distance as cumulative + distance in current segment
    this.targetDistance = this.cumulativeDistance + distanceInSegment;
    
    // Only rebuild environment when scene type changes
    if (roadProfile.sceneType !== this.lastSceneType) {
      this.create3DEnvironment(roadProfile.sceneType, 0);
      this.lastSceneType = roadProfile.sceneType;
    }
  }

  update(
    roadProfile: RoadProfile,
    currentSegmentIndex: number,
    distanceInSegment: number,
    speed: number,
    voltage: number,
    activeCells: number,
    configId?: string
  ) {
    const now = performance.now();
    const deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.1); // Cap at 100ms
    this.lastFrameTime = now;
    
    // Smooth distance interpolation with lerp
    // Use faster lerp when stopped, slower when moving for smoothness
    const lerpFactor = speed > 0 ? 0.15 : 0.3;
    this.displayDistance += (this.targetDistance - this.displayDistance) * lerpFactor;
    
    // Endless runner approach: car and camera stay fixed, road/scenery scrolls backward
    if (roadProfile && this.currentSegment) {
      const kmToUnits = 10;
      
      // Car stays at origin
      this.car.position.set(0, 1.0, 0);
      this.car.rotation.set(0, 0, 0);
      
      // Camera stays fixed behind and above car
      this.camera.position.set(0, 10, 20);
      this.camera.lookAt(0, 0, -20); // Look ahead down the road
      
      // Move road/scenery backward by distance WITHIN current segment only
      // This creates scrolling effect while keeping scenery near camera
      // When segment changes, road rebuilds at position 0, then scrolls again
      // Positive offset moves road toward camera (endless runner effect)
      const roadOffset = (distanceInSegment * kmToUnits);
      this.road.position.z = roadOffset;
      this.environment.position.z = roadOffset;
      
      // Animate wheels based on speed to show movement
      // Use traverse() to check all descendants, including nested GLB model wheels
      if (speed > 0) {
        const wheelRotationSpeed = speed * 0.1;
        this.car.traverse((child) => {
          if (child.userData.isWheel && child instanceof THREE.Mesh) {
            child.rotation.x += wheelRotationSpeed;
          }
        });
      }
    }
    
    // Update audio based on voltage and speed
    this.updateAudioForVoltage(voltage, speed);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private initializeAudio() {
    if (this.isAudioInitialized) return;
    
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create oscillator for engine sound
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = 'sawtooth'; // Engine-like sound
      this.oscillator.frequency.value = 80; // Base frequency
      
      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0.1; // Low volume
      
      // Connect nodes
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
      
      // Start oscillator
      this.oscillator.start();
      this.isAudioInitialized = true;
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }
  
  private updateAudioForVoltage(voltage: number, speed: number) {
    // Initialize audio on first interaction (browser autoplay policy)
    if (!this.isAudioInitialized && speed > 0 && !this.isAudioMuted) {
      this.initializeAudio();
    }
    
    if (!this.oscillator || !this.gainNode) return;
    
    // Map voltage (0-16V) to frequency (60-300 Hz)
    // Higher voltage = higher pitch (more power)
    const minFreq = 60;
    const maxFreq = 300;
    const frequency = minFreq + (voltage / 16) * (maxFreq - minFreq);
    
    // Smooth frequency transition
    this.oscillator.frequency.setTargetAtTime(frequency, this.audioContext!.currentTime, 0.1);
    
    // Volume based on speed - completely mute when speed is 0 or audio is muted
    const targetVolume = (speed > 0 && !this.isAudioMuted) ? 0.15 : 0;
    this.gainNode.gain.setTargetAtTime(targetVolume, this.audioContext!.currentTime, 0.1);
  }

  public toggleAudio(): boolean {
    this.isAudioMuted = !this.isAudioMuted;
    
    // Immediately update volume
    if (this.gainNode && this.audioContext) {
      const targetVolume = this.isAudioMuted ? 0 : 0.15;
      this.gainNode.gain.setTargetAtTime(targetVolume, this.audioContext.currentTime, 0.05);
    }
    
    return !this.isAudioMuted; // Return current audio state (true = on, false = off)
  }

  public getAudioState(): boolean {
    return !this.isAudioMuted;
  }

  dispose() {
    // Clean up audio
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
