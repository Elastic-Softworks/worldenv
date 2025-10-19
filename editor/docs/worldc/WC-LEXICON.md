# WORLDC Lexicon Reference

## Language Version

WORLDC 0.2.0 (Pre-Alpha)
C/C++/TypeScript Hybrid Language for Game Development

---

## Keywords

### Type Keywords

**Primitive Types (C/C++)**
- `char` - 8-bit character
- `short` - 16-bit signed integer
- `int` - 32-bit signed integer
- `long` - 64-bit signed integer
- `float` - 32-bit floating point
- `double` - 64-bit floating point
- `bool` - Boolean type
- `void` - No return value
- `auto` - Type inference (C++11)

**TypeScript Types**
- `string` - String type
- `number` - Number type (float64)
- `boolean` - Boolean type
- `any` - Any type
- `unknown` - Unknown type
- `never` - Never type
- `object` - Object type
- `symbol` - Symbol type
- `bigint` - BigInt type

**Type Modifiers**
- `signed` - Signed integer (default)
- `unsigned` - Unsigned integer
- `const` - Constant value
- `volatile` - Volatile value
- `static` - Static storage
- `extern` - External linkage
- `register` - Register hint (deprecated)
- `inline` - Inline function hint

**Sized Types** (stdint.h)
- `int8_t`, `uint8_t` - 8-bit integers
- `int16_t`, `uint16_t` - 16-bit integers
- `int32_t`, `uint32_t` - 32-bit integers
- `int64_t`, `uint64_t` - 64-bit integers
- `size_t` - Unsigned size type
- `ptrdiff_t` - Pointer difference type

**Vector Types** (SIMD)
- `vec2` - 2D vector (x, y)
- `vec3` - 3D vector (x, y, z)
- `vec4` - 4D vector (x, y, z, w)
- `ivec2`, `ivec3`, `ivec4` - Integer vectors
- `quat` - Quaternion (x, y, z, w)
- `mat3` - 3x3 matrix
- `mat4` - 4x4 matrix

### Control Flow Keywords

**C/C++ Control Flow**
- `if` - Conditional execution
- `else` - Alternative branch
- `switch` - Multi-way branch
- `case` - Switch case
- `default` - Default case
- `for` - Loop iteration
- `while` - Conditional loop
- `do` - Do-while loop
- `break` - Exit loop or switch
- `continue` - Skip to next iteration
- `return` - Return from function
- `goto` - Jump to label (use sparingly)

**TypeScript Control Flow**
- `try` - Exception handling
- `catch` - Exception catch
- `finally` - Finally block
- `throw` - Throw exception
- `async` - Async function
- `await` - Await expression
- `yield` - Generator yield

**WORLDC Simplified Verbiage**
- `edict` - Constant declaration (alternative to `const`)
- `pass` - No-operation statement (do nothing)
- `invoke` - Function call with explicit syntax

### Structure Keywords

**C/C++ Structures**
- `struct` - Define structure (C)
- `union` - Define union
- `enum` - Define enumeration
- `class` - Define class (C++)
- `namespace` - Define namespace (C++)
- `typedef` - Type alias
- `using` - Type alias (C++11)
- `template` - Template definition (C++)

**TypeScript Structures**
- `interface` - Define interface
- `type` - Type alias
- `declare` - Ambient declaration
- `module` - Module declaration
- `export` - Export declaration
- `import` - Import declaration
- `implements` - Class implements interface
- `extends` - Interface/class extension

### Access Modifiers (C++)

- `public` - Public access
- `protected` - Protected access
- `private` - Private access
- `friend` - Friend declaration

### OOP Keywords (C++)

- `this` - Current instance pointer
- `new` - Allocate memory
- `delete` - Deallocate memory
- `virtual` - Virtual function
- `override` - Override specifier
- `final` - Final specifier
- `abstract` - Abstract class
- `operator` - Operator overloading

### Special Values

**C/C++ Values**
- `nullptr` - Null pointer (C++11)
- `NULL` - Null pointer (C)
- `true` - Boolean true
- `false` - Boolean false

**TypeScript Values**
- `null` - Null value
- `undefined` - Undefined value
- `NaN` - Not a Number
- `Infinity` - Positive infinity
- `-Infinity` - Negative infinity
- `false` - Boolean false

### Attributes

**Compiler Hints**
- `@export` - Export function to engine
- `@wasm` - Compile to WebAssembly
- `@inline` - Force inline
- `@noinline` - Prevent inline
- `@simd` - Enable SIMD optimization
- `@hot` - Hot path optimization
- `@cold` - Cold path optimization
- `@pure` - Pure function (no side effects)
- `@const` - Const function
- `@deprecated` - Deprecated warning
- `@nodiscard` - Warn if return value ignored

**Platform Specific**
- `@asm` - Inline assembly
- `@align(N)` - Memory alignment
- `@packed` - Packed structure
- `@visibility(...)` - Symbol visibility

---

## Operators

### Arithmetic Operators

```
+    Addition
-    Subtraction
*    Multiplication
/    Division
%    Modulo
++   Increment (prefix/postfix)
--   Decrement (prefix/postfix)
```

### Compound Assignment

```
+=   Add and assign
-=   Subtract and assign
*=   Multiply and assign
/=   Divide and assign
%=   Modulo and assign
&=   Bitwise AND and assign
|=   Bitwise OR and assign
^=   Bitwise XOR and assign
<<=  Left shift and assign
>>=  Right shift and assign
```

### Comparison Operators

```
==   Equal to
!=   Not equal to
<    Less than
>    Greater than
<=   Less than or equal to
>=   Greater than or equal to
<=>  Three-way comparison (C++20)
```

### Logical Operators

