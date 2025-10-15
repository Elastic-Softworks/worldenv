# WORLDSRC Language Manual

## Introduction

WORLDSRC is a high-performance game programming language designed for WORLDENV. It combines C-like syntax with C++ features, TypeScript capabilities, and modern language features, creating a powerful superset of C, C++, and TypeScript specifically optimized for game development.

**Design Philosophy**: C performance with C++ expressiveness, TypeScript flexibility, and modern conveniences in a unified language that enables mixed-language programming.

**Status**: Design phase. Implementation begins in pre-alpha Phase 15.

## Language Overview

WORLDSRC is:
- **C-based**: Familiar C syntax as foundation
- **C++ enhanced**: Classes, templates, operator overloading, namespaces
- **TypeScript superset**: Full TypeScript compatibility with interfaces, decorators, generics
- **Mixed-language**: C, C++, and TypeScript functions in single files
- **Modern**: Type inference, lambdas, smart pointers, ranges, async/await
- **Performance-first**: Zero-cost abstractions, manual memory control
- **Game-optimized**: Built-in 2D/3D rendering, physics, audio
- **Web-native**: DOM access, Web APIs, Three.js/Pixi.js integration
- **JIT-compiled**: Fast iteration in editor, AOT for production

### Compilation Targets

- **TypeScript**: Development and debugging
- **AssemblyScript**: Production performance (near-native speed)
- **WASM**: Direct WebAssembly for maximum performance
- **JavaScript**: Web deployment with full browser compatibility

## Basic Syntax

### Comments

```worldsrc
// Single-line comment

/* Multi-line comment
   spanning multiple lines */

/** Documentation comment (JSDoc compatible)
 *  @param x The input value
 *  @return Processed result
 */
```

### Variables and Types

```worldsrc
// C-style basic types
int x = 10;                    // 32-bit signed integer
float y = 3.14f;               // 32-bit float
double z = 3.14159265359;      // 64-bit float
char c = 'A';                  // 8-bit character
bool flag = true;              // Boolean type

// TypeScript-style types
let name: string = "Player";   // String type
let health: number = 100;      // Number type (float64)
let active: boolean = true;    // Boolean type
let data: any = { x: 10 };     // Any type
let items: string[] = ["sword", "potion"];  // Array type

// Type inference (works with both styles)
auto velocity = vec3(1.0f, 0.0f, 0.0f);  // C++ style
let position = vec3(0, 0, 0);             // TypeScript style

// Mixed declarations in same file
int score = 0;
string playerName = "Hero";
vec3 spawnPoint = {0.0f, 0.0f, 0.0f};

// Type inference (modern)
auto speed = 5.0f;             // inferred as float
auto name = "Player";          // inferred as const char*

// Constants
const int MAX_HEALTH = 100;
const float PI = 3.14159265359f;

// Unsigned types
unsigned int uid = 42u;
uint8_t byte = 255;
uint16_t word = 65535;
uint32_t dword = 0xFFFFFFFF;
uint64_t qword = 0xFFFFFFFFFFFFFFFF;

// Sized types (explicit)
int8_t   i8  = -128;
int16_t  i16 = -32768;
int32_t  i32 = -2147483648;
int64_t  i64 = -9223372036854775808LL;

// Vector types (SIMD-optimized)
vec2 position = {100.0f, 200.0f};
vec3 color = {1.0f, 0.5f, 0.0f};
vec4 quaternion = {0.0f, 0.0f, 0.0f, 1.0f};
```

### Pointers and References

```worldsrc
// Pointers (C-style)
int* ptr = &x;
int value = *ptr;
ptr = nullptr;                 // Modern null

// References (C++-style)
int& ref = x;                  // Reference to x
ref = 20;                      // Modifies x

// Const correctness
const int* ptr1 = &x;          // Pointer to const int
int* const ptr2 = &x;          // Const pointer to int
const int* const ptr3 = &x;    // Const pointer to const int

// Function pointers
int (*func_ptr)(int, int) = &add;
```

### Arrays and Strings

```worldsrc
// C-style arrays
int numbers[5] = {1, 2, 3, 4, 5};
char buffer[256];
float matrix[4][4];

// Dynamic arrays (C++ std::vector equivalent)
vector<int> dynamic_array;
dynamic_array.push_back(42);

// Strings
const char* cstr = "C-style string";
string str = "Modern string";    // std::string equivalent
str += " concatenated";

// String operations
int len = strlen(cstr);
strcpy(buffer, cstr);
strcmp(str1, str2);
```

