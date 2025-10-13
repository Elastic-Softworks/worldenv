// src/core/Game.ts

import * as PIXI from "pixi.js";
import * as THREE from "three";

interface GameConfig {
  width: number;
  height: number;
  canvasId: string;
}

export class Game {
  private config: GameConfig;
  private app!: PIXI.Application;
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  constructor(config: GameConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    // init pixi.js

    this.app = new PIXI.Application({
      width: this.config.width,
      height: this.config.height,
      backgroundColor: 0x1099bb,
      view: document.getElementById(this.config.canvasId) as HTMLCanvasElement,
    });

    document.body.appendChild(this.app.view);

    // init three.js

    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById(
        this.config.canvasId,
      ) as HTMLCanvasElement,
      antialias: true,
    });

    this.renderer.setSize(this.config.width, this.config.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);

    this.scene.add(cube);

    // camera setup

    this.camera = new THREE.PerspectiveCamera(
      75,
      this.config.width / this.config.height,
      0.1,
      1000,
    );

    this.camera.position.z = 5;
    this.scene.add(this.camera);

    // handle resize

    window.addEventListener("resize", () => {
      this.resize();
    });
  }

  private resize(): void {
    this.config.width = window.innerWidth;
    this.config.height = window.innerHeight;

    this.app.renderer.resize(this.config.width, this.config.height);
    this.renderer.setSize(this.config.width, this.config.height);

    this.camera.aspect = this.config.width / this.config.height;
    this.camera.updateProjectionMatrix();
  }

  private update(deltaTime: number): void {
    // game logic here
  }

  private render(): void {
    // pixi.js

    this.renderer.render(this.scene, this.camera);
  }

  run(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
  }

  private gameLoop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000;

    this.update(deltaTime);
    this.render();
    this.lastTime = now;

    requestAnimationFrame(this.gameLoop);
  };
}