```
&&   Logical AND
||   Logical OR
!    Logical NOT
```

### Bitwise Operators

```
&    Bitwise AND
|    Bitwise OR
^    Bitwise XOR
~    Bitwise NOT
<<   Left shift
>>   Right shift
```

### Pointer and Member Access

```
&    Address-of
*    Dereference
->   Member access (pointer)
.    Member access (object)
::   Scope resolution (C++)
```

### Other Operators

```
?:   Ternary conditional
,    Comma operator
sizeof   Size of type/object
typeof   Type of expression
[]   Array subscript
()   Function call
```

---

## C Standard Library Functions

### stdio.h - Input/Output

**Console Output**
```c
int printf(const char* format, ...);
int fprintf(FILE* stream, const char* format, ...);
int sprintf(char* buffer, const char* format, ...);
int snprintf(char* buffer, size_t size, const char* format, ...);
int puts(const char* str);
int putchar(int c);
int putc(int c, FILE* stream);
```

**Console Input**
```c
int scanf(const char* format, ...);
int fscanf(FILE* stream, const char* format, ...);
int sscanf(const char* str, const char* format, ...);
char* gets(char* str);          // Deprecated
char* fgets(char* str, int n, FILE* stream);
int getchar(void);
int getc(FILE* stream);
```

**File Operations**
```c
FILE* fopen(const char* filename, const char* mode);
int fclose(FILE* stream);
size_t fread(void* ptr, size_t size, size_t count, FILE* stream);
size_t fwrite(const void* ptr, size_t size, size_t count, FILE* stream);
int fseek(FILE* stream, long offset, int origin);
long ftell(FILE* stream);
void rewind(FILE* stream);
int feof(FILE* stream);
int ferror(FILE* stream);
int fflush(FILE* stream);
```

**File Modes**
```c
"r"   - Read
"w"   - Write (truncate)
"a"   - Append
"r+"  - Read/write
"w+"  - Read/write (truncate)
"a+"  - Read/append
"rb"  - Read binary
"wb"  - Write binary
```

### stdlib.h - Standard Library

**Memory Allocation**
```c
void* malloc(size_t size);
void* calloc(size_t count, size_t size);
void* realloc(void* ptr, size_t size);
void free(void* ptr);
```

**Process Control**
```c
void exit(int status);
void abort(void);
int atexit(void (*func)(void));
int system(const char* command);
char* getenv(const char* name);
```

**String Conversion**
```c
int atoi(const char* str);
long atol(const char* str);
long long atoll(const char* str);
double atof(const char* str);
long strtol(const char* str, char** endptr, int base);
double strtod(const char* str, char** endptr);
```

**Random Numbers**
```c
int rand(void);
void srand(unsigned int seed);
int random_range(int min, int max);    // WORLDC extension
float random_float(void);              // WORLDC extension
```

**Sorting and Searching**
```c
void qsort(void* base, size_t count, size_t size,
           int (*compare)(const void*, const void*));
void* bsearch(const void* key, const void* base, size_t count,
              size_t size, int (*compare)(const void*, const void*));
```

**Math Utilities**
```c
int abs(int x);
long labs(long x);
long long llabs(long long x);
div_t div(int numerator, int denominator);
```

### string.h - String Operations

**String Manipulation**
```c
size_t strlen(const char* str);
char* strcpy(char* dest, const char* src);
char* strncpy(char* dest, const char* src, size_t n);
char* strcat(char* dest, const char* src);
char* strncat(char* dest, const char* src, size_t n);
char* strdup(const char* str);
```

**String Comparison**
```c
int strcmp(const char* s1, const char* s2);
int strncmp(const char* s1, const char* s2, size_t n);
int strcasecmp(const char* s1, const char* s2);
int strncasecmp(const char* s1, const char* s2, size_t n);
```

**String Search**
```c
char* strchr(const char* str, int c);
char* strrchr(const char* str, int c);
char* strstr(const char* haystack, const char* needle);
char* strpbrk(const char* s1, const char* s2);
size_t strspn(const char* s1, const char* s2);
size_t strcspn(const char* s1, const char* s2);
char* strtok(char* str, const char* delimiters);
```

**Memory Operations**
```c
void* memcpy(void* dest, const void* src, size_t n);
void* memmove(void* dest, const void* src, size_t n);
void* memset(void* ptr, int value, size_t n);
int memcmp(const void* s1, const void* s2, size_t n);
void* memchr(const void* ptr, int value, size_t n);
```

### math.h - Mathematics

**Trigonometric Functions**
```c
float sinf(float x);
float cosf(float x);
float tanf(float x);
float asinf(float x);
float acosf(float x);
float atanf(float x);
float atan2f(float y, float x);

double sin(double x);
double cos(double x);
double tan(double x);
double asin(double x);
double acos(double x);
double atan(double x);
double atan2(double y, double x);
```

**Hyperbolic Functions**
```c
float sinhf(float x);
float coshf(float x);
float tanhf(float x);
double sinh(double x);
double cosh(double x);
double tanh(double x);
```

**Exponential and Logarithmic**
```c
float expf(float x);
float logf(float x);
float log10f(float x);
float log2f(float x);
float powf(float base, float exp);
float sqrtf(float x);
float cbrtf(float x);

double exp(double x);
double log(double x);
double log10(double x);
double log2(double x);
double pow(double base, double exp);
double sqrt(double x);
double cbrt(double x);
```

**Rounding Functions**
```c
float floorf(float x);
float ceilf(float x);
float roundf(float x);
float truncf(float x);
float fmodf(float x, float y);

double floor(double x);
double ceil(double x);
double round(double x);
double trunc(double x);
double fmod(double x, double y);
```

