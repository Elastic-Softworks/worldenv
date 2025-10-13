# First-Person 3D Game Template Guide

## Overview

Create a first-person 3D game using WORLDENV engine with Three.js. This guide covers camera controls, 3D movement, collision detection, and basic 3D mechanics.

## Prerequisites

- WORLDENV engine installed
- Basic TypeScript knowledge
- Understanding of 3D coordinate systems
- Three.js familiarity

## Project Setup

### Initialize Project

```bash
cd worldenv
npm run dev
```

### Project Structure

```
src/
├── components/
│   ├── FirstPersonController.ts
│   ├── Collider3D.ts
│   └── MeshRenderer.ts
├── scenes/
│   └── GameScene3D.ts
└── main.ts
```

## Component Implementation

### Transform3D Component

```typescript
// src/components/Transform3D.ts
import * as THREE from 'three';

export interface Transform3D {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}
```

### First Person Controller

```typescript
// src/components/FirstPersonController.ts
import * as THREE from 'three';

export class FirstPersonController {
  private camera: THREE.PerspectiveCamera;
  private moveSpeed: number = 5.0;
  private lookSpeed: number = 0.002;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private direction: THREE.Vector3 = new THREE.Vector3();
  private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private isLocked: boolean = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.setupPointerLock();
  }

  private setupPointerLock(): void {
    document.addEventListener('click', () => {
      document.body.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === document.body;
    });
  }

  onMouseMove(movementX: number, movementY: number): void {
    if (!this.isLocked) return;

    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= movementX * this.lookSpeed;
    this.euler.x -= movementY * this.lookSpeed;
    this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);
  }

  update(deltaTime: number): void {
    if (!this.isLocked) return;

    this.direction.set(0, 0, 0);

    if (Input.isKeyDown('KeyW')) this.direction.z = -1;
    if (Input.isKeyDown('KeyS')) this.direction.z = 1;
    if (Input.isKeyDown('KeyA')) this.direction.x = -1;
    if (Input.isKeyDown('KeyD')) this.direction.x = 1;

    this.direction.normalize();

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(this.camera.up, forward).normalize();

    this.velocity.set(0, 0, 0);
    this.velocity.addScaledVector(forward, -this.direction.z);
    this.velocity.addScaledVector(right, -this.direction.x);
    this.velocity.multiplyScalar(this.moveSpeed * deltaTime);

    this.camera.position.add(this.velocity);
  }
}
```

### Collider3D Component

```typescript
// src/components/Collider3D.ts
import * as THREE from 'three';

export class Collider3D {
  public boundingBox: THREE.Box3;

  constructor(width: number, height: number, depth: number) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    this.boundingBox = new THREE.Box3(
      new THREE.Vector3(-halfWidth, 0, -halfDepth),
      new THREE.Vector3(halfWidth, height, halfDepth)
    );
  }

  updatePosition(position: THREE.Vector3): void {
    const size = new THREE.Vector3();
    this.boundingBox.getSize(size);
    const center = new THREE.Vector3();
    this.boundingBox.getCenter(center);

    this.boundingBox.min.copy(position).sub(center);
    this.boundingBox.max.copy(this.boundingBox.min).add(size);
  }

  intersects(other: Collider3D): boolean {
    return this.boundingBox.intersectsBox(other.boundingBox);
  }
}
```

### MeshRenderer Component

```typescript
// src/components/MeshRenderer.ts
import * as THREE from 'three';

export class MeshRenderer {
  public mesh: THREE.Mesh;

  constructor(
    geometry: THREE.BufferGeometry,
    material: THREE.Material
  ) {
    this.mesh = new THREE.Mesh(geometry, material);
  }

  updatePosition(position: THREE.Vector3): void {
    this.mesh.position.copy(position);
  }

  updateRotation(rotation: THREE.Euler): void {
    this.mesh.rotation.copy(rotation);
  }
}
```

## Scene Setup

### Game Scene

```typescript
// src/scenes/GameScene3D.ts
import * as THREE from 'three';
import { FirstPersonController } from '../components/FirstPersonController';

export class GameScene3D extends Scene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controller: FirstPersonController;
  private objects: THREE.Mesh[] = [];

  async init(): Promise<void> {
    this.scene = this.game.getThreeScene();
    this.camera = this.game.getThreeCamera();
    
    this.setupCamera();
    this.setupLighting();
    this.setupEnvironment();
    this.setupPlayer();
    
    this.registerInputHandlers();
  }

  private setupCamera(): void {
    this.camera.position.set(0, 1.6, 5);
    this.camera.fov = 75;
    this.camera.updateProjectionMatrix();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  private setupEnvironment(): void {
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x228B22 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Walls
    this.createWall(0, 2, -25, 50, 4, 1);
    this.createWall(0, 2, 25, 50, 4, 1);
    this.createWall(-25, 2, 0, 1, 4, 50);
    this.createWall(25, 2, 0, 1, 4, 50);

    // Obstacles
    this.createBox(10, 1, 10, 2, 2, 2, 0xff0000);
    this.createBox(-10, 1, -10, 2, 2, 2, 0x0000ff);
    this.createBox(0, 1, -15, 3, 3, 3, 0xffff00);
  }

  private setupPlayer(): void {
    this.controller = new FirstPersonController(this.camera);
  }

  private createWall(
    x: number, y: number, z: number,
    width: number, height: number, depth: number
  ): void {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);
    this.objects.push(wall);
  }

  private createBox(
    x: number, y: number, z: number,
    width: number, height: number, depth: number,
    color: number
  ): void {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color });
    const box = new THREE.Mesh(geometry, material);
    box.position.set(x, y, z);
    box.castShadow = true;
    box.receiveShadow = true;
    this.scene.add(box);
    this.objects.push(box);
  }

  private registerInputHandlers(): void {
    document.addEventListener('mousemove', (event) => {
      this.controller.onMouseMove(event.movementX, event.movementY);
    });

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') {
        document.exitPointerLock();
      }
    });
  }

  update(deltaTime: number): void {
    this.controller.update(deltaTime);
  }

  render(): void {
    // Rendering handled by Three.js renderer
  }
}
```

