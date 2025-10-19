# WORLDEDIT API REFERENCE

**Engine Integration & Component System APIs**

**Complete technical reference for WORLDEDIT APIs and interfaces**

> **API IMPLEMENTATION STATUS - CURRENT**
> 
> This API reference reflects the current implementation state after comprehensive testing and validation:
> 
> **Fully Implemented and Tested:**
> - Main Process APIs: Project management, file system, IPC communication
> - Asset Management: Import pipeline, browser, property editing
> - Build System: Multi-platform compilation, optimization profiles
> - UI Framework: Menu system, keyboard shortcuts, modal dialogs
> - Component System: Entity-component architecture with inspector generation
> - Engine Integration: WORLDC compiler communication, hot-reload system
> 
> **Known Issues:**
> - WORLDC compiler integration fails during editor startup (EPIPE errors)
> - Large renderer bundle size (1.94 MiB) requires optimization
> - ~~Dynamic require warnings in webpack build~~ (FIXED)
> 
> **Recent Improvements:**
> - Fixed dynamic require warnings in WCCompilerIntegration.ts
> - Standardized naming conventions (snake_case → camelCase)
> - Removed legacy disabled files from semantic analyzer
> - Implemented live blueprint analysis system for debugging
> 
> **Testing Results:**
> - Editor builds successfully with minor warnings only
> - Core functionality validated and operational
> - 40+ keyboard shortcuts implemented and working
> - Scene management for 2D/3D content functional

## Table of Contents