**Other Math Functions**
```c
float fabsf(float x);
float fminf(float x, float y);
float fmaxf(float x, float y);
float clampf(float x, float min, float max);
float lerpf(float a, float b, float t);

double fabs(double x);
double fmin(double x, double y);
double fmax(double x, double y);
int abs(int x);
```

**Math Constants**
```c
#define M_E         2.71828182845904523536
#define M_LOG2E     1.44269504088896340736
#define M_LOG10E    0.43429448190325182765
#define M_LN2       0.69314718055994530942
#define M_LN10      2.30258509299404568402
#define M_PI        3.14159265358979323846
#define M_PI_2      1.57079632679489661923
#define M_PI_4      0.78539816339744830962
#define M_1_PI      0.31830988618379067154
#define M_2_PI      0.63661977236758134308
#define M_SQRT2     1.41421356237309504880
#define M_SQRT1_2   0.70710678118654752440

#define DEG_TO_RAD  (M_PI / 180.0)
#define RAD_TO_DEG  (180.0 / M_PI)
```

### time.h - Time Functions

```c
time_t time(time_t* timer);
clock_t clock(void);
double difftime(time_t end, time_t start);
struct tm* localtime(const time_t* timer);
struct tm* gmtime(const time_t* timer);
time_t mktime(struct tm* timeptr);
char* asctime(const struct tm* timeptr);
char* ctime(const time_t* timer);
size_t strftime(char* str, size_t maxsize, const char* format, 
                const struct tm* timeptr);
```

**Time Structures**
```c
struct tm {
    int tm_sec;    // Seconds (0-60)
    int tm_min;    // Minutes (0-59)
    int tm_hour;   // Hours (0-23)
    int tm_mday;   // Day of month (1-31)
    int tm_mon;    // Month (0-11)
    int tm_year;   // Years since 1900
    int tm_wday;   // Day of week (0-6)
    int tm_yday;   // Day of year (0-365)
    int tm_isdst;  // Daylight saving time flag
};
```

---

## TypeScript Standard Library

### Global Objects

**Console**
- `console.log()` - Output to console
- `console.error()` - Output error
- `console.warn()` - Output warning
- `console.info()` - Output info
- `console.debug()` - Output debug
- `console.time()` - Start timer
- `console.timeEnd()` - End timer

**JSON**
- `JSON.parse()` - Parse JSON string
- `JSON.stringify()` - Convert to JSON string

**Array Methods**
- `Array.from()` - Create array from iterable
- `Array.isArray()` - Check if array
- `array.push()` - Add to end
- `array.pop()` - Remove from end
- `array.shift()` - Remove from start
- `array.unshift()` - Add to start
- `array.slice()` - Extract section
- `array.splice()` - Change contents
- `array.map()` - Transform elements
- `array.filter()` - Filter elements
- `array.reduce()` - Reduce to value
- `array.forEach()` - Iterate elements
- `array.find()` - Find element
- `array.indexOf()` - Find index

**String Methods**
- `string.length` - String length
- `string.charAt()` - Get character at index
- `string.substring()` - Extract substring
- `string.indexOf()` - Find substring
- `string.split()` - Split into array
- `string.replace()` - Replace text
- `string.toLowerCase()` - Convert to lowercase
- `string.toUpperCase()` - Convert to uppercase
- `string.trim()` - Remove whitespace

**Math**
- `Math.PI` - Pi constant
- `Math.E` - Euler's number
- `Math.abs()` - Absolute value
- `Math.max()` - Maximum value
- `Math.min()` - Minimum value
- `Math.random()` - Random number
- `Math.floor()` - Round down
- `Math.ceil()` - Round up
- `Math.round()` - Round to nearest

**Date**
- `Date.now()` - Current timestamp
- `new Date()` - Create date
- `date.getTime()` - Get timestamp
- `date.getFullYear()` - Get year
- `date.getMonth()` - Get month
- `date.getDate()` - Get day

**Promise**
- `Promise.resolve()` - Resolved promise
- `Promise.reject()` - Rejected promise
- `Promise.all()` - Wait for all
- `Promise.race()` - Wait for first
- `promise.then()` - Success handler
- `promise.catch()` - Error handler
- `promise.finally()` - Cleanup handler

### DOM API

**Document**
- `document.getElementById()` - Get element by ID
- `document.querySelector()` - Query selector
- `document.querySelectorAll()` - Query all selectors
- `document.createElement()` - Create element
- `document.createTextNode()` - Create text node
- `document.addEventListener()` - Add event listener

**Element**
- `element.innerHTML` - Inner HTML
- `element.textContent` - Text content
- `element.className` - CSS class name
- `element.style` - Inline styles
- `element.appendChild()` - Add child
- `element.removeChild()` - Remove child
- `element.addEventListener()` - Add event listener
- `element.getAttribute()` - Get attribute
- `element.setAttribute()` - Set attribute

**Window**
- `window.innerWidth` - Window width
- `window.innerHeight` - Window height
- `window.location` - Current location
- `window.localStorage` - Local storage
- `window.sessionStorage` - Session storage
- `window.requestAnimationFrame()` - Animation frame
- `window.setTimeout()` - Set timeout
- `window.setInterval()` - Set interval

### Web APIs

**Fetch API**
- `fetch()` - HTTP request
- `Response.json()` - Parse JSON response
- `Response.text()` - Parse text response
- `Response.blob()` - Parse blob response

**Canvas API**
- `canvas.getContext()` - Get rendering context
- `ctx.fillRect()` - Fill rectangle
- `ctx.strokeRect()` - Stroke rectangle
- `ctx.arc()` - Draw arc
- `ctx.fillText()` - Fill text
- `ctx.drawImage()` - Draw image