## Memory Management

### Manual Memory Management (C-style)

```worldsrc
// malloc, calloc, realloc, free
int* data = (int*)malloc(100 * sizeof(int));
if (data == nullptr) {
    // Handle allocation failure
}
memset(data, 0, 100 * sizeof(int));
free(data);

// calloc (zeroed memory)
float* floats = (float*)calloc(50, sizeof(float));
free(floats);

// realloc
data = (int*)realloc(data, 200 * sizeof(int));
free(data);
```

### Smart Pointers (C++-style)

```worldsrc
// Unique pointer (single ownership)
unique_ptr<Entity> entity = make_unique<Entity>();

// Shared pointer (reference counted)
shared_ptr<Texture> texture = make_shared<Texture>("player.png");

// Weak pointer (non-owning reference)
weak_ptr<Entity> weak_ref = entity;
```

### Memory Operations

```worldsrc
// memcpy, memmove, memset, memcmp
memcpy(dest, src, size);
memmove(dest, src, size);      // Safe for overlapping regions
memset(buffer, 0, size);
int result = memcmp(buf1, buf2, size);

// Placement new (C++)
void* memory = malloc(sizeof(Entity));
Entity* entity = new(memory) Entity();  // Construct in-place
entity->~Entity();             // Manual destructor call
free(memory);
```

## Mixed-Language Programming

### Function Declaration Styles

```worldsrc
// C-style function
int add(int a, int b) {
    return a + b;
}

// TypeScript-style function
function multiply(a: number, b: number): number {
    return a * b;
}

// Arrow function (TypeScript)
const divide = (a: number, b: number): number => a / b;

// Mixed usage in same file
int score = add(10, 5);
let damage = multiply(score, 2);
let ratio = divide(damage, score);

// Default parameters (C++)
float lerp(float a, float b, float t = 0.5f) {
    return a + (b - a) * t;
}

// Optional parameters (TypeScript)
function greet(name: string, title?: string): string {
    return title ? `Hello, ${title} ${name}` : `Hello, ${name}`;
}

// Function overloading (C++)
int max(int a, int b);
float max(float a, float b);
double max(double a, double b);

// TypeScript function overloads
function process(data: string): string;
function process(data: number): number;
function process(data: string | number): string | number {
    return typeof data === 'string' ? data.toUpperCase() : data * 2;
}

// Inline functions
inline int square(int x) {
    return x * x;
}

// Template functions
template<typename T>
T clamp(T value, T min, T max) {
    return value < min ? min : (value > max ? max : value);
}

// Generic functions (TypeScript)
function identity<T>(arg: T): T {
    return arg;
}
```

### Async/Await and Promises

```worldsrc
// Async function declaration
async function loadAssets(): Promise<void> {
    const texture = await loadTexture("player.png");
    const sound = await loadSound("music.ogg");
    const model = await loadModel("character.gltf");
}

// Promise-based API
function loadTexture(path: string): Promise<Texture*> {
    return new Promise((resolve, reject) => {
        const texture = texture_load(path.c_str());
        if (texture) {
            resolve(texture);
        } else {
            reject(new Error(`Failed to load texture: ${path}`));
        }
    });
}

// Mixed sync/async
void initializeGame() {
    // Synchronous C-style initialization
    Display* display = display_create(1920, 1080, "Game");
    Renderer3D* renderer = renderer3d_create();
    
    // Asynchronous asset loading
    loadAssets().then(() => {
        printf("All assets loaded successfully\n");
        startGameLoop();
    }).catch((error) => {
        console.error("Asset loading failed:", error);
    });
}

// Async game loop
async function gameLoop(): Promise<void> {
    while (!display_should_close(display)) {
        const deltaTime = get_delta_time();
        
        // Update game state (C-style)
        updatePhysics(deltaTime);
        updateEntities(deltaTime);
        
        // Render frame
        await renderFrame();
        
        // Process events
        display_poll_events();
    }
}
```

### Lambda Expressions

