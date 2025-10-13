# 2D Platformer Template Guide

## Overview

Create a side-scrolling 2D platformer game using WORLDENV engine. This guide covers player movement, platforms, collision detection, and basic game mechanics.

## Prerequisites

- WORLDENV engine installed
- Basic TypeScript knowledge
- Understanding of entity-component system

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
│   ├── PlayerController.ts
│   ├── PlatformController.ts
│   └── CollisionBox.ts
├── scenes/
│   └── GameScene.ts
└── main.ts
```

## Component Implementation

### Transform Component

```typescript
// src/components/Transform.ts
export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}
```

### Physics Component

```typescript
// src/components/Physics.ts
export interface Physics {
  velocityX: number;
  velocityY: number;
  accelerationY: number;
  grounded: boolean;
}
```

### Player Controller

```typescript
// src/components/PlayerController.ts
export class PlayerController {
  private moveSpeed: number = 200;
  private jumpForce: number = -400;
  private gravity: number = 800;

  update(entity: Entity, deltaTime: number): void {
    const transform = entity.getComponent<Transform>('Transform');
    const physics = entity.getComponent<Physics>('Physics');

    // Apply gravity
    physics.velocityY += this.gravity * deltaTime;

    // Handle input
    if (Input.isKeyDown('ArrowLeft')) {
      physics.velocityX = -this.moveSpeed;
    } else if (Input.isKeyDown('ArrowRight')) {
      physics.velocityX = this.moveSpeed;
    } else {
      physics.velocityX = 0;
    }

    // Jump
    if (Input.isKeyPressed('Space') && physics.grounded) {
      physics.velocityY = this.jumpForce;
      physics.grounded = false;
    }

    // Update position
    transform.x += physics.velocityX * deltaTime;
    transform.y += physics.velocityY * deltaTime;
  }
}
```

### Collision System

```typescript
// src/systems/CollisionSystem.ts
export class CollisionSystem {
  checkCollision(a: Entity, b: Entity): boolean {
    const transformA = a.getComponent<Transform>('Transform');
    const transformB = b.getComponent<Transform>('Transform');

    return (
      transformA.x < transformB.x + transformB.width &&
      transformA.x + transformA.width > transformB.x &&
      transformA.y < transformB.y + transformB.height &&
      transformA.y + transformA.height > transformB.y
    );
  }

  resolveCollision(player: Entity, platform: Entity): void {
    const playerTransform = player.getComponent<Transform>('Transform');
    const playerPhysics = player.getComponent<Physics>('Physics');
    const platformTransform = platform.getComponent<Transform>('Transform');

    // Top collision
    if (playerPhysics.velocityY > 0) {
      playerTransform.y = platformTransform.y - playerTransform.height;
      playerPhysics.velocityY = 0;
      playerPhysics.grounded = true;
    }
  }
}
```

## Scene Setup

### Game Scene

```typescript
// src/scenes/GameScene.ts
export class GameScene extends Scene {
  private player: Entity;
  private platforms: Entity[] = [];
  private collisionSystem: CollisionSystem;

  async init(): Promise<void> {
    this.collisionSystem = new CollisionSystem();
    this.createPlayer();
    this.createPlatforms();
  }

  private createPlayer(): void {
    this.player = this.createEntity('Player');
    
    this.player.addComponent<Transform>('Transform', {
      x: 100,
      y: 100,
      width: 32,
      height: 48,
      rotation: 0
    });

    this.player.addComponent<Physics>('Physics', {
      velocityX: 0,
      velocityY: 0,
      accelerationY: 800,
      grounded: false
    });

    this.player.addComponent('Sprite', {
      texture: 'player.png',
      width: 32,
      height: 48
    });

    this.player.addComponent('PlayerController', new PlayerController());
  }

  private createPlatforms(): void {
    // Ground platform
    this.createPlatform(0, 550, 800, 50);
    
    // Floating platforms
    this.createPlatform(200, 400, 150, 20);
    this.createPlatform(450, 300, 150, 20);
    this.createPlatform(100, 250, 100, 20);
  }

  private createPlatform(x: number, y: number, width: number, height: number): void {
    const platform = this.createEntity('Platform');
    
    platform.addComponent<Transform>('Transform', {
      x, y, width, height, rotation: 0
    });

    platform.addComponent('Sprite', {
      texture: 'platform.png',
      width,
      height
    });

    this.platforms.push(platform);
  }

  update(deltaTime: number): void {
    // Update player
    const controller = this.player.getComponent<PlayerController>('PlayerController');
    controller.update(this.player, deltaTime);

    // Check collisions
    for (const platform of this.platforms) {
      if (this.collisionSystem.checkCollision(this.player, platform)) {
        this.collisionSystem.resolveCollision(this.player, platform);
      }
    }

    // Keep player on screen
    const transform = this.player.getComponent<Transform>('Transform');
    if (transform.x < 0) transform.x = 0;
    if (transform.x > 768) transform.x = 768;
  }

  render(): void {
    // Rendering handled by engine
  }
}
```

## Main Entry Point

```typescript
// src/main.ts
import { Game } from './core/Game';
import { GameScene } from './scenes/GameScene';

async function main() {
  const game = new Game({
    width: 800,
    height: 600,
    canvasId: 'gameCanvas'
  });

  await game.init();
  
  const gameScene = new GameScene();
  await gameScene.init();
  
  game.loadScene(gameScene);
  game.run();
}

main();
```

## Assets Required

Place assets in `public/assets/`:
- `player.png` - 32x48 player sprite
- `platform.png` - Platform texture

## Controls

- Arrow Left: Move left
- Arrow Right: Move right
- Space: Jump

## Configuration

### Adjust Physics

Modify values in PlayerController:
- `moveSpeed`: Horizontal movement speed
- `jumpForce`: Jump strength (negative = upward)
- `gravity`: Gravity acceleration

### Collision Detection

Adjust collision system for slopes or multiple collision boxes.

## Enhancements

### Add Features

1. Double jump mechanic
2. Enemy entities
3. Collectible items
4. Score system
5. Level transitions
6. Background parallax
7. Particle effects
8. Sound effects

### Example: Double Jump

```typescript
export class PlayerController {
  private jumpCount: number = 0;
  private maxJumps: number = 2;

  update(entity: Entity, deltaTime: number): void {
    const physics = entity.getComponent<Physics>('Physics');

    if (physics.grounded) {
      this.jumpCount = 0;
    }

    if (Input.isKeyPressed('Space') && this.jumpCount < this.maxJumps) {
      physics.velocityY = this.jumpForce;
      this.jumpCount++;
      physics.grounded = false;
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

### Player Falls Through Platform

Check collision resolution order. Ensure physics update happens before collision check.

### Player Movement Stuttering

Verify deltaTime usage in all position calculations.

### Jump Not Working

Confirm grounded flag resets correctly on platform collision.

## Next Steps

- Add enemy AI
- Implement level loading system
- Create multiple scenes
- Add animation system
- Integrate audio

## References

- Engine overview: `../engine-overview.md`
- Component system: `../engine-overview.md#entity-component-system`
- Input handling: TypeScript Input API documentation