**WebGL API**
- `gl.createShader()` - Create shader
- `gl.shaderSource()` - Set shader source
- `gl.compileShader()` - Compile shader
- `gl.createProgram()` - Create program
- `gl.linkProgram()` - Link program
- `gl.useProgram()` - Use program

**Audio API**
- `new Audio()` - Create audio element
- `audio.play()` - Play audio
- `audio.pause()` - Pause audio
- `audio.volume` - Audio volume
- `AudioContext` - Web Audio API context

### Three.js Integration

**Core**
- `THREE.Scene` - 3D scene container
- `THREE.PerspectiveCamera` - Perspective camera
- `THREE.OrthographicCamera` - Orthographic camera
- `THREE.WebGLRenderer` - WebGL renderer
- `THREE.WebGPURenderer` - WebGPU renderer

**Geometry**
- `THREE.BoxGeometry` - Box geometry
- `THREE.SphereGeometry` - Sphere geometry
- `THREE.PlaneGeometry` - Plane geometry
- `THREE.CylinderGeometry` - Cylinder geometry
- `THREE.ConeGeometry` - Cone geometry
- `THREE.TorusGeometry` - Torus geometry
- `THREE.BufferGeometry` - Custom geometry

**Materials**
- `THREE.MeshBasicMaterial` - Basic material
- `THREE.MeshLambertMaterial` - Lambert material
- `THREE.MeshPhongMaterial` - Phong material
- `THREE.MeshStandardMaterial` - PBR material
- `THREE.MeshPhysicalMaterial` - Physical material
- `THREE.ShaderMaterial` - Custom shader material

**Lights**
- `THREE.AmbientLight` - Ambient lighting
- `THREE.DirectionalLight` - Directional light
- `THREE.PointLight` - Point light
- `THREE.SpotLight` - Spot light
- `THREE.HemisphereLight` - Hemisphere light

**Objects**
- `THREE.Mesh` - 3D mesh object
- `THREE.Group` - Object grouping
- `THREE.Sprite` - 2D sprite in 3D
- `THREE.Line` - Line object
- `THREE.Points` - Point cloud

**Loaders**
- `THREE.GLTFLoader` - GLTF model loader
- `THREE.FBXLoader` - FBX model loader
- `THREE.OBJLoader` - OBJ model loader
- `THREE.TextureLoader` - Texture loader
- `THREE.FontLoader` - Font loader

**Animation**
- `THREE.AnimationMixer` - Animation mixer
- `THREE.AnimationAction` - Animation action
- `THREE.AnimationClip` - Animation clip
- `THREE.KeyframeTrack` - Keyframe track

**Controls**
- `THREE.OrbitControls` - Orbit camera controls
- `THREE.FirstPersonControls` - First person controls
- `THREE.FlyControls` - Fly controls
- `THREE.TrackballControls` - Trackball controls

### Pixi.js Integration

**Core**
- `PIXI.Application` - Main application
- `PIXI.Renderer` - 2D renderer
- `PIXI.Container` - Display object container
- `PIXI.Stage` - Root display object

**Display Objects**
- `PIXI.Sprite` - 2D sprite
- `PIXI.AnimatedSprite` - Animated sprite
- `PIXI.Graphics` - Vector graphics
- `PIXI.Text` - Text rendering
- `PIXI.BitmapText` - Bitmap font text
- `PIXI.TilingSprite` - Tiling sprite
- `PIXI.NineSlicePlane` - Nine-slice sprite

**Textures**
- `PIXI.Texture` - Image texture
- `PIXI.BaseTexture` - Base texture
- `PIXI.RenderTexture` - Render target texture
- `PIXI.TextureCache` - Texture caching
- `PIXI.Spritesheet` - Sprite sheet

**Loaders**
- `PIXI.Loader` - Asset loader
- `PIXI.loader.add()` - Add resource
- `PIXI.loader.load()` - Load resources

**Filters**
- `PIXI.filters.BlurFilter` - Blur effect
- `PIXI.filters.ColorMatrixFilter` - Color matrix
- `PIXI.filters.DisplacementFilter` - Displacement
- `PIXI.filters.DropShadowFilter` - Drop shadow
- `PIXI.filters.GlowFilter` - Glow effect

**Interaction**
- `PIXI.interaction.InteractionManager` - Input handling
- `displayObject.interactive` - Enable interaction
- `displayObject.on()` - Event listeners
- `displayObject.off()` - Remove listeners

**Animation**
- `PIXI.ticker.Ticker` - Animation ticker
- `PIXI.ticker.shared` - Shared ticker
- `ticker.add()` - Add update function
- `ticker.remove()` - Remove update function

**Particles**
- `PIXI.particles.Emitter` - Particle emitter
- `PIXI.particles.ParticleContainer` - Particle container

## WORLDC Libraries

### world-display.h - Display Management

**Window Creation**
```c
Display* display_create(int width, int height, const char* title);
void display_destroy(Display* display);
bool display_should_close(Display* display);
void display_poll_events(Display* display);
```

**Window Properties**
```c
void display_set_title(Display* display, const char* title);
void display_set_size(Display* display, int width, int height);
void display_set_position(Display* display, int x, int y);
void display_set_icon(Display* display, const char* path);
int display_get_width(Display* display);
int display_get_height(Display* display);
float display_get_aspect_ratio(Display* display);
```

**Display Modes**
```c
void display_set_fullscreen(Display* display, bool fullscreen);
void display_set_borderless(Display* display, bool borderless);
void display_set_resizable(Display* display, bool resizable);
void display_set_vsync(Display* display, bool vsync);
void display_maximize(Display* display);
void display_minimize(Display* display);
void display_restore(Display* display);
void display_toggle_fullscreen(Display* display);
bool display_is_fullscreen(Display* display);
bool display_is_minimized(Display* display);
bool display_is_maximized(Display* display);
```