```worldsrc
// C++ Lambda syntax
auto lambda = [](int x) -> int { return x * 2; };

// TypeScript arrow functions
const arrow = (x: number): number => x * 2;

// Capture by value
int multiplier = 3;
auto mult = [multiplier](int x) { return x * multiplier; };

// Closure in TypeScript
function createMultiplier(factor: number) {
    return (x: number): number => x * factor;
}

// Capture by reference
auto increment = [&multiplier]() { multiplier++; };

// Capture all
auto capture_all_val = [=]() { /* captures all by value */ };
auto capture_all_ref = [&]() { /* captures all by reference */ };

// Event handling with lambdas
canvas.addEventListener("click", (event: MouseEvent) => {
    const x = event.clientX;
    const y = event.clientY;
    handleMouseClick(x, y);
});
```

### Type System Integration

```worldsrc
// Interface definition (TypeScript)
interface Entity {
    id: number;
    position: vec3;
    velocity: vec3;
    update(deltaTime: number): void;
}

// C++ class implementing interface
class Player : public Entity {
    private:
        float health;
        string name;
        
    public:
        Player(const string& playerName) : name(playerName), health(100.0f) {
            position = vec3(0, 0, 0);
            velocity = vec3(0, 0, 0);
        }
        
        void update(float deltaTime) override {
            position = position + velocity * deltaTime;
        }
};

// TypeScript class
class Enemy implements Entity {
    id: number;
    position: vec3;
    velocity: vec3;
    
    constructor(spawnPosition: vec3) {
        this.id = Math.random();
        this.position = spawnPosition;
        this.velocity = vec3(0, 0, 0);
    }
    
    update(deltaTime: number): void {
        // AI logic in TypeScript
        this.velocity = calculateAIMovement(this.position, deltaTime);
        this.position = vec3_add(this.position, vec3_scale(this.velocity, deltaTime));
    }
}

// Mixed usage
vector<Entity*> entities;
entities.push_back(new Player("Hero"));
entities.push_back(new Enemy(vec3(10, 0, 10)));

// Update all entities
for (auto entity : entities) {
    entity->update(get_delta_time());
}
```

## Standard Library Functions

### stdio.h - Input/Output

```worldsrc
// Console output
printf("Hello, %s!\n", name);
fprintf(stderr, "Error: %d\n", code);
sprintf(buffer, "Score: %d", score);

// Console input
scanf("%d", &number);
fgets(buffer, sizeof(buffer), stdin);

// File operations
FILE* file = fopen("data.txt", "r");
if (file != nullptr) {
    fread(buffer, 1, size, file);
    fwrite(data, 1, size, file);
    fclose(file);
}
```

### stdlib.h - Standard Library

```worldsrc
// Memory allocation
void* malloc(size_t size);
void* calloc(size_t count, size_t size);
void* realloc(void* ptr, size_t size);
void free(void* ptr);

// Process control
void exit(int status);
int system(const char* command);

// Random numbers
int rand();
void srand(unsigned int seed);
int random_range(int min, int max);

// String conversion
int atoi(const char* str);
float atof(const char* str);
long atol(const char* str);

// Sorting and searching
void qsort(void* base, size_t count, size_t size, 
           int (*compare)(const void*, const void*));
void* bsearch(const void* key, const void* base, size_t count,
              size_t size, int (*compare)(const void*, const void*));
```

### string.h - String Operations

```worldsrc
// String manipulation
size_t strlen(const char* str);
char* strcpy(char* dest, const char* src);
char* strncpy(char* dest, const char* src, size_t n);
char* strcat(char* dest, const char* src);
int strcmp(const char* s1, const char* s2);
int strncmp(const char* s1, const char* s2, size_t n);
char* strchr(const char* str, int c);
char* strstr(const char* haystack, const char* needle);

// Memory operations
void* memcpy(void* dest, const void* src, size_t n);
void* memmove(void* dest, const void* src, size_t n);
void* memset(void* ptr, int value, size_t n);
int memcmp(const void* s1, const void* s2, size_t n);
```

### math.h - Mathematics

```worldsrc
// Trigonometry
float sin(float x);
float cos(float x);
float tan(float x);
float asin(float x);
float acos(float x);
float atan(float x);
float atan2(float y, float x);

// Exponential and logarithmic
float exp(float x);
float log(float x);
float log10(float x);
float pow(float base, float exp);
float sqrt(float x);

// Rounding
float floor(float x);
float ceil(float x);
float round(float x);
float trunc(float x);

// Absolute value
float fabs(float x);
int abs(int x);

// Min/Max
float fmin(float x, float y);
float fmax(float x, float y);

// Constants
#define M_PI    3.14159265358979323846
#define M_E     2.71828182845904523536
#define M_SQRT2 1.41421356237309504880
```