## Main Entry Point

```typescript
// src/main.ts
import { Game } from './core/Game';
import { GameScene3D } from './scenes/GameScene3D';

async function main() {
  const game = new Game({
    width: 1280,
    height: 720,
    canvasId: 'gameCanvas',
    antialias: true
  });

  await game.init();
  
  const gameScene = new GameScene3D(game);
  await gameScene.init();
  
  game.loadScene(gameScene);
  game.run();
}

main();
```

## HTML Setup

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>First Person 3D Game</title>
  <style>
    body {
      margin: 0;
      overflow: hidden;
      background: #000;
    }
    #gameCanvas {
      display: block;
    }
    #instructions {
      position: absolute;
      top: 20px;
      left: 20px;
      color: white;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div id="instructions">
    Click to lock pointer<br>
    WASD: Move<br>
    Mouse: Look<br>
    ESC: Unlock pointer
  </div>
  <canvas id="gameCanvas"></canvas>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

## Controls

- Click: Lock pointer
- W: Move forward
- S: Move backward
- A: Strafe left
- D: Strafe right
- Mouse: Look around
- ESC: Unlock pointer

## Configuration

### Adjust Movement

Modify FirstPersonController properties:
- `moveSpeed`: Movement speed (units per second)
- `lookSpeed`: Mouse sensitivity

### Camera Settings

```typescript
camera.fov = 75;           // Field of view
camera.near = 0.1;         // Near clipping plane
camera.far = 1000;         // Far clipping plane
```

## Enhancements

### Add Features

1. Gravity and jumping
2. Collision detection with raycasting
3. Weapon system
4. Enemy AI
5. Health system
6. HUD overlay
7. Sound effects
8. Skybox

### Example: Gravity and Jumping

```typescript
export class FirstPersonController {
  private verticalVelocity: number = 0;
  private gravity: number = -9.8;
  private jumpForce: number = 5.0;
  private isGrounded: boolean = true;

  update(deltaTime: number): void {
    // Apply gravity
    if (!this.isGrounded) {
      this.verticalVelocity += this.gravity * deltaTime;
    }

    // Jump
    if (Input.isKeyPressed('Space') && this.isGrounded) {
      this.verticalVelocity = this.jumpForce;
      this.isGrounded = false;
    }

    // Update vertical position
    this.camera.position.y += this.verticalVelocity * deltaTime;

    // Ground check
    if (this.camera.position.y <= 1.6) {
      this.camera.position.y = 1.6;
      this.verticalVelocity = 0;
      this.isGrounded = true;
    }

    // ... existing horizontal movement code
  }
}
```

### Example: Collision Detection

```typescript
private checkCollisions(): void {
  const raycaster = new THREE.Raycaster();
  const directions = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1)
  ];

  for (const direction of directions) {
    raycaster.set(this.camera.position, direction);
    const intersects = raycaster.intersectObjects(this.objects);
    
    if (intersects.length > 0 && intersects[0].distance < 0.5) {
      // Push player back
      this.camera.position.sub(
        direction.multiplyScalar(0.5 - intersects[0].distance)
      );
    }
  }
}
```

## Testing

Run development server:
```bash
npm run dev
```

Open browser at `http://localhost:5173`

## Build Production

```bash
npm run build
```

Output in `dist/` directory.

## Troubleshooting

### Pointer Lock Not Working

Check browser security settings. HTTPS required for pointer lock in some browsers.

### Camera Not Moving

Verify pointer is locked before movement. Check console for errors.

### Poor Performance

Reduce polygon count. Enable frustum culling. Use simpler materials.

## Optimization

### Rendering

- Use instanced meshes for repeated objects
- Implement level-of-detail (LOD)
- Enable frustum culling
- Reduce shadow map resolution

### Geometry

- Use buffer geometries
- Merge static meshes
- Optimize vertex count
- Use texture atlases

## Next Steps

- Implement physics engine integration
- Add multiplayer networking
- Create level editor
- Implement AI pathfinding
- Add post-processing effects

## References

- Engine overview: `../engine-overview.md`
- Three.js documentation: https://threejs.org/docs/
- Pointer Lock API: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API