**Resolution**
```c
typedef struct {
    int width;
    int height;
    int refresh_rate;
} Resolution;

void display_set_resolution(Display* display, int width, int height);
Resolution display_get_resolution(Display* display);
Resolution* display_get_available_resolutions(int* count);
int display_get_refresh_rate(Display* display);
```

**Multi-Monitor**
```c
typedef struct {
    int id;
    char name[256];
    int x, y;
    int width, height;
    int refresh_rate;
    bool is_primary;
} Monitor;

int display_get_monitor_count(void);
Monitor* display_get_monitors(int* count);
Monitor* display_get_primary_monitor(void);
void display_set_monitor(Display* display, int monitor_id);
int display_get_current_monitor(Display* display);
```

**Cursor**
```c
void display_set_cursor_visible(Display* display, bool visible);
void display_set_cursor_locked(Display* display, bool locked);
void display_set_cursor_position(Display* display, int x, int y);
void display_set_cursor_icon(Display* display, const char* path);
bool display_is_cursor_visible(Display* display);
bool display_is_cursor_locked(Display* display);
```

### world-render2d.h - 2D Rendering (Pixi.js Backend)

**Renderer**
```c
Renderer2D* renderer2d_create(Display* display);
void renderer2d_destroy(Renderer2D* renderer);
void renderer2d_clear(Renderer2D* renderer, uint32_t color);
void renderer2d_present(Renderer2D* renderer);
void renderer2d_set_blend_mode(Renderer2D* renderer, BlendMode mode);
```

**Sprite System**
```c
Sprite* sprite_create(const char* texture_path);
void sprite_destroy(Sprite* sprite);
void sprite_set_position(Sprite* sprite, float x, float y);
void sprite_set_scale(Sprite* sprite, float x, float y);
void sprite_set_rotation(Sprite* sprite, float radians);
void sprite_set_alpha(Sprite* sprite, float alpha);
void sprite_set_tint(Sprite* sprite, uint32_t color);
void sprite_set_anchor(Sprite* sprite, float x, float y);
void sprite_set_flip(Sprite* sprite, bool flip_x, bool flip_y);
void renderer2d_draw_sprite(Renderer2D* renderer, Sprite* sprite);
```

**Shape Rendering**
```c
void renderer2d_draw_rect(Renderer2D* renderer, float x, float y, 
                          float width, float height, uint32_t color);
void renderer2d_draw_rect_outline(Renderer2D* renderer, float x, float y,
                                   float width, float height, uint32_t color,
                                   float thickness);
void renderer2d_draw_circle(Renderer2D* renderer, float x, float y,
                            float radius, uint32_t color);
void renderer2d_draw_circle_outline(Renderer2D* renderer, float x, float y,
                                     float radius, uint32_t color,
                                     float thickness);
void renderer2d_draw_line(Renderer2D* renderer, float x1, float y1,
                          float x2, float y2, uint32_t color, float thickness);
void renderer2d_draw_polygon(Renderer2D* renderer, vec2* points, int count,
                             uint32_t color);
void renderer2d_draw_triangle(Renderer2D* renderer, vec2 p1, vec2 p2, vec2 p3,
                              uint32_t color);
```

**Text Rendering**
```c
Font* font_load(const char* path, int size);
void font_destroy(Font* font);
void renderer2d_draw_text(Renderer2D* renderer, const char* text,
                          float x, float y, Font* font, uint32_t color);
void renderer2d_draw_text_ex(Renderer2D* renderer, const char* text,
                             float x, float y, Font* font, uint32_t color,
                             float rotation, float scale);
vec2 font_measure_text(Font* font, const char* text);
```

**Texture Management**
```c
Texture* texture_load(const char* path);
Texture* texture_create(int width, int height);
void texture_destroy(Texture* texture);
int texture_get_width(Texture* texture);
int texture_get_height(Texture* texture);
void texture_update(Texture* texture, void* pixels);
```

**Render Targets**
```c
RenderTexture* render_texture_create(int width, int height);
void render_texture_destroy(RenderTexture* target);
void renderer2d_set_target(Renderer2D* renderer, RenderTexture* target);
Texture* render_texture_get_texture(RenderTexture* target);
```

**Camera2D**
```c
Camera2D* camera2d_create(void);
void camera2d_destroy(Camera2D* camera);
void camera2d_set_position(Camera2D* camera, float x, float y);
void camera2d_set_zoom(Camera2D* camera, float zoom);
void camera2d_set_rotation(Camera2D* camera, float radians);
void camera2d_set_viewport(Camera2D* camera, int x, int y, int w, int h);
void renderer2d_set_camera(Renderer2D* renderer, Camera2D* camera);
vec2 camera2d_screen_to_world(Camera2D* camera, vec2 screen_pos);
vec2 camera2d_world_to_screen(Camera2D* camera, vec2 world_pos);
```

**Particle System**
```c
ParticleSystem* particle_system_create(int max_particles);
void particle_system_destroy(ParticleSystem* system);
void particle_system_emit(ParticleSystem* system, float x, float y, int count);
void particle_system_update(ParticleSystem* system, float delta);
void renderer2d_draw_particles(Renderer2D* renderer, ParticleSystem* system);
void particle_system_set_color(ParticleSystem* system, uint32_t color);
void particle_system_set_lifetime(ParticleSystem* system, float min, float max);
void particle_system_set_velocity(ParticleSystem* system, vec2 min, vec2 max);
void particle_system_set_gravity(ParticleSystem* system, vec2 gravity);
```

**Batch Rendering**
```c
void renderer2d_begin_batch(Renderer2D* renderer);
void renderer2d_end_batch(Renderer2D* renderer);
```