### time.h - Time Functions

```worldsrc
// Time operations
time_t time(time_t* timer);
clock_t clock();
double difftime(time_t end, time_t start);

// Time structures
struct tm* localtime(const time_t* timer);
struct tm* gmtime(const time_t* timer);
char* asctime(const struct tm* timeptr);
```

## Object-Oriented Programming

### Classes and Structs

```worldsrc
// Struct (C-style, public by default)
struct Point {
    float x;
    float y;
};

// Class (C++-style, private by default)
class Entity {
private:
    int id;
    float health;
    
public:
    // Constructor
    Entity() : id(0), health(100.0f) {}
    
    Entity(int entity_id, float max_health) 
        : id(entity_id), health(max_health) {}
    
    // Destructor
    ~Entity() {
        cleanup();
    }
    
    // Methods
    void damage(float amount) {
        health -= amount;
        if (health < 0.0f) health = 0.0f;
    }
    
    float get_health() const { return health; }
    
    // Static methods
    static int get_count();
    
    // Operator overloading
    bool operator==(const Entity& other) const {
        return id == other.id;
    }
};
```

### Inheritance

```worldsrc
class GameObject {
protected:
    vec2 position;
    vec2 velocity;
    
public:
    virtual void update(float delta) {
        position += velocity * delta;
    }
    
    virtual void render() = 0;  // Pure virtual
    
    virtual ~GameObject() {}
};

class Player : public GameObject {
private:
    float health;
    
public:
    void update(float delta) override {
        // Player-specific update
        GameObject::update(delta);  // Call base
    }
    
    void render() override {
        // Render player
    }
};
```

### Templates

```worldsrc
// Class template
template<typename T>
class Vector {
private:
    T* data;
    size_t capacity;
    size_t count;
    
public:
    Vector() : data(nullptr), capacity(0), count(0) {}
    
    void push_back(const T& value) {
        if (count >= capacity) resize();
        data[count++] = value;
    }
    
    T& operator[](size_t index) { return data[index]; }
    size_t size() const { return count; }
};

// Template specialization
template<>
class Vector<bool> {
    // Specialized implementation for bool
};
```

## Web Integration

### DOM Access

```worldsrc
// Direct DOM manipulation (TypeScript)
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
canvas.width = 1920;
canvas.height = 1080;

// Event handling
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    handleMouseClick(x, y);
});

// Web APIs
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        const video = document.createElement("video");
        video.srcObject = stream;
    });

// Local storage
localStorage.setItem("playerData", JSON.stringify(player));
const savedData = JSON.parse(localStorage.getItem("playerData") || "{}");

// Fetch API
async function loadGameData(url: string): Promise<GameData> {
    const response = await fetch(url);
    return await response.json();
}
```

### Three.js Integration

```worldsrc
// Direct Three.js usage
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

// Mixed with WORLDSRC
void setupScene() {
    Scene3D* worldScene = scene3d_create();
    
    // Use Three.js directly when needed
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // Use WORLDSRC wrappers for game logic
    Light* gameLight = light_create_directional();
    light_set_intensity(gameLight, 1.0f);
}
```

### Pixi.js Integration

```worldsrc
// Direct Pixi.js usage
import * as PIXI from 'pixi.js';

const app = new PIXI.Application({
    width: 800,
    height: 600,
    antialias: true
});

// Mixed with WORLDSRC 2D functions
void render2DGame() {
    Renderer2D* renderer = renderer2d_create();
    
    // Use Pixi.js for complex effects
    const filter = new PIXI.filters.BlurFilter();
    sprite.filters = [filter];
    
    // Use WORLDSRC for game objects
    Sprite* gameSprite = sprite_create();
    renderer2d_draw_sprite(gameSprite);
}
```

## WORLDSRC Standard Libraries

### world-display - Display and Window Management

