# WORLDEDIT API REFERENCE

**Technical reference for WORLDEDIT APIs and interfaces**

## Table of Contents

- [IPC API](#ipc-api)
- [Component System](#component-system)
- [Engine Interface](#engine-interface)
- [Asset Management](#asset-management)
- [WORLDC Integration](#worldc-integration)
- [UI Components](#ui-components)
- [Event System](#event-system)
- [File System](#file-system)
- [Build System](#build-system)
- [Type Definitions](#type-definitions)

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

### Scene Management

```typescript
interface SceneManager {
  createScene(name: string): Scene;
  loadScene(path: string): Promise<Scene>;
  saveScene(scene: Scene, path: string): Promise<void>;
  getActiveScene(): Scene | null;
  setActiveScene(scene: Scene): void;
  unloadScene(scene: Scene): void;
  
  // Scene events
  onSceneLoaded(callback: (scene: Scene) => void): void;
  onSceneUnloaded(callback: (scene: Scene) => void): void;
  onActiveSceneChanged(callback: (scene: Scene | null) => void): void;
}

class Scene {
  readonly id: string;
  name: string;
  
  // Entity management
  createEntity(name?: string): Entity;
  addEntity(entity: Entity): void;
  removeEntity(entity: Entity): void;
  findEntity(name: string): Entity | null;
  findEntityById(id: string): Entity | null;
  getAllEntities(): Entity[];
  
  // Hierarchy
  getRootEntities(): Entity[];
  
  // Serialization
  serialize(): SceneData;
  deserialize(data: SceneData): void;
  
  // Lifecycle
  update(deltaTime: number): void;
  render(camera: Camera): void;
  
  // Events
  onEntityAdded(callback: (entity: Entity) => void): void;
  onEntityRemoved(callback: (entity: Entity) => void): void;
}
```

### Entity System

```typescript
class Entity {
  readonly id: string;
  name: string;
  active: boolean;
  
  // Component management
  addComponent<T extends Component>(component: T): T;
  removeComponent<T extends Component>(type: string): boolean;
  getComponent<T extends Component>(type: string): T | null;
  getComponents(): Component[];
  hasComponent(type: string): boolean;
  
  // Hierarchy
  get parent(): Entity | null;
  set parent(value: Entity | null);
  
  get children(): Entity[];
  addChild(child: Entity): void;
  removeChild(child: Entity): void;
  
  // Lifecycle
  destroy(): void;
  isDestroyed(): boolean;
  
  // Events
  onComponentAdded(callback: (component: Component) => void): void;
  onComponentRemoved(callback: (component: Component) => void): void;
  onDestroy(callback: () => void): void;
  
  // Serialization
  serialize(): EntityData;
  deserialize(data: EntityData): void;
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

### Asset Manager

```typescript
interface AssetManager {
  importAsset(path: string, type?: AssetType): Promise<Asset>;
  loadAsset<T extends Asset>(id: string): Promise<T>;
  unloadAsset(id: string): void;
  
  // Asset queries
  getAsset<T extends Asset>(id: string): T | null;
  getAssetsByType<T extends Asset>(type: AssetType): T[];
  getAllAssets(): Asset[];
  
  // Asset operations
  duplicateAsset(id: string, newName: string): Promise<Asset>;
  deleteAsset(id: string): Promise<void>;
  renameAsset(id: string, newName: string): Promise<void>;
  
  // Dependencies
  getDependencies(id: string): string[];
  getDependents(id: string): string[];
  
  // Events
  onAssetImported(callback: (asset: Asset) => void): void;
  onAssetLoaded(callback: (asset: Asset) => void): void;
  onAssetUnloaded(callback: (asset: Asset) => void): void;
  onAssetDeleted(callback: (assetId: string) => void): void;
}

enum AssetType {
  TEXTURE = 'texture',
  MODEL = 'model',
  AUDIO = 'audio',
  SCRIPT = 'script',
  SCENE = 'scene',
  PREFAB = 'prefab',
  MATERIAL = 'material',
  ANIMATION = 'animation'
}

abstract class Asset {
  readonly id: string;
  readonly path: string;
  readonly type: AssetType;
  name: string;
  
  abstract load(): Promise<void>;
  abstract unload(): void;
  
  isLoaded(): boolean;
  getSize(): number;
  getMetadata(): AssetMetadata;
  
  // Serialization
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