### world-render3d.h - 3D Rendering (Three.js Backend)

**Renderer3D**
```c
Renderer3D* renderer3d_create(Display* display);
void renderer3d_destroy(Renderer3D* renderer);
void renderer3d_set_antialias(Renderer3D* renderer, bool enable);
void renderer3d_set_shadows(Renderer3D* renderer, bool enable);
void renderer3d_set_shadow_map_size(Renderer3D* renderer, int size);
void renderer3d_render(Renderer3D* renderer, Scene3D* scene, Camera3D* camera);
```

**Scene3D**
```c
Scene3D* scene3d_create(void);
void scene3d_destroy(Scene3D* scene);
void scene3d_add(Scene3D* scene, void* object);
void scene3d_remove(Scene3D* scene, void* object);
void scene3d_set_background_color(Scene3D* scene, uint32_t color);
void scene3d_set_fog(Scene3D* scene, uint32_t color, float near, float far);
```

**Camera3D**
```c
Camera3D* camera3d_create_perspective(float fov, float aspect,
                                      float near, float far);
Camera3D* camera3d_create_orthographic(float left, float right,
                                        float top, float bottom,
                                        float near, float far);
void camera3d_destroy(Camera3D* camera);
void camera3d_set_position(Camera3D* camera, float x, float y, float z);
void camera3d_look_at(Camera3D* camera, float x, float y, float z);
void camera3d_set_fov(Camera3D* camera, float fov);
void camera3d_set_aspect(Camera3D* camera, float aspect);
vec3 camera3d_get_position(Camera3D* camera);
vec3 camera3d_get_forward(Camera3D* camera);
vec3 camera3d_get_right(Camera3D* camera);
vec3 camera3d_get_up(Camera3D* camera);
```

**Mesh Creation**
```c
Mesh* mesh_create_box(float width, float height, float depth);
Mesh* mesh_create_sphere(float radius, int segments);
Mesh* mesh_create_cylinder(float radius, float height, int segments);
Mesh* mesh_create_cone(float radius, float height, int segments);
Mesh* mesh_create_plane(float width, float height);
Mesh* mesh_create_torus(float radius, float tube, int radial, int tubular);
Mesh* mesh_create_custom(float* vertices, int vertex_count,
                         int* indices, int index_count);
void mesh_destroy(Mesh* mesh);
```

**Mesh Manipulation**
```c
void mesh_set_position(Mesh* mesh, float x, float y, float z);
void mesh_set_rotation(Mesh* mesh, float x, float y, float z);
void mesh_set_scale(Mesh* mesh, float x, float y, float z);
void mesh_set_material(Mesh* mesh, Material* material);
vec3 mesh_get_position(Mesh* mesh);
vec3 mesh_get_rotation(Mesh* mesh);
vec3 mesh_get_scale(Mesh* mesh);
```

**Materials**
```c
Material* material_create_basic(void);
Material* material_create_standard(void);
Material* material_create_phong(void);
Material* material_create_physical(void);
void material_destroy(Material* material);
void material_set_color(Material* material, float r, float g, float b);
void material_set_texture(Material* material, Texture* texture);
void material_set_metalness(Material* material, float value);
void material_set_roughness(Material* material, float value);
void material_set_emissive(Material* material, float r, float g, float b);
void material_set_opacity(Material* material, float opacity);
void material_set_transparent(Material* material, bool transparent);
```

**Lighting**
```c
Light* light_create_ambient(uint32_t color);
Light* light_create_directional(uint32_t color);
Light* light_create_point(uint32_t color);
Light* light_create_spot(uint32_t color, float angle);
void light_destroy(Light* light);
void light_set_position(Light* light, float x, float y, float z);
void light_set_intensity(Light* light, float intensity);
void light_cast_shadow(Light* light, bool cast);
void light_set_distance(Light* light, float distance);
void light_set_decay(Light* light, float decay);
```

**Model Loading**
```c
Model* model_load(const char* path);
void model_destroy(Model* model);
Animation* model_get_animation(Model* model, const char* name);
int model_get_animation_count(Model* model);
```

**Animation**
```c
void animation_play(Animation* anim);
void animation_pause(Animation* anim);
void animation_stop(Animation* anim);
void animation_update(Animation* anim, float delta);
void animation_set_speed(Animation* anim, float speed);
void animation_set_loop(Animation* anim, bool loop);
bool animation_is_playing(Animation* anim);
```

**Skybox**
```c
Skybox* skybox_create(const char* path);
Skybox* skybox_create_from_faces(const char* paths[6]);
void skybox_destroy(Skybox* skybox);
void scene3d_set_skybox(Scene3D* scene, Skybox* skybox);
```

### world-physics.h - Physics Engine (AssemblyScript Backend)

**Physics World**
```c
PhysicsWorld* physics_world_create(void);
void physics_world_destroy(PhysicsWorld* world);
void physics_world_step(PhysicsWorld* world, float delta);
void physics_world_set_gravity(PhysicsWorld* world, float x, float y);
vec2 physics_world_get_gravity(PhysicsWorld* world);
void physics_world_set_iterations(PhysicsWorld* world, int iterations);
void physics_world_add(PhysicsWorld* world, RigidBody* body);
void physics_world_remove(PhysicsWorld* world, RigidBody* body);
```