```worldsrc
#include <world-display.h>

// Window creation and management
Display* display = display_create(800, 600, "Game Title");
display_set_fullscreen(display, true);
display_set_borderless(display, true);
display_set_vsync(display, true);
display_set_resizable(display, false);

// TypeScript integration
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
canvas.width = display_get_width(display);
canvas.height = display_get_height(display);

// Resolution
display_set_resolution(display, 1920, 1080);
Resolution res = display_get_resolution(display);

// Display modes
display_toggle_fullscreen(display);
display_minimize(display);
display_maximize(display);
display_restore(display);

// Display properties
int width = display_get_width(display);
int height = display_get_height(display);
float aspect = display_get_aspect_ratio(display);
int refresh = display_get_refresh_rate(display);

// Multiple monitors
int monitor_count = display_get_monitor_count();
Monitor* monitors = display_get_monitors();

// Event handling with TypeScript
window.addEventListener("resize", () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    display_set_size(display, newWidth, newHeight);
});
display_set_monitor(display, 0);

// Cursor
display_set_cursor_visible(display, false);
display_set_cursor_locked(display, true);
display_set_cursor_position(display, x, y);

// Cleanup
display_destroy(display);
```

### world-render2d - 2D Rendering (Pixi.js)

```worldsrc
#include <world-render2d.h>

// Renderer initialization
Renderer2D* renderer = renderer2d_create(display);

// Sprite rendering
Sprite* sprite = sprite_create("player.png");
sprite_set_position(sprite, 100.0f, 200.0f);
sprite_set_scale(sprite, 2.0f, 2.0f);
sprite_set_rotation(sprite, 45.0f * DEG_TO_RAD);
sprite_set_alpha(sprite, 0.8f);
sprite_set_tint(sprite, 0xFF0000);  // Red tint
renderer2d_draw_sprite(renderer, sprite);

// Shape rendering
renderer2d_draw_rect(renderer, x, y, width, height, color);
renderer2d_draw_circle(renderer, x, y, radius, color);
renderer2d_draw_line(renderer, x1, y1, x2, y2, color, thickness);
renderer2d_draw_polygon(renderer, points, count, color);

// Text rendering
Font* font = font_load("arial.ttf", 24);
renderer2d_draw_text(renderer, "Hello World", x, y, font, color);

// Batch rendering
renderer2d_begin_batch(renderer);
// Draw many sprites
renderer2d_end_batch(renderer);

// Render targets
RenderTexture* target = render_texture_create(512, 512);
renderer2d_set_target(renderer, target);
// Draw to texture
renderer2d_set_target(renderer, nullptr);  // Back to screen

// Camera
Camera2D* camera = camera2d_create();
camera2d_set_position(camera, x, y);
camera2d_set_zoom(camera, 2.0f);
camera2d_set_rotation(camera, angle);
renderer2d_set_camera(renderer, camera);

// Particles
ParticleSystem* particles = particle_system_create(1000);
particle_system_emit(particles, x, y, count);
particle_system_update(particles, delta);
renderer2d_draw_particles(renderer, particles);
```

### world-render3d - 3D Rendering (Three.js)

```worldsrc
#include <world-render3d.h>

// Renderer initialization
Renderer3D* renderer = renderer3d_create(display);
renderer3d_set_antialias(renderer, true);
renderer3d_set_shadows(renderer, true);

// Scene and camera
Scene3D* scene = scene3d_create();
Camera3D* camera = camera3d_create_perspective(
    75.0f,      // FOV
    aspect,     // Aspect ratio
    0.1f,       // Near plane
    1000.0f     // Far plane
);
camera3d_set_position(camera, 0.0f, 5.0f, 10.0f);
camera3d_look_at(camera, 0.0f, 0.0f, 0.0f);

// Mesh creation
Mesh* cube = mesh_create_box(1.0f, 1.0f, 1.0f);
mesh_set_position(cube, 0.0f, 0.0f, 0.0f);
mesh_set_rotation(cube, 0.0f, 45.0f * DEG_TO_RAD, 0.0f);
mesh_set_scale(cube, 2.0f, 2.0f, 2.0f);

// Materials
Material* material = material_create_standard();
material_set_color(material, 1.0f, 0.0f, 0.0f);
material_set_metalness(material, 0.5f);
material_set_roughness(material, 0.5f);
material_set_texture(material, texture);
mesh_set_material(cube, material);

// Lighting
Light* ambient = light_create_ambient(0x404040);
Light* directional = light_create_directional(0xFFFFFF);
light_set_position(directional, 5.0f, 10.0f, 7.5f);
light_set_intensity(directional, 1.0f);
light_cast_shadow(directional, true);

// Add to scene
scene3d_add(scene, cube);
scene3d_add(scene, ambient);
scene3d_add(scene, directional);

// Skybox
Skybox* skybox = skybox_create("sky.hdr");
scene3d_set_skybox(scene, skybox);

// Render
renderer3d_render(renderer, scene, camera);

// Model loading
Model* model = model_load("character.gltf");
scene3d_add(scene, model);

// Animation
Animation* anim = model_get_animation(model, "Walk");
animation_play(anim);
animation_update(anim, delta);
```