- [Engine Integration API](#engine-integration-api)
- [IPC Communication](#ipc-communication)
- [Component System API](#component-system-api)
- [WORLDC Language Integration](#worldc-language-integration)
- [Viewport & Rendering](#viewport--rendering)
- [Asset Management API](#asset-management-api)
- [Hot-Reload System](#hot-reload-system)
- [Build System API](#build-system-api)
- [UI Framework API](#ui-framework-api)
- [Live Blueprint Analysis](#live-blueprint-analysis)
- [Event System](#event-system)
- [Performance Monitoring](#performance-monitoring)
- [Type Definitions](#type-definitions)

## Engine Integration API

### WORLDC Compiler Integration

The editor integrates with the WORLDC compiler through a comprehensive API that enables real-time compilation, hot-reload, and debugging capabilities.

#### WCCompilerIntegration Class

```typescript
class WCCompilerIntegration extends EventEmitter {
  // Core compilation methods
  async compileScript(scriptPath: string, target: string): Promise<CompilationResult>
  async validateScript(scriptPath: string): Promise<ValidationResult>
  
  // Real-time compilation
  async compileToTypeScript(request: CompilationRequest): Promise<CompilationResult>
  async compileToAssemblyScript(request: CompilationRequest): Promise<CompilationResult>
  
  // Compiler management
  async initialize(): Promise<void>
  async verifyCompiler(): Promise<void>
  
  // Event handling
  on(event: CompilerEvent, listener: Function): this
}
```

**Recent Fixes:**
- Resolved dynamic require warnings by replacing `require.resolve()` with `fs.existsSync()`
- Improved error handling for missing compiler binaries
- Enhanced path resolution for cross-platform compatibility

## Live Blueprint Analysis

### Blueprint Analyzer System

A comprehensive debugging and system analysis tool implemented as a local web application for visualizing and understanding the WORLDENV architecture.

#### Core Features

```typescript
interface BlueprintAnalyzer {
  // System analysis
  analyzeProject(): Promise<SystemData>
  buildDependencyGraph(): Promise<DependencyGraph>
  traceExecutionPaths(): Promise<FlowData>
  
  // Visual rendering
  renderSystemDiagram(data: SystemData): void
  renderDependencyGraph(dependencies: DependencyGraph): void
  renderArchitectureMap(components: ComponentData): void
  
  // Real-time monitoring
  startFileMonitoring(): void
  detectSystemChanges(): Promise<ChangeSet>
  
  // Debug tools
  scanForIssues(): Promise<Issue[]>
  analyzePerformance(): Promise<MetricsData>
}
```

#### Usage Example

```typescript
// Initialize blueprint analyzer
const analyzer = new BlueprintAnalyzer();
await analyzer.initialize();

// Perform comprehensive system analysis
const systemData = await analyzer.analyzeProject();
const dependencies = await analyzer.buildDependencyGraph(systemData);

// Render visual analysis
analyzer.renderSystemDiagram(systemData);
analyzer.renderDependencyGraph(dependencies);

// Start real-time monitoring
analyzer.startFileMonitoring();
```

#### Access and Deployment

**Local Development:**
```bash
# Navigate to blueprint directory
cd worldenv/hitl/worldenv-liveblueprint/

# Open in browser
open index.html
```

**Features Available:**
- **Visual Tab:** Interactive system architecture diagrams
- **Textual Tab:** Linear execution flow descriptions  
- **Debug Tab:** Issue detection and performance analysis
- **Monitor Tab:** Real-time file system and build monitoring
- **Code Tab:** Integrated file browser with syntax highlighting

#### Analysis Capabilities

**Code Analysis:**
- C/C++ function mapping and call chains
- TypeScript class hierarchies and dependencies
- Cross-language integration point detection
- Memory allocation pattern analysis

**System Architecture:**
- Component relationship visualization
- Data flow mapping through IPC channels
- Manager class interaction patterns
- Build pipeline dependency tracking

**Debug Integration:**
- EPIPE error pattern detection
- Bundle size analysis and optimization suggestions
- Integration point failure diagnosis
- Performance bottleneck identification

```typescript
interface WCCompilerIntegration {
  // Compiler status and version checking
  checkInstallation(): Promise<CompilerStatus>;
  getVersion(): Promise<string>;
  
  // Script compilation
  compileScript(options: CompileOptions): Promise<CompilationResult>;
  compileProject(projectPath: string): Promise<ProjectCompilationResult>;
  
  // Hot-reload functionality
  enableHotReload(scriptPaths: string[]): Promise<void>;
  disableHotReload(): Promise<void>;
  reloadScript(scriptPath: string): Promise<ReloadResult>;
  
  // Language server integration
  startLanguageServer(): Promise<LanguageServerHandle>;
  stopLanguageServer(): Promise<void>;
  requestCompletion(position: Position): Promise<CompletionItem[]>;
  requestDiagnostics(filePath: string): Promise<Diagnostic[]>;
}

interface CompileOptions {
  inputPath: string;
  outputPath: string;
  target: 'debug' | 'release' | 'hot-reload';
  optimizationLevel: 'none' | 'basic' | 'aggressive';
  generateSourceMaps: boolean;
  includeDebugInfo: boolean;
}

interface CompilationResult {
  success: boolean;
  bytecode?: Uint8Array;
  sourceMap?: string;
  diagnostics: Diagnostic[];
  compilationTime: number;
  outputSize: number;
}

// Usage example
const compiler = new WCCompilerIntegration();
const status = await compiler.checkInstallation();
if (status.available) {
  const result = await compiler.compileScript({
    inputPath: 'scripts/player.wc',
    outputPath: 'build/player.wc.bytecode',
    target: 'debug',
    optimizationLevel: 'basic',
    generateSourceMaps: true,
    includeDebugInfo: true
  });
}
```

### Engine Communication Manager

Manages real-time communication between the editor and the game engine runtime.

```typescript
interface EngineCommunicationManager {
  // Connection management
  connect(engineConfig: EngineConfig): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Command execution
  executeCommand<T>(command: EngineCommand): Promise<T>;
  sendBatch(commands: EngineCommand[]): Promise<BatchResult>;
  
  // Entity manipulation
  createEntity(name: string, template?: EntityTemplate): Promise<EntityHandle>;
  deleteEntity(entityId: string): Promise<void>;
  updateEntity(entityId: string, changes: EntityChanges): Promise<void>;
  queryEntities(query: EntityQuery): Promise<EntityHandle[]>;
  
  // Component operations
  addComponent(entityId: string, componentType: string, data: any): Promise<ComponentHandle>;
  removeComponent(entityId: string, componentType: string): Promise<void>;
  updateComponent(entityId: string, componentType: string, changes: any): Promise<void>;
  
  // Scene management
  loadScene(scenePath: string): Promise<SceneHandle>;
  unloadScene(sceneId: string): Promise<void>;
  getActiveScene(): Promise<SceneHandle>;
  
  // Real-time updates
  subscribe(eventType: string, callback: (data: any) => void): void;
  unsubscribe(eventType: string, callback: (data: any) => void): void;
}

interface EngineCommand {
  type: string;
  id?: string;
  payload: any;
  timestamp: number;
}

interface EntityHandle {
  id: string;
  name: string;
  active: boolean;
  components: ComponentHandle[];
  transform: TransformData;
}

// Usage example
const engine = new EngineCommunicationManager();
await engine.connect({ port: 8080, host: 'localhost' });

const player = await engine.createEntity('Player');
await engine.addComponent(player.id, 'Transform', {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 }
});
```

## IPC API

### Main Process → Renderer Communication

The main process exposes APIs through the preload script for secure communication.

#### Project Management

```typescript
interface ProjectAPI {
  create(path: string, name: string, template?: string): Promise<ProjectData>;
  open(path: string): Promise<ProjectData>;
  save(): Promise<void>;
  close(): Promise<void>;
  getRecent(): Promise<string[]>;
  addToRecent(path: string): Promise<void>;
  removeFromRecent(path: string): Promise<void>;
}

#### Scene Management

```typescript
interface SceneAPI {
  create(name: string, template?: 'empty' | '2d' | '3d'): Promise<SceneData>;
  load(scenePath: string): Promise<SceneData>;
  save(sceneData: SceneData): Promise<void>;
  delete(scenePath: string): Promise<void>;
  list(): Promise<string[]>;
  validate(sceneData: SceneData): Promise<ValidationResult>;
}

interface SceneData {
  format: 'worldenv-scene';
  version: string;
  metadata: {
    name: string;
    description?: string;
    created: string;
    modified: string;
    author?: string;
  };
  settings: {
    gravity: Vector3;
    ambientLight: Color;
    fogEnabled: boolean;
    fogColor?: Color;
    fogDensity?: number;
  };
  entities: EntityData[];
}

interface EntityData {
  id: string;
  name: string;
  active: boolean;
  parent?: string;
  children: string[];
  components: ComponentData[];
  transform: {
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
  };
}

// Usage
const scene = await window.worldedit.scene.create("MainLevel", "3d");
await window.worldedit.scene.save(sceneData);
const loadedScene = await window.worldedit.scene.load("scenes/MainLevel.scene.json");
```

#### Engine Status

```typescript
interface EngineAPI {
  getStatus(): Promise<EngineStatus>;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  restart(): Promise<void>;
}

interface EngineStatus {
  state: 'initializing' | 'ready' | 'error';
  message: string;
  worldcAvailable: boolean;
  lastUpdate: Date;
}

// Usage
const status = await window.worldedit.engine.getStatus();
if (status.state === 'ready') {
  // Engine is ready for operations
}
```

// Usage
const project = await window.worldedit.project.create(
  "/path/to/project",
  "MyGame",
  "2d-platformer"
);
```

#### File System Operations

```typescript
interface FileSystemAPI {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  readJSON<T>(path: string): Promise<T>;
  writeJSON<T>(path: string, data: T): Promise<void>;
  exists(path: string): Promise<boolean>;
  isFile(path: string): Promise<boolean>;
  isDirectory(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<FileStats>;
  watch(path: string, callback: (event: string, filename: string) => void): Promise<void>;
  unwatch(path: string): Promise<void>;
}

// Usage
const content = await window.worldedit.fs.readFile("script.wc");
await window.worldedit.fs.writeFile("output.txt", "Hello World");

const data = await window.worldedit.fs.readJSON<ProjectData>("project.json");
await window.worldedit.fs.writeJSON("config.json", { setting: "value" });
```

#### Dialog Operations

```typescript
interface DialogAPI {
  openFile(options: OpenDialogOptions): Promise<string | null>;
  openDirectory(options: OpenDialogOptions): Promise<string | null>;
  saveFile(options: SaveDialogOptions): Promise<string | null>;
  showMessage(type: 'info' | 'warning' | 'error', title: string, message: string): Promise<void>;
  showConfirm(title: string, message: string): Promise<boolean>;
  showInput(title: string, prompt: string, defaultValue?: string): Promise<string | null>;
}

// Usage
const filePath = await window.worldedit.dialog.openFile({
  title: "Open Script",
  filters: [{ name: "WORLDC", extensions: ["wc"] }]
});

const confirmed = await window.worldedit.dialog.showConfirm(
  "Delete Entity",
  "Are you sure you want to delete this entity?"
);
```

#### Window Management

```typescript
interface WindowAPI {
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  restore(): Promise<void>;
  close(): Promise<void>;
  setTitle(title: string): Promise<void>;
  isMaximized(): Promise<boolean>;
  isMinimized(): Promise<boolean>;
  getBounds(): Promise<Rectangle>;
  setBounds(bounds: Rectangle): Promise<void>;
}

// Usage
await window.worldedit.window.setTitle("WORLDEDIT - MyProject");
const bounds = await window.worldedit.window.getBounds();
```

### Event System

```typescript
interface EventAPI {
  on(channel: string, callback: (...args: any[]) => void): void;
  off(channel: string, callback: (...args: any[]) => void): void;
  once(channel: string, callback: (...args: any[]) => void): void;
  emit(channel: string, ...args: any[]): void;
}

// Usage
window.worldedit.events.on('project:opened', (project: ProjectData) => {
  console.log('Project opened:', project.name);
});

window.worldedit.events.emit('scene:changed', sceneData);
```

## Viewport & Rendering

### Object Selection System

The ObjectSelectionSystem provides advanced 3D object selection with multi-selection support, visual feedback, and raycasting.

```typescript
class ObjectSelectionSystem extends THREE.EventDispatcher {
  // Selection operations
  setSelection(objects: THREE.Object3D[]): void;
  addToSelection(object: THREE.Object3D): void;
  removeFromSelection(object: THREE.Object3D): void;
  clearSelection(): void;
  getSelection(): Set<THREE.Object3D>;
  
  // Visual feedback
  applySelectionHighlight(object: THREE.Object3D): void;
  removeSelectionHighlight(object: THREE.Object3D): void;
  updateSelectionBox(): void;
  
  // Multi-selection
  handleMouseDown(event: MouseEvent): void;
  performSelection(x: number, y: number, multiSelect: boolean): void;
  
  // Configuration
  setSelectableObjects(objects: THREE.Object3D[]): void;
  enableSelection(enabled: boolean): void;
}

interface SelectionEvent {
  type: 'selectionchange';
  selected: THREE.Object3D[];
  deselected: THREE.Object3D[];
  primary: THREE.Object3D | null;
}
```

### Camera Controls Integration

Advanced camera controls with orbit, pan, zoom, and smooth animations.

```typescript
class CameraControlsIntegration {
  // Camera manipulation
  update(): boolean;
  reset(): void;
  
  // Focus operations
  focusOnObject(object: THREE.Object3D, fitOffset?: number): void;
  focusOnBounds(box: THREE.Box3, fitOffset?: number): void;
  setTarget(target: THREE.Vector3): void;
  
  // Animation
  startAnimation(): void;
  stopAnimation(): void;
  
  // Configuration
  setSettings(settings: Partial<CameraControlsSettings>): void;
  enable(enabled: boolean): void;
}

interface CameraControlsSettings {
  enableOrbit: boolean;
  enablePan: boolean;
  enableZoom: boolean;
  enableDamping: boolean;
  dampingFactor: number;
  minDistance: number;
  maxDistance: number;
  rotateSpeed: number;
  panSpeed: number;
  zoomSpeed: number;
  autoRotate: boolean;
}

interface CameraControlsEvent {
  type: 'change' | 'start' | 'end';
  camera: THREE.Camera;
  target: THREE.Vector3;
}
```

### Entity Rendering System

Manages entity-to-visual mapping and component rendering for 3D/2D viewports.

```typescript
class EntityRenderingSystem {
  // Entity management
  addEntity(entity: Entity): void;
  removeEntity(entityId: string): void;
  updateEntity(entityId: string): void;
  
  // Visual creation
  createVisualForEntity(entity: Entity): THREE.Object3D | PIXI.DisplayObject | null;
  updateVisualForEntity(entity: Entity): void;
  
  // Component rendering
  createMeshFromRenderer(component: MeshRendererComponent): THREE.Mesh | null;
  createSpriteFromComponent(component: SpriteComponent): PIXI.Sprite | null;
  createLightFromComponent(component: LightComponent): THREE.Light | null;
  
  // Helpers and visualization
  updateBoundingBox(entityId: string): void;
  createColliderHelper(collider: ColliderComponent): THREE.Object3D | null;
  
  // Settings
  setSettings(settings: Partial<EntityRenderingSettings>): void;
  getSettings(): EntityRenderingSettings;
}

interface EntityRenderingSettings {
  showWireframes: boolean;
  showBounds: boolean;
  showColliders: boolean;
  showLights: boolean;
  showLightHelpers: boolean;
  showCameras: boolean;
  wireframeOpacity: number;
  boundsColor: number;
  colliderColor: number;
  lightHelperSize: number;
  cameraHelperSize: number;
}
```

### Viewport Manager

Unified interface for all viewport operations and system coordination.

```typescript
class ViewportManager {
  // Mode management
  setMode(mode: '2D' | '3D'): void;
  getMode(): '2D' | '3D';
  toggleMode(): void;
  
  // Entity operations
  addEntity(entity: Entity): void;
  removeEntity(entityId: string): void;
  updateEntity(entityId: string): void;
  
  // Selection
  getSelectionSystem(): ObjectSelectionSystem | null;
  onSelectionChange(callback: (objects: THREE.Object3D[]) => void): void;
  
  // Camera operations
  getCameraControls(): CameraControlsIntegration | null;
  resetCamera(): void;
  focusOnSelection(): void;
  setCameraPreset(preset: CameraPreset): void;
  
  // Rendering systems
  getEntityRenderingSystem(): EntityRenderingSystem | null;
  getManipulatorManager(): ManipulatorManager | null;
  
  // Settings
  setGridVisible(visible: boolean): void;
  setGizmosVisible(visible: boolean): void;
  setAxesVisible(visible: boolean): void;
}

type CameraPreset = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'perspective';
```

### Manipulator System

Transform gizmos and manipulation tools for object editing.

```typescript
class ManipulatorManager extends THREE.Group {
  // Mode management
  setMode(mode: ManipulatorMode): void;
  getMode(): ManipulatorMode;
  
  // Target management
  setTargets(targets: THREE.Object3D[]): void;
  getTargets(): THREE.Object3D[];
  clearTargets(): void;
  
  // Transform operations
  setTransformSpace(space: TransformSpace): void;
  getTransformSpace(): TransformSpace;
  
  // Updates
  update(): void;
  setEnabled(enabled: boolean): void;
}

enum ManipulatorMode {
  SELECT = 'select',
  TRANSLATE = 'translate',
  ROTATE = 'rotate',
  SCALE = 'scale'
}

enum TransformSpace {
  WORLD = 'world',
  LOCAL = 'local'
}

interface ManipulatorChangeEvent {
  mode: ManipulatorMode;
  targets: THREE.Object3D[];
  transformType: 'start' | 'update' | 'end';
  values?: {
    position?: THREE.Vector3;
    rotation?: THREE.Euler;
    scale?: THREE.Vector3;
  };
}
```

## Component System

### Base Component

```typescript
abstract class Component {
  readonly id: string;
  readonly entityId: string;
  protected properties: Map<string, ComponentProperty>;
  
  abstract getType(): string;
  
  protected defineProperty<T>(
    name: string,
    defaultValue: T,
    descriptor: PropertyDescriptor<T>
  ): void;
  
  getProperty<T>(name: string): T | undefined;
  setProperty<T>(name: string, value: T): void;
  hasProperty(name: string): boolean;
  
  protected abstract initializeProperties(): void;
  
  // Lifecycle methods
  onAttach(entity: Entity): void;
  onDetach(entity: Entity): void;
  onUpdate(deltaTime: number): void;
  onPropertyChanged(name: string, oldValue: any, newValue: any): void;
  
  // Serialization
  serialize(): ComponentData;
  deserialize(data: ComponentData): void;
  
  // Validation
  validate(): ValidationResult;
}
```

### Built-in Components

#### Transform Component

```typescript
class TransformComponent extends Component {
  getType(): string { return 'Transform'; }
  
  // Properties
  get position(): Vector3;
  set position(value: Vector3);
  
  get rotation(): Vector3;
  set rotation(value: Vector3);
  
  get scale(): Vector3;
  set scale(value: Vector3);
  
  // Methods
  translate(delta: Vector3): void;
  rotate(delta: Vector3): void;
  lookAt(target: Vector3): void;
  
  // Hierarchy
  get parent(): TransformComponent | null;
  set parent(value: TransformComponent | null);
  
  get children(): TransformComponent[];
  addChild(child: TransformComponent): void;
  removeChild(child: TransformComponent): void;
  
  // World space transformations
  get worldPosition(): Vector3;
  get worldRotation(): Vector3;
  get worldScale(): Vector3;
  
  localToWorld(point: Vector3): Vector3;
  worldToLocal(point: Vector3): Vector3;
}
```

#### Renderer Component

```typescript
class RendererComponent extends Component {
  getType(): string { return 'Renderer'; }
  
  // Properties
  get mesh(): string;
  set mesh(value: string);
  
  get material(): string;
  set material(value: string);
  
  get visible(): boolean;
  set visible(value: boolean);
  
  get castShadows(): boolean;
  set castShadows(value: boolean);
  
  get receiveShadows(): boolean;
  set receiveShadows(value: boolean);
  
  // Rendering
  updateMaterial(properties: MaterialProperties): void;
  getBounds(): BoundingBox;
  setRenderLayer(layer: number): void;
}
```

#### Script Component

```typescript
class ScriptComponent extends Component {
  getType(): string { return 'Script'; }
  
  // Properties
  get scriptFile(): string;
  set scriptFile(value: string);
  
  get language(): ScriptLanguage;
  set language(value: ScriptLanguage);
  
  get autoLoad(): boolean;
  set autoLoad(value: boolean);
  
  // Script execution
  loadScript(): Promise<void>;
  unloadScript(): void;
  reloadScript(): Promise<void>;
  
  // Script interface
  callMethod(methodName: string, ...args: any[]): any;
  hasMethod(methodName: string): boolean;
  
  // Events
  onScriptLoaded(callback: () => void): void;
  onScriptError(callback: (error: Error) => void): void;
}

enum ScriptLanguage {
  WORLDC = 'worldc',
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript'
}
```

### Component Registry

```typescript
class ComponentRegistry {
  static register<T extends Component>(
    type: string,
    constructor: new () => T,
    metadata?: ComponentMetadata
  ): void;
  
  static unregister(type: string): void;
  
  static create<T extends Component>(type: string): T | null;
  
  static getTypes(): string[];
  
  static getMetadata(type: string): ComponentMetadata | null;
  
  static isRegistered(type: string): boolean;
}

interface ComponentMetadata {
  displayName: string;
  description: string;
  category: string;
  icon?: string;
  deprecated?: boolean;
}

// Usage
ComponentRegistry.register('Transform', TransformComponent, {
  displayName: 'Transform',
  description: 'Position, rotation, and scale in 3D space',
  category: 'Core'
});

const transform = ComponentRegistry.create<TransformComponent>('Transform');
```

## Engine Interface

### Scene Management (IPC-Based)

The Scene Management system operates through IPC channels between the main process and renderer.

```typescript
// Main Process Scene Manager
interface MainProcessSceneManager {
  createScene(projectPath: string, name: string, template: SceneTemplate): Promise<SceneData>;
  loadScene(scenePath: string): Promise<SceneData>;
  saveScene(scenePath: string, sceneData: SceneData): Promise<void>;
  deleteScene(scenePath: string): Promise<void>;
  listScenes(projectPath: string): Promise<string[]>;
  validateScene(sceneData: SceneData): Promise<ValidationResult>;
}

// Renderer Scene Manager
class SceneManager {
  private activeScene: Scene | null = null;
  private sceneCache: Map<string, Scene> = new Map();
  
  async createScene(name: string, template: SceneTemplate = 'empty'): Promise<Scene> {
    const sceneData = await window.worldedit.scene.create(name, template);
    const scene = this.deserializeScene(sceneData);
    this.setActiveScene(scene);
    return scene;
  }
  
  async loadScene(scenePath: string): Promise<Scene> {
    const sceneData = await window.worldedit.scene.load(scenePath);
    const scene = this.deserializeScene(sceneData);
    this.setActiveScene(scene);
    return scene;
  }
  
  async saveActiveScene(): Promise<void> {
    if (this.activeScene) {
      const sceneData = this.serializeScene(this.activeScene);
      await window.worldedit.scene.save(sceneData);
    }
  }
  
  getActiveScene(): Scene | null {
    return this.activeScene;
  }
  
  setActiveScene(scene: Scene | null): void {
    this.activeScene = scene;
    this.emit('activeSceneChanged', scene);
  }
}

class Scene {
  readonly id: string;
  name: string;
  private entities: Map<string, Entity> = new Map();
  private rootEntities: Set<string> = new Set();
  
  // Entity management
  createEntity(name: string = 'Entity'): Entity {
    const entity = new Entity(generateUUID(), name);
    this.addEntity(entity);
    return entity;
  }
  
  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    if (!entity.parent) {
      this.rootEntities.add(entity.id);
    }
    this.emit('entityAdded', entity);
  }
  
  removeEntity(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      // Remove children first
      entity.children.forEach(childId => this.removeEntity(childId));
      
      // Remove from parent
      if (entity.parent) {
        const parent = this.entities.get(entity.parent);
        parent?.removeChild(entityId);
      } else {
        this.rootEntities.delete(entityId);
      }
      
      this.entities.delete(entityId);
      this.emit('entityRemoved', entity);
    }
  }
  
  findEntity(name: string): Entity | null {
    for (const entity of this.entities.values()) {
      if (entity.name === name) {
        return entity;
      }
    }
    return null;
  }
  
  findEntityById(id: string): Entity | null {
    return this.entities.get(id) || null;
  }
  
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }
  
  getRootEntities(): Entity[] {
    return Array.from(this.rootEntities)
      .map(id => this.entities.get(id))
      .filter(entity => entity !== undefined) as Entity[];
  }
  
  // Serialization
  serialize(): SceneData {
    return {
      format: 'worldenv-scene',
      version: '1.0.0',
      metadata: {
        name: this.name,
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      },
      settings: {
        gravity: { x: 0, y: -9.81, z: 0 },
        ambientLight: { r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
        fogEnabled: false
      },
      entities: this.getAllEntities().map(entity => entity.serialize())
    };
  }
  
  deserialize(data: SceneData): void {
    this.name = data.metadata.name;
    this.entities.clear();
    this.rootEntities.clear();
    
    // First pass: create all entities
    data.entities.forEach(entityData => {
      const entity = Entity.deserialize(entityData);
      this.entities.set(entity.id, entity);
    });
    
    // Second pass: establish parent-child relationships
    data.entities.forEach(entityData => {
      const entity = this.entities.get(entityData.id);
      if (entity && entityData.parent) {
        const parent = this.entities.get(entityData.parent);
        if (parent) {
          parent.addChild(entity.id);
          entity.parent = parent.id;
        }
      } else if (entity) {
        this.rootEntities.add(entity.id);
      }
    });
  }
}
```

### Entity System

```typescript
class Entity {
  readonly id: string;
  name: string;
  active: boolean = true;
  visible: boolean = true;
  locked: boolean = false;
  parent: string | null = null;
  children: string[] = [];
  private components: Map<string, IComponent> = new Map();
  
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    
    // Every entity gets a Transform component by default
    this.addComponent(new TransformComponent());
  }
  
  // Component management
  addComponent<T extends IComponent>(component: T): T {
    this.components.set(component.type, component);
    this.emit('componentAdded', component);
    return component;
  }
  
  removeComponent(type: string): boolean {
    const component = this.components.get(type);
    if (component && type !== 'Transform') { // Cannot remove Transform
      this.components.delete(type);
      this.emit('componentRemoved', component);
      return true;
    }
    return false;
  }
  
  getComponent<T extends IComponent>(type: string): T | null {
    return (this.components.get(type) as T) || null;
  }
  
  getComponents(): IComponent[] {
    return Array.from(this.components.values());
  }
  
  hasComponent(type: string): boolean {
    return this.components.has(type);
  }
  
  // Hierarchy management
  addChild(childId: string): void {
    if (!this.children.includes(childId)) {
      this.children.push(childId);
    }
  }
  
  removeChild(childId: string): void {
    const index = this.children.indexOf(childId);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
  }
  
  // Serialization
  serialize(): EntityData {
    return {
      id: this.id,
      name: this.name,
      active: this.active,
      parent: this.parent,
      children: [...this.children],
      components: this.getComponents().map(comp => comp.serialize()),
      transform: {
        position: this.getComponent<TransformComponent>('Transform')?.position || { x: 0, y: 0, z: 0 },
        rotation: this.getComponent<TransformComponent>('Transform')?.rotation || { x: 0, y: 0, z: 0 },
        scale: this.getComponent<TransformComponent>('Transform')?.scale || { x: 1, y: 1, z: 1 }
      }
    };
  }
  
  static deserialize(data: EntityData): Entity {
    const entity = new Entity(data.id, data.name);
    entity.active = data.active;
    entity.parent = data.parent;
    entity.children = [...data.children];
    
    // Deserialize components (Transform is already added in constructor)
    data.components.forEach(compData => {
      if (compData.type !== 'Transform') {
        const component = ComponentRegistry.createComponent(compData.type);
        if (component) {
          component.deserialize(compData);
          entity.addComponent(component);
        }
      } else {
        // Update existing Transform component
        const transform = entity.getComponent<TransformComponent>('Transform');
        if (transform) {
          transform.deserialize(compData);
        }
      }
    });
    
    return entity;
  }
  
  // Utility methods
  isRoot(): boolean {
    return this.parent === null;
  }
  
  hasChildren(): boolean {
    return this.children.length > 0;
  }
  
  getDepth(): number {
    // This would need scene context to traverse parents
    return 0; // Placeholder
  }
}
```

### Viewport Management

```typescript
interface ViewportManager {
  createViewport(containerId: string): Viewport;
  getActiveViewport(): Viewport | null;
  setActiveViewport(viewport: Viewport): void;
  destroyViewport(viewport: Viewport): void;
  
  // Viewport events
  onViewportCreated(callback: (viewport: Viewport) => void): void;
  onViewportDestroyed(callback: (viewport: Viewport) => void): void;
}

class Viewport {
  readonly id: string;
  
  // Camera
  get camera(): Camera;
  set camera(value: Camera);
  
  // Rendering
  render(): void;
  resize(width: number, height: number): void;
  
  // Input
  screenToWorld(screenPos: Vector2): Vector3;
  worldToScreen(worldPos: Vector3): Vector2;
  
  // Selection
  selectObject(screenPos: Vector2): Entity | null;
  getObjectsInRect(rect: Rectangle): Entity[];
  
  // Gizmos
  enableGizmos(enabled: boolean): void;
  setGizmoMode(mode: GizmoMode): void;
  
  // Events
  onObjectSelected(callback: (entity: Entity | null) => void): void;
  onCameraChanged(callback: (camera: Camera) => void): void;
}

enum GizmoMode {
  NONE = 'none',
  TRANSLATE = 'translate',
  ROTATE = 'rotate',
  SCALE = 'scale'
}
```

## Asset Management

**Comprehensive Asset System with Import, Preview, and Drag-and-Drop**

### Asset Browser Panel

Enhanced asset browser with professional file management capabilities.

```typescript
interface AssetBrowserPanel {
  // Asset navigation
  setCurrentPath(path: string): void;
  getCurrentPath(): string;
  navigateUp(): void;
  
  // Asset operations
  importAssets(files: FileList, options?: AssetImportOptions): Promise<AssetItem[]>;
  createFolder(name: string): Promise<void>;
  renameAsset(asset: AssetItem, newName: string): Promise<void>;
  deleteAsset(asset: AssetItem): Promise<void>;
  
  // Asset selection
  selectAsset(asset: AssetItem): void;
  selectMultiple(assets: AssetItem[]): void;
  clearSelection(): void;
  getSelection(): AssetItem[];
  
  // Search and filtering
  setSearchQuery(query: string): void;
  filterByType(types: AssetType[]): void;
  sortBy(field: 'name' | 'size' | 'modified', order: 'asc' | 'desc'): void;
  
  // View modes
  setViewMode(mode: 'grid' | 'list'): void;
  getViewMode(): 'grid' | 'list';
}

interface AssetImportOptions {
  generateThumbnails?: boolean;
  compressImages?: boolean;
  targetDirectory?: string;
  overwriteExisting?: boolean;
}
```

### Asset Item Structure

```typescript
interface AssetItem {
  name: string;
  type: AssetType;
  path: string;
  relativePath: string;
  size: number;
  modified: Date;
  created: Date;
  extension: string;
  metadata: AssetMetadata;
  children?: AssetItem[];
}

interface AssetMetadata {
  id: string;
  imported: Date;
  tags: string[];
  description?: string;
  thumbnail?: string;
  imageInfo?: ImageMetadata;
  audioInfo?: AudioMetadata;
  modelInfo?: ModelMetadata;
}

interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  channels: number;
  compressed: boolean;
}

interface AudioMetadata {
  duration: number;
  channels: number;
  sampleRate: number;
  bitRate: number;
  format: string;
}

interface ModelMetadata {
  vertices: number;
  faces: number;
  animations: string[];
  materials: string[];
}
```

### Asset Import Pipeline

```typescript
class AssetImportPipeline {
  // Import operations
  async importFiles(filePaths: string[], options?: AssetImportOptions): Promise<AssetItem[]>;
  async importSingleFile(filePath: string, options?: AssetImportOptions): Promise<AssetItem>;
  
  // Format support
  getSupportedFormats(): string[];
  isFormatSupported(extension: string): boolean;
  
  // Thumbnail generation
  async generateThumbnail(asset: AssetItem): Promise<string>;
  getThumbnailPath(asset: AssetItem): string;
  
  // Metadata extraction
  async extractMetadata(filePath: string, type: AssetType): Promise<AssetMetadata>;
  
  // Progress tracking
  onProgress(callback: (progress: ImportProgress) => void): void;
}

interface ImportProgress {
  importing: boolean;
  progress: number;
  currentFile?: string;
  completedFiles: number;
  totalFiles: number;
}
```

### Asset Properties Dialog

```typescript
interface AssetPropertiesDialog {
  // Display
  show(asset: AssetItem): void;
  hide(): void;
  isVisible(): boolean;
  
  // Metadata editing
  updateTags(tags: string[]): void;
  updateDescription(description: string): void;
  saveChanges(): Promise<void>;
  
  // Events
  onSave(callback: (asset: AssetItem, metadata: Partial<AssetMetadata>) => void): void;
  onCancel(callback: () => void): void;
}
```

### Drag-and-Drop Integration

```typescript
interface AssetDragDrop {
  // Drag operations
  startDrag(asset: AssetItem, event: DragEvent): void;
  setDragData(asset: AssetItem): string;
  
  // Drop operations
  handleDrop(event: DragEvent): Promise<void>;
  createEntityFromAsset(asset: AssetItem): Promise<void>;
  
  // Asset-to-component mapping
  mapAssetToComponent(asset: AssetItem): ComponentData;
  getSupportedDropTypes(): AssetType[];
}

interface AssetDropData {
  type: 'asset';
  asset: {
    name: string;
    type: string;
    path: string;
    relativePath: string;
  };
}
```

### IPC Asset Operations

Main process asset management APIs accessible from renderer.

```typescript
interface AssetIPC {
  // File operations
  'asset:list'(relativePath?: string): Promise<AssetItem[]>;
  'asset:import'(args: { filePaths: string[]; options?: AssetImportOptions }): Promise<AssetItem[]>;
  'asset:create-folder'(args: { relativePath: string; name: string }): Promise<void>;
  'asset:rename'(args: { oldPath: string; newName: string }): Promise<void>;
  'asset:delete'(relativePath: string): Promise<void>;
  
  // Search and metadata
  'asset:search'(options: AssetSearchOptions): Promise<AssetItem[]>;
  'asset:get-metadata'(relativePath: string): Promise<AssetMetadata>;
  'asset:update-metadata'(args: { relativePath: string; metadata: Partial<AssetMetadata> }): Promise<void>;
  
  // Thumbnails
  'asset:get-thumbnail'(assetPath: string): Promise<string>;
}

interface AssetSearchOptions {
  query?: string;
  types?: AssetType[];
  tags?: string[];
  dateRange?: { from?: Date; to?: Date };
  sizeRange?: { min?: number; max?: number };
}
```

### Asset Type Support

```typescript
type AssetType =
  | 'folder'
  | 'image'     // PNG, JPG, GIF, WebP, BMP, TIFF
  | 'audio'     // MP3, WAV, OGG, FLAC, AAC, M4A
  | 'model'     // GLTF, GLB, OBJ, FBX, DAE, 3DS
  | 'script'    // JS, TS, WC (WorldC)
  | 'scene'     // Scene files
  | 'material'  // Material definitions
  | 'font'      // TTF, OTF, WOFF, WOFF2
  | 'data'      // JSON, XML, YAML
  | 'shader'    // GLSL, HLSL
  | 'unknown';

// Asset type detection
function getAssetType(filePath: string): AssetType;
function getAssetIcon(type: AssetType): string;
function getSupportedExtensions(type: AssetType): string[];
```

### Keyboard Shortcuts

Asset browser supports comprehensive keyboard navigation:

```typescript
interface AssetKeyboardShortcuts {
  'Delete': 'Delete selected assets';
  'F2': 'Rename selected asset';
  'F5': 'Refresh asset list';
  'Enter': 'Open folder or show properties';
  'Escape': 'Clear selection';
  'Ctrl+A': 'Select all assets';
  'Ctrl+I': 'Import assets';
}
  serialize(): AssetData;
  deserialize(data: AssetData): void;
}
```

### Specific Asset Types

#### Texture Asset

```typescript
class TextureAsset extends Asset {
  readonly type = AssetType.TEXTURE;
  
  get width(): number;
  get height(): number;
  get format(): TextureFormat;
  
  // Texture operations
  getPixelData(): Uint8Array;
  setPixelData(data: Uint8Array): void;
  
  // Compression
  compress(format: TextureFormat): Promise<void>;
  generateMipmaps(): void;
  
  // WebGL integration
  createWebGLTexture(gl: WebGLRenderingContext): WebGLTexture;
}

enum TextureFormat {
  RGB = 'rgb',
  RGBA = 'rgba',
  DXT1 = 'dxt1',
  DXT5 = 'dxt5',
  ETC1 = 'etc1',
  PVRTC = 'pvrtc'
}
```

#### Model Asset

```typescript
class ModelAsset extends Asset {
  readonly type = AssetType.MODEL;
  
  get meshes(): Mesh[];
  get materials(): Material[];
  get animations(): Animation[];
  
  // Model operations
  getMeshByName(name: string): Mesh | null;
  getMaterialByName(name: string): Material | null;
  getBounds(): BoundingBox;
  
  // LOD management
  addLOD(level: number, mesh: Mesh): void;
  getLOD(level: number): Mesh | null;
  
  // Optimization
  optimize(): void;
  calculateNormals(): void;
  calculateTangents(): void;
}
```

## WORLDC Integration

### Compiler Interface

```typescript
interface WorldCCompiler {
  compile(sourceCode: string, options?: CompileOptions): Promise<CompileResult>;
  compileFile(filePath: string, options?: CompileOptions): Promise<CompileResult>;
  
  // Incremental compilation
  updateFile(filePath: string, content: string): Promise<void>;
  getCompiledOutput(filePath: string): string | null;
  
  // Language server
  startLanguageServer(): Promise<void>;
  stopLanguageServer(): void;
  
  // Diagnostics
  getDiagnostics(filePath: string): Diagnostic[];
  
  // Symbols
  getSymbols(filePath: string): Symbol[];
  getCompletions(filePath: string, position: Position): CompletionItem[];
}

interface CompileOptions {
  target: 'typescript' | 'assemblyscript';
  optimization: 'none' | 'basic' | 'aggressive';
  sourceMaps: boolean;
  minify: boolean;
  outputPath?: string;
}

interface CompileResult {
  success: boolean;
  output?: string;
  errors: CompileError[];
  warnings: CompileWarning[];
  sourceMap?: string;
}

interface CompileError {
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}
```

### Language Server Protocol

```typescript
interface LanguageServer {
  initialize(rootPath: string): Promise<void>;
  shutdown(): Promise<void>;
  
  // Document management
  openDocument(uri: string, content: string): void;
  closeDocument(uri: string): void;
  updateDocument(uri: string, content: string): void;
  
  // Language features
  getCompletions(uri: string, position: Position): Promise<CompletionItem[]>;
  getHover(uri: string, position: Position): Promise<Hover | null>;
  getDefinition(uri: string, position: Position): Promise<Location[]>;
  getReferences(uri: string, position: Position): Promise<Location[]>;
  
  // Diagnostics
  getDiagnostics(uri: string): Promise<Diagnostic[]>;
  
  // Code actions
  getCodeActions(uri: string, range: Range): Promise<CodeAction[]>;
  
  // Events
  onDiagnostics(callback: (uri: string, diagnostics: Diagnostic[]) => void): void;
}

interface Position {
  line: number;
  character: number;
}

interface Range {
  start: Position;
  end: Position;
}

interface Location {
  uri: string;
  range: Range;
}

interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText?: string;
}

enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18
}
```

## UI Components

### React Component Framework

```typescript
// Base UI Component
interface UIComponent<P = {}> {
  (props: P): JSX.Element;
}

// Common props
interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// Theme context
interface ThemeContext {
  theme: 'light' | 'dark';
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
}

interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  warning: string;
  error: string;
  success: string;
}
```

### Core UI Components

#### Button Component

```typescript
interface ButtonProps extends BaseProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: (event: React.MouseEvent) => void;
}

const Button: UIComponent<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  children,
  onClick,
  ...props
}) => {
  // Implementation
};
```

#### Input Components

```typescript
interface InputProps extends BaseProps {
  type?: 'text' | 'number' | 'email' | 'password';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  label?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

interface NumberInputProps extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  onChange?: (value: number) => void;
}

interface VectorInputProps extends BaseProps {
  value: Vector2 | Vector3;
  onChange: (value: Vector2 | Vector3) => void;
  labels?: string[];
  min?: number;
  max?: number;
  step?: number;
}
```

#### Panel System

```typescript
interface PanelProps extends BaseProps {
  title?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  actions?: React.ReactNode;
}

interface SplitPanelProps extends BaseProps {
  direction: 'horizontal' | 'vertical';
  split?: number | string;
  onSplitChange?: (split: number) => void;
  minSize?: number;
  maxSize?: number;
}

// Usage
<Panel title="Inspector" collapsible>
  <ComponentEditor component={selectedComponent} />
</Panel>

<SplitPanel direction="horizontal" split="300px">
  <HierarchyPanel />
  <ViewportPanel />
</SplitPanel>
```

## Event System

### Global Event Bus

```typescript
interface EventBus {
  on<T = any>(event: string, callback: (data: T) => void): void;
  off<T = any>(event: string, callback: (data: T) => void): void;
  once<T = any>(event: string, callback: (data: T) => void): void;
  emit<T = any>(event: string, data?: T): void;
  
  // Namespaced events
  namespace(namespace: string): EventBus;
  
  // Event filtering
  filter(predicate: (event: string, data: any) => boolean): EventBus;
  
  // Cleanup
  removeAllListeners(event?: string): void;
  destroy(): void;
}

// Global event bus instance
const eventBus: EventBus;

// Common events
interface EditorEvents {
  'project:opened': ProjectData;
  'project:closed': void;
  'scene:changed': SceneData;
  'entity:selected': Entity | null;
  'component:added': { entity: Entity; component: Component };
  'component:removed': { entity: Entity; componentType: string };
  'asset:imported': Asset;
  'viewport:render': { viewport: Viewport; camera: Camera };
  'build:started': BuildConfiguration;
  'build:completed': BuildResult;
  'build:failed': BuildError;
}

// Type-safe event emission
function emit<K extends keyof EditorEvents>(
  event: K,
  data: EditorEvents[K]
): void;

function on<K extends keyof EditorEvents>(
  event: K,
  callback: (data: EditorEvents[K]) => void
): void;
```

### Component Events

```typescript
interface ComponentEventManager {
  addEventListener<T extends Component>(
    component: T,
    event: string,
    callback: (data: any) => void
  ): void;
  
  removeEventListener<T extends Component>(
    component: T,
    event: string,
    callback: (data: any) => void
  ): void;
  
  dispatchEvent<T extends Component>(
    component: T,
    event: string,
    data?: any
  ): void;
}

// Component-specific events
interface ComponentEvents {
  'property:changed': { property: string; oldValue: any; newValue: any };
  'validation:failed': { property: string; error: string };
  'script:loaded': { scriptPath: string };
  'script:error': { error: Error };
  'transform:changed': { transform: TransformComponent };
  'renderer:materialChanged': { material: Material };
}
```

## Build System

### Build Configuration

```typescript
interface BuildConfiguration {
  targets: BuildTarget[];
  optimization: OptimizationLevel;
  outputDirectory: string;
  sourceMaps: boolean;
  minify: boolean;
  compress: boolean;
  
  // Platform-specific settings
  web?: WebBuildSettings;
  desktop?: DesktopBuildSettings;
  pwa?: PWABuildSettings;
}

enum BuildTarget {
  WEB = 'web',
  DESKTOP = 'desktop',
  PWA = 'pwa'
}

enum OptimizationLevel {
  NONE = 'none',
  BASIC = 'basic',
  AGGRESSIVE = 'aggressive'
}

interface WebBuildSettings {
  htmlTemplate?: string;
  publicPath?: string;
  chunkSizeLimit?: number;
  bundleAnalyzer?: boolean;
}

interface DesktopBuildSettings {
  platforms: ('win32' | 'darwin' | 'linux')[];
  icon?: string;
  autoUpdater?: boolean;
  codeSign?: CodeSignSettings;
}

interface PWABuildSettings {
  manifest: PWAManifest;
  serviceWorker: ServiceWorkerSettings;
  offlineSupport: boolean;
}
```

### Build Pipeline

```typescript
interface BuildPipeline {
  build(config: BuildConfiguration): Promise<BuildResult>;
  
  // Incremental builds
  startWatch(config: BuildConfiguration): Promise<void>;
  stopWatch(): Promise<void>;
  
  // Build steps
  compileScripts(): Promise<CompileResult>;
  processAssets(): Promise<AssetProcessResult>;
  bundleApplication(): Promise<BundleResult>;
  optimizeOutput(): Promise<OptimizationResult>;
  
  // Events
  onBuildStart(callback: () => void): void;
  onBuildEnd(callback: (result: BuildResult) => void): void;
  onBuildError(callback: (error: BuildError) => void): void;
  onProgress(callback: (progress: BuildProgress) => void): void;
}

interface BuildResult {
  success: boolean;
  outputFiles: string[];
  bundleSize: number;
  buildTime: number;
  errors: BuildError[];
  warnings: BuildWarning[];
  assets: ProcessedAsset[];
}

interface BuildProgress {
  stage: BuildStage;
  progress: number; // 0-1
  message: string;
  currentFile?: string;
}

enum BuildStage {
  INIT = 'init',
  COMPILE_SCRIPTS = 'compile_scripts',
  PROCESS_ASSETS = 'process_assets',
  BUNDLE = 'bundle',
  OPTIMIZE = 'optimize',
  FINALIZE = 'finalize'
}
```

## Type Definitions

### Core Data Types

```typescript
// Basic data structures
interface Vector2 {
  x: number;
  y: number;
}

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Vector4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BoundingBox {
  min: Vector3;
  max: Vector3;
}
```

### Project Data Structures

```typescript
interface ProjectData {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  
  // Paths
  rootPath: string;
  assetsPath: string;
  scenesPath: string;
  scriptsPath: string;
  buildPath: string;
  
  // Settings
  settings: ProjectSettings;
  
  // Dependencies
  dependencies: ProjectDependency[];
  
  // Metadata
  createdAt: string;
  modifiedAt: string;
  lastOpenedAt?: string;
}

interface ProjectSettings {
  // Build settings
  buildConfiguration: BuildConfiguration;
  
  // Editor settings
  defaultScene?: string;
  startupScene?: string;
  
  // WORLDC settings
  worldcVersion: string;
  compilerOptions: CompileOptions;
  
  // Asset settings
  assetImportSettings: AssetImportSettings;
  
  // Version control
  gitIgnoreTemplate?: string;
  versionControl?: VersionControlSettings;
}

interface SceneData {
  id: string;
  name: string;
  entities: EntityData[];
  environment: EnvironmentData;
  metadata: SceneMetadata;
}

interface EntityData {
  id: string;
  name: string;
  active: boolean;
  parentId?: string;
  components: ComponentData[];
  children: string[];
}

interface ComponentData {
  type: string;
  properties: Record<string, any>;
  metadata?: ComponentMetadata;
}
```

### Error Handling

```typescript
// Result pattern for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Common error types
class EditorError extends Error {
  readonly code: string;
  readonly context?: Record<string, any>;
  
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message);
    this.name = 'EditorError';
    this.code = code;
    this.context = context;
  }
}

class ValidationError extends EditorError {
  readonly field: string;
  readonly value: any;
  
  constructor(field: string, value: any, message: string) {
    super(message, 'VALIDATION_ERROR', { field, value });
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

class AssetError extends EditorError {
  readonly assetPath: string;
  readonly assetType: AssetType;
  
  constructor(assetPath: string, assetType: AssetType, message: string) {
    super(message, 'ASSET_ERROR', { assetPath, assetType });
    this.name = 'AssetError';
    this.assetPath = assetPath;
    this.assetType = assetType;
  }
}

// Error codes
enum ErrorCode {
  // File system errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DISK_FULL = 'DISK_FULL',
  
  // Project errors
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  INVALID_PROJECT = 'INVALID_PROJECT',
  PROJECT_ALREADY_OPEN = 'PROJECT_ALREADY_OPEN',
  
  // Asset errors
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  CORRUPT_ASSET = 'CORRUPT_ASSET',
  MISSING_DEPENDENCY = 'MISSING_DEPENDENCY',
  
  // Build errors
  COMPILE_ERROR = 'COMPILE_ERROR',
  BUNDLE_ERROR = 'BUNDLE_ERROR',
  OPTIMIZATION_ERROR = 'OPTIMIZATION_ERROR',
  
  // Component errors
  COMPONENT_NOT_FOUND = 'COMPONENT_NOT_FOUND',
  INVALID_COMPONENT = 'INVALID_COMPONENT',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY'
}
```

---

**API Versioning**

This API reference is for WORLDEDIT v0.1.0. APIs may change between versions. Check the changelog for breaking changes and migration guides.

**Error Reporting**

If you encounter issues with the API or find missing documentation, please report them on the [GitHub Issues](https://github.com/elastic-softworks/worldenv/issues) page.

**Contributing**

API improvements and additions are welcome. See the [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md) for contribution guidelines.