**Rigid Body**
```c
typedef enum {
    BODY_STATIC,
    BODY_DYNAMIC,
    BODY_KINEMATIC
} BodyType;

RigidBody* rigidbody_create(BodyType type);
void rigidbody_destroy(RigidBody* body);
void rigidbody_set_position(RigidBody* body, float x, float y, float z);
void rigidbody_set_rotation(RigidBody* body, float x, float y, float z);
void rigidbody_set_velocity(RigidBody* body, float x, float y, float z);
void rigidbody_set_angular_velocity(RigidBody* body, float x, float y, float z);
void rigidbody_set_mass(RigidBody* body, float mass);
void rigidbody_set_restitution(RigidBody* body, float restitution);
void rigidbody_set_friction(RigidBody* body, float friction);
void rigidbody_set_linear_damping(RigidBody* body, float damping);
void rigidbody_set_angular_damping(RigidBody* body, float damping);
void rigidbody_set_fixed_rotation(RigidBody* body, bool fixed);
void rigidbody_set_shape(RigidBody* body, Shape* shape);
vec3 rigidbody_get_position(RigidBody* body);
vec3 rigidbody_get_velocity(RigidBody* body);
```

**Forces and Impulses**
```c
void rigidbody_apply_force(RigidBody* body, float x, float y, float z);
void rigidbody_apply_force_at_point(RigidBody* body, float fx, float fy, float fz,
                                    float px, float py, float pz);
void rigidbody_apply_impulse(RigidBody* body, float x, float y, float z);
void rigidbody_apply_torque(RigidBody* body, float x, float y, float z);
void rigidbody_clear_forces(RigidBody* body);
```

**Collision Shapes**
```c
Shape* shape_create_box(float width, float height, float depth);
Shape* shape_create_sphere(float radius);
Shape* shape_create_capsule(float radius, float height);
Shape* shape_create_cylinder(float radius, float height);
Shape* shape_create_cone(float radius, float height);
Shape* shape_create_plane(float width, float height);
Shape* shape_create_mesh(float* vertices, int* indices, int count);
void shape_destroy(Shape* shape);
```

**Constraints**
```c
Constraint* constraint_create_hinge(RigidBody* a, RigidBody* b, vec3 axis);
Constraint* constraint_create_spring(RigidBody* a, RigidBody* b,
                                     float stiffness, float damping);
Constraint* constraint_create_distance(RigidBody* a, RigidBody* b,
                                       float distance);
void constraint_destroy(Constraint* constraint);
```

**Ray Casting**
```c
typedef struct {
    RigidBody* body;
    vec3 point;
    vec3 normal;
    float distance;
} RaycastHit;

bool physics_raycast(PhysicsWorld* world, vec3 origin, vec3 direction,
                     float max_distance, RaycastHit* hit);
int physics_raycast_all(PhysicsWorld* world, vec3 origin, vec3 direction,
                        float max_distance, RaycastHit* hits, int max_hits);
```

**Collision Callbacks**
```c
typedef void (*CollisionCallback)(RigidBody* a, RigidBody* b);
void rigidbody_set_collision_enter_callback(RigidBody* body, CollisionCallback callback);
void rigidbody_set_collision_exit_callback(RigidBody* body, CollisionCallback callback);
void rigidbody_set_collision_stay_callback(RigidBody* body, CollisionCallback callback);
```

### world-audio.h - Audio System

**Audio System**
```c
AudioSystem* audio_system_create(void);
void audio_system_destroy(AudioSystem* audio);
void audio_set_master_volume(AudioSystem* audio, float volume);
void audio_set_music_volume(AudioSystem* audio, float volume);
void audio_set_sfx_volume(AudioSystem* audio, float volume);
float audio_get_master_volume(AudioSystem* audio);
```

**Sound Effects**
```c
Sound* sound_load(const char* path);
void sound_destroy(Sound* sound);
void sound_play(Sound* sound);
void sound_pause(Sound* sound);
void sound_stop(Sound* sound);
void sound_set_volume(Sound* sound, float volume);
void sound_set_pitch(Sound* sound, float pitch);
void sound_set_pan(Sound* sound, float pan);
void sound_set_loop(Sound* sound, bool loop);
bool sound_is_playing(Sound* sound);
```

**Music**
```c
Music* music_load(const char* path);
void music_destroy(Music* music);
void music_play(Music* music);
void music_pause(Music* music);
void music_stop(Music* music);
void music_set_volume(Music* music, float volume);
void music_set_loop(Music* music, bool loop);
void music_fade_in(Music* music, float duration);
void music_fade_out(Music* music, float duration);
bool music_is_playing(Music* music);
```

**3D Audio**
```c
Sound3D* sound3d_create(const char* path);
void sound3d_destroy(Sound3D* sound);
void sound3d_play(Sound3D* sound);
void sound3d_set_position(Sound3D* sound, float x, float y, float z);
void sound3d_set_velocity(Sound3D* sound, float x, float y, float z);
void sound3d_set_min_distance(Sound3D* sound, float distance);
void sound3d_set_max_distance(Sound3D* sound, float distance);
void sound3d_set_rolloff_factor(Sound3D* sound, float factor);
```

**Audio Listener**
```c
void audio_listener_set_position(AudioSystem* audio, float x, float y, float z);
void audio_listener_set_orientation(AudioSystem* audio, vec3 forward, vec3 up);
void audio_listener_set_velocity(AudioSystem* audio, float x, float y, float z);
```

### world-input.h - Input Handling

**Keyboard**
```c
bool is_key_down(int key);
bool is_key_pressed(int key);
bool is_key_released(int key);
```

**Key Codes**
```c
// Letters
#define KEY_A ... KEY_Z  (65-90)

// Numbers
#define KEY_0 ... KEY_9  (48-57)

// Special keys
#define KEY_SPACE       32
#define KEY_ESCAPE      27
#define KEY_ENTER       13
#define KEY_TAB         9
#define KEY_BACKSPACE   8
#define KEY_DELETE      127

// Arrow keys
#define KEY_ARROW_LEFT  37
#define KEY_ARROW_UP    38
#define KEY_ARROW_RIGHT 39
#define KEY_ARROW_DOWN  40

// Function keys
#define KEY_F1 ... KEY_F12  (112-123)

// Modifiers
#define KEY_SHIFT       16
#define KEY_CONTROL     17
#define KEY_ALT         18
```