### world-physics - Physics Engine (AssemblyScript)

```worldsrc
#include <world-physics.h>

// Physics world
PhysicsWorld* world = physics_world_create();
physics_world_set_gravity(world, 0.0f, -9.81f);

// Rigid bodies
RigidBody* body = rigidbody_create(BODY_DYNAMIC);
rigidbody_set_position(body, 0.0f, 10.0f, 0.0f);
rigidbody_set_mass(body, 1.0f);
rigidbody_set_restitution(body, 0.8f);  // Bounciness
rigidbody_set_friction(body, 0.5f);
rigidbody_set_linear_damping(body, 0.1f);
rigidbody_set_angular_damping(body, 0.1f);

// Collision shapes
Shape* box = shape_create_box(1.0f, 1.0f, 1.0f);
Shape* sphere = shape_create_sphere(0.5f);
Shape* capsule = shape_create_capsule(0.5f, 2.0f);
Shape* mesh_shape = shape_create_mesh(vertices, indices);
rigidbody_set_shape(body, box);

// Forces and impulses
rigidbody_apply_force(body, 100.0f, 0.0f, 0.0f);
rigidbody_apply_impulse(body, 10.0f, 0.0f, 0.0f);
rigidbody_apply_torque(body, 0.0f, 50.0f, 0.0f);

// Constraints
Constraint* hinge = constraint_create_hinge(body1, body2, axis);
Constraint* spring = constraint_create_spring(body1, body2, 
                                              stiffness, damping);

// Ray casting
RaycastHit hit;
if (physics_raycast(world, origin, direction, distance, &hit)) {
    RigidBody* hit_body = hit.body;
    vec3 hit_point = hit.point;
    vec3 hit_normal = hit.normal;
}

// Collision detection
void on_collision_enter(RigidBody* a, RigidBody* b) {
    // Handle collision
}

rigidbody_set_collision_callback(body, on_collision_enter);

// Simulation
physics_world_step(world, delta);
```

### world-audio - Audio System

```worldsrc
#include <world-audio.h>

// Audio initialization
AudioSystem* audio = audio_system_create();

// Sound effects
Sound* sound = sound_load("explosion.wav");
sound_play(sound);
sound_set_volume(sound, 0.8f);
sound_set_pitch(sound, 1.2f);
sound_set_pan(sound, -0.5f);  // -1.0 (left) to 1.0 (right)

// Music
Music* music = music_load("bgm.mp3");
music_play(music);
music_set_loop(music, true);
music_set_volume(music, 0.6f);
music_fade_in(music, 2.0f);   // 2 second fade
music_fade_out(music, 2.0f);

// 3D audio
Sound3D* sound3d = sound3d_create("ambient.wav");
sound3d_set_position(sound3d, x, y, z);
sound3d_set_velocity(sound3d, vx, vy, vz);
sound3d_set_min_distance(sound3d, 1.0f);
sound3d_set_max_distance(sound3d, 100.0f);
sound3d_play(sound3d);

// Listener
audio_listener_set_position(audio, x, y, z);
audio_listener_set_orientation(audio, forward, up);
audio_listener_set_velocity(audio, vx, vy, vz);

// Master controls
audio_set_master_volume(audio, 1.0f);
audio_set_music_volume(audio, 0.7f);
audio_set_sfx_volume(audio, 0.9f);
```

### world-input - Input Handling