**Mouse**
```c
bool is_mouse_button_down(int button);  // 0=left, 1=middle, 2=right
bool is_mouse_button_pressed(int button);
bool is_mouse_button_released(int button);
vec2 get_mouse_position(void);
vec2 get_mouse_delta(void);
float get_mouse_wheel(void);
```

**Gamepad**
```c
typedef struct {
    bool connected;
    char name[256];
    float axes[6];
    bool buttons[16];
} Gamepad;

Gamepad* input_get_gamepad(int index);
bool gamepad_is_connected(int index);
bool gamepad_is_button_down(Gamepad* pad, int button);
vec2 gamepad_get_left_stick(Gamepad* pad);
vec2 gamepad_get_right_stick(Gamepad* pad);
float gamepad_get_left_trigger(Gamepad* pad);
float gamepad_get_right_trigger(Gamepad* pad);
void gamepad_vibrate(Gamepad* pad, float left, float right, float duration);
```

**Gamepad Buttons**
```c
#define BUTTON_A            0
#define BUTTON_B            1
#define BUTTON_X            2
#define BUTTON_Y            3
#define BUTTON_LB           4
#define BUTTON_RB           5
#define BUTTON_LT           6
#define BUTTON_RT           7
#define BUTTON_SELECT       8
#define BUTTON_START        9
#define BUTTON_L_STICK      10
#define BUTTON_R_STICK      11
#define BUTTON_DPAD_UP      12
#define BUTTON_DPAD_DOWN    13
#define BUTTON_DPAD_LEFT    14
#define BUTTON_DPAD_RIGHT   15
```

### world-time.h - Time Management

**Time Functions**
```c
float get_delta_time(void);
float get_time(void);
uint64_t get_frame_count(void);
float get_fps(void);
float get_fixed_delta_time(void);
```

**Time Scaling**
```c
void time_set_scale(float scale);
float time_get_scale(void);
void time_pause(void);
void time_resume(void);
bool time_is_paused(void);
```

**Timers**
```c
Timer* timer_create(float duration, bool repeat);
void timer_destroy(Timer* timer);
void timer_start(Timer* timer);
void timer_stop(Timer* timer);
void timer_reset(Timer* timer);
bool timer_is_finished(Timer* timer);
float timer_get_elapsed(Timer* timer);
float timer_get_remaining(Timer* timer);
```

### world-memory.h - Memory Management

**Custom Allocators**
```c
typedef enum {
    ALLOCATOR_LINEAR,
    ALLOCATOR_STACK,
    ALLOCATOR_POOL,
    ALLOCATOR_BUDDY
} AllocatorType;

Allocator* allocator_create(AllocatorType type, size_t size);
void allocator_destroy(Allocator* allocator);
void* allocator_alloc(Allocator* allocator, size_t size);
void allocator_free(Allocator* allocator, void* ptr);
void allocator_reset(Allocator* allocator);
```

**Memory Pools**
```c
MemoryPool* pool_create(size_t element_size, size_t count);
void pool_destroy(MemoryPool* pool);
void* pool_alloc(MemoryPool* pool);
void pool_free(MemoryPool* pool, void* ptr);
size_t pool_get_used(MemoryPool* pool);
size_t pool_get_free(MemoryPool* pool);
```

**Arena Allocation**
```c
Arena* arena_create(size_t size);
void arena_destroy(Arena* arena);
void* arena_alloc(Arena* arena, size_t size);
void arena_clear(Arena* arena);
size_t arena_get_used(Arena* arena);
```

**Memory Tracking**
```c
size_t memory_get_used(void);
size_t memory_get_peak(void);
size_t memory_get_allocation_count(void);
void memory_print_stats(void);
void memory_track_enable(bool enable);
```

---

## JIT Compiler Interface

```c
JITCompiler* jit_create(void);
void jit_destroy(JITCompiler* jit);
JITFunction* jit_compile(JITCompiler* jit, const char* code);
void jit_free_function(JITFunction* func);
const char* jit_get_error(JITCompiler* jit);

// Calling compiled functions
int jit_call_int(JITFunction* func, ...);
float jit_call_float(JITFunction* func, ...);
void* jit_call_ptr(JITFunction* func, ...);

// Hot reload
void jit_hot_reload(JITCompiler* jit, const char* filepath);
void jit_set_hot_reload_callback(JITCompiler* jit, void (*callback)(void));
```

---

## Compilation Flags

```bash
# Optimization levels
-O0         No optimization (debug)
-O1         Basic optimization
-O2         Full optimization (default)
-O3         Aggressive optimization
-Os         Optimize for size

# Target selection
--target typescript      Compile to TypeScript
--target assemblyscript  Compile to AssemblyScript
--target wasm           Compile to WebAssembly

# Debug options
--debug                 Include debug symbols
--sourcemap            Generate source maps
--verbose              Verbose compilation output
--profile              Enable profiling instrumentation

# Code generation
--simd                 Enable SIMD optimizations
--lto                  Link-time optimization
--inline-threshold N   Inline function threshold
```

---

## Version and Support

WORLDC Language Version: 0.2.0
Specification Date: October 2025
Implementation: Pre-Alpha Development

## References

- WORLDC Manual: `WC-MANUAL.md`
- C89 Standard: ISO/IEC 9899:1990
- C11 Standard: ISO/IEC 9899:2011
- C++17 Standard: ISO/IEC 14882:2017
- AssemblyScript: https://www.assemblyscript.org