```worldsrc
#include <world-input.h>

// Keyboard
bool is_key_down(int key);
bool is_key_pressed(int key);    // Single frame
bool is_key_released(int key);   // Single frame

// Key codes
#define KEY_A           65
#define KEY_SPACE       32
#define KEY_ESCAPE      27
#define KEY_ARROW_LEFT  37
#define KEY_ARROW_UP    38
#define KEY_ARROW_RIGHT 39
#define KEY_ARROW_DOWN  40

// Mouse
bool is_mouse_button_down(int button);  // 0=left, 1=middle, 2=right
vec2 get_mouse_position();
vec2 get_mouse_delta();
float get_mouse_wheel();

// Gamepad
Gamepad* gamepad = input_get_gamepad(0);  // Player 1
bool gamepad_is_button_down(gamepad, BUTTON_A);
vec2 gamepad_get_left_stick(gamepad);
vec2 gamepad_get_right_stick(gamepad);
float gamepad_get_left_trigger(gamepad);
float gamepad_get_right_trigger(gamepad);
```

### world-time - Time Management

```worldsrc
#include <world-time.h>

// Time information
float get_delta_time();          // Time since last frame
float get_time();                // Total elapsed time
uint64_t get_frame_count();      // Total frames rendered
float get_fps();                 // Current FPS

// Time scaling
time_set_scale(0.5f);            // Slow motion
time_set_scale(2.0f);            // Fast forward
time_pause();
time_resume();

// Timers
Timer* timer = timer_create(5.0f, false);  // 5 seconds, no repeat
timer_start(timer);
if (timer_is_finished(timer)) {
    // Timer done
}
```

### world-memory - Memory Management

```worldsrc
#include <world-memory.h>

// Custom allocators
Allocator* allocator = allocator_create_linear(1024 * 1024);  // 1MB
void* ptr = allocator_alloc(allocator, 256);
allocator_free(allocator, ptr);
allocator_reset(allocator);  // Reset linear allocator

// Memory pools
MemoryPool* pool = pool_create(sizeof(Entity), 1000);
Entity* entity = (Entity*)pool_alloc(pool);
pool_free(pool, entity);

// Memory tracking
size_t used = memory_get_used();
size_t peak = memory_get_peak();
void memory_print_stats();

// Arena allocation
Arena* arena = arena_create(1024 * 1024);
void* temp = arena_alloc(arena, 128);
// No individual free, destroy arena to free all
arena_destroy(arena);
```

## JIT Compilation

### Compiler Interface

```worldsrc
// Compile and execute code at runtime
JITCompiler* jit = jit_create();

const char* code = R"(
    int factorial(int n) {
        return n <= 1 ? 1 : n * factorial(n - 1);
    }
)";

// Compile to function
JITFunction* func = jit_compile(jit, code);
if (func == nullptr) {
    printf("Compilation error: %s\n", jit_get_error(jit));
    return;
}

// Call compiled function
int result = jit_call_int(func, 5);  // result = 120

// Hot reload
jit_hot_reload(jit, "game_logic.ws");
```

## Complete Example Programs

### Example 1: 2D Platformer Character Controller

```worldsrc
#include <world-display.h>
#include <world-render2d.h>
#include <world-physics.h>
#include <world-input.h>

struct Player {
    RigidBody* body;
    Sprite* sprite;
    float speed;
    float jump_force;
    bool grounded;
};

Player* player_create(PhysicsWorld* world) {
    Player* p = (Player*)malloc(sizeof(Player));
    
    p->body = rigidbody_create(BODY_DYNAMIC);
    rigidbody_set_position(p->body, 400.0f, 300.0f, 0.0f);
    rigidbody_set_fixed_rotation(p->body, true);
    
    Shape* box = shape_create_box(32.0f, 64.0f, 1.0f);
    rigidbody_set_shape(p->body, box);
    
    p->sprite = sprite_create("player.png");
    p->speed = 200.0f;
    p->jump_force = 500.0f;
    p->grounded = false;
    
    physics_world_add(world, p->body);
    
    return p;
}

void player_update(Player* p, float delta) {
    vec3 velocity = rigidbody_get_velocity(p->body);
    
    // Horizontal movement
    if (is_key_down(KEY_ARROW_LEFT)) {
        velocity.x = -p->speed;
    } else if (is_key_down(KEY_ARROW_RIGHT)) {
        velocity.x = p->speed;
    } else {
        velocity.x = 0.0f;
    }
    
    // Jump
    if (is_key_pressed(KEY_SPACE) && p->grounded) {
        velocity.y = p->jump_force;
        p->grounded = false;
    }
    
    rigidbody_set_velocity(p->body, velocity.x, velocity.y, 0.0f);
    
    // Update sprite position
    vec3 pos = rigidbody_get_position(p->body);
    sprite_set_position(p->sprite, pos.x, pos.y);
}

void player_on_collision(Player* p, RigidBody* other) {
    p->grounded = true;
}

int main() {
    Display* display = display_create(800, 600, "Platformer");
    Renderer2D* renderer = renderer2d_create(display);
    PhysicsWorld* world = physics_world_create();
    physics_world_set_gravity(world, 0.0f, -980.0f);
    
    Player* player = player_create(world);
    
    while (!display_should_close(display)) {
        float delta = get_delta_time();
        
        player_update(player, delta);
        physics_world_step(world, delta);
        
        renderer2d_clear(renderer, 0x87CEEB);  // Sky blue
        renderer2d_draw_sprite(renderer, player->sprite);
        renderer2d_present(renderer);
    }
    
    return 0;
}
```

### Example 2: 3D FPS Camera Controller

```worldsrc
#include <world-display.h>
#include <world-render3d.h>
#include <world-input.h>

class FPSController {
private:
    Camera3D* camera;
    vec3 position;
    vec3 rotation;
    float move_speed;
    float look_speed;
    
public:
    FPSController(Camera3D* cam) : camera(cam) {
        position = {0.0f, 1.8f, 0.0f};
        rotation = {0.0f, 0.0f, 0.0f};
        move_speed = 5.0f;
        look_speed = 0.002f;
    }
    
    void update(float delta) {
        // Mouse look
        vec2 mouse_delta = get_mouse_delta();
        rotation.y -= mouse_delta.x * look_speed;
        rotation.x -= mouse_delta.y * look_speed;
        
        // Clamp pitch
        rotation.x = clamp(rotation.x, -M_PI/2, M_PI/2);
        
        // Calculate forward and right vectors
        vec3 forward = {
            sin(rotation.y) * cos(rotation.x),
            sin(rotation.x),
            cos(rotation.y) * cos(rotation.x)
        };
        vec3 right = vec3_cross({0, 1, 0}, forward);
        
        // Movement
        vec3 move = {0, 0, 0};
        if (is_key_down(KEY_W)) move += forward;
        if (is_key_down(KEY_S)) move -= forward;
        if (is_key_down(KEY_D)) move += right;
        if (is_key_down(KEY_A)) move -= right;
        
        if (vec3_length(move) > 0) {
            move = vec3_normalize(move);
            position += move * move_speed * delta;
        }
        
        // Update camera
        camera3d_set_position(camera, position.x, position.y, position.z);
        vec3 look_at = position + forward;
        camera3d_look_at(camera, look_at.x, look_at.y, look_at.z);
    }
};
```

## Performance Optimization

### Profile-Guided Optimization

```worldsrc
// Mark hot paths
@hot
void critical_loop() {
    // Compiler optimizes aggressively
}

// Mark cold paths
@cold
void error_handler() {
    // Compiler optimizes for size
}
```

### SIMD Operations

```worldsrc
// Automatic SIMD vectorization
@simd
void process_positions(vec3* positions, int count, float delta) {
    for (int i = 0; i < count; i++) {
        positions[i].y += 9.81f * delta;
    }
}
```

### Assembly Integration

```worldsrc
// Inline assembly for critical operations
@asm
void fast_memcpy(void* dest, const void* src, size_t n) {
    __asm__ volatile (
        "rep movsb"
        : "+D"(dest), "+S"(src), "+c"(n)
        :
        : "memory"
    );
}
```

## Best Practices

1. **Memory Management**: Use RAII principles with smart pointers
2. **Performance**: Profile before optimizing, use @wasm for hot paths
3. **Safety**: Check pointers, use const correctness
4. **Code Organization**: Use namespaces, keep functions under 50 lines
5. **Documentation**: Document public APIs, complex algorithms
6. **Error Handling**: Check return values, use assertions
7. **Testing**: Write unit tests, integration tests
8. **Style**: Follow C-Form guidelines for consistency

## Version

WORLDSRC Language Version: 0.2.0 (Pre-Alpha)
Specification Date: October 2025

## References

- WORLDSRC Lexicon: `worldsrc-lexicon.md`
- C89 Standard: ISO/IEC 9899:1990
- C++17 Standard: ISO/IEC 14882:2017
- AssemblyScript: https://www.assemblyscript.org
- WORLDENV Engine: `../engine-overview.md`
