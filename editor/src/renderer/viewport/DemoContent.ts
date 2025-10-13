/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Demo Content Generator
 *
 * Creates demo objects for testing viewport functionality.
 * Provides sample 3D and 2D content to verify rendering systems.
 */

import * as THREE from 'three';
import * as PIXI from 'pixi.js';

/**
 * create3DScene()
 *
 * Create demo 3D objects for testing Three.js viewport.
 */
export function create3DScene(): THREE.Object3D[] {
  const objects: THREE.Object3D[] = [];

  /* BASIC CUBE */
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(0, 0.5, 0);
  cube.name = 'Demo Cube';
  objects.push(cube);

  /* SPHERE */
  const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.set(2, 0.5, 0);
  sphere.name = 'Demo Sphere';
  objects.push(sphere);

  /* CYLINDER */
  const cylinderGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 32);
  const cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });
  const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
  cylinder.position.set(-2, 0.5, 0);
  cylinder.name = 'Demo Cylinder';
  objects.push(cylinder);

  /* GROUND PLANE */
  const planeGeometry = new THREE.PlaneGeometry(10, 10);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: 0x808080,
    side: THREE.DoubleSide
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.name = 'Ground Plane';
  objects.push(plane);

  /* TORUS KNOT */
  const torusKnotGeometry = new THREE.TorusKnotGeometry(0.4, 0.1, 64, 8);
  const torusKnotMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
  const torusKnot = new THREE.Mesh(torusKnotGeometry, torusKnotMaterial);
  torusKnot.position.set(0, 2, 2);
  torusKnot.name = 'Demo Torus Knot';
  objects.push(torusKnot);

  /* WIREFRAME ICOSAHEDRON */
  const icosahedronGeometry = new THREE.IcosahedronGeometry(0.7, 0);
  const icosahedronMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    wireframe: true
  });
  const icosahedron = new THREE.Mesh(icosahedronGeometry, icosahedronMaterial);
  icosahedron.position.set(-2, 1.5, -2);
  icosahedron.name = 'Demo Wireframe';
  objects.push(icosahedron);

  return objects;
}

/**
 * create2DScene()
 *
 * Create demo 2D objects for testing Pixi.js viewport.
 */
export function create2DScene(): PIXI.DisplayObject[] {
  const objects: PIXI.DisplayObject[] = [];

  /* RECTANGLE */
  const rectangle = new PIXI.Graphics();
  rectangle.beginFill(0x00ff00);
  rectangle.drawRect(-25, -25, 50, 50);
  rectangle.endFill();
  rectangle.x = 0;
  rectangle.y = 0;
  rectangle.name = 'Demo Rectangle';
  objects.push(rectangle);

  /* CIRCLE */
  const circle = new PIXI.Graphics();
  circle.beginFill(0xff0000);
  circle.drawCircle(0, 0, 30);
  circle.endFill();
  circle.x = 100;
  circle.y = 0;
  circle.name = 'Demo Circle';
  objects.push(circle);

  /* TRIANGLE */
  const triangle = new PIXI.Graphics();
  triangle.beginFill(0x0000ff);
  triangle.moveTo(0, -30);
  triangle.lineTo(-30, 30);
  triangle.lineTo(30, 30);
  triangle.lineTo(0, -30);
  triangle.endFill();
  triangle.x = -100;
  triangle.y = 0;
  triangle.name = 'Demo Triangle';
  objects.push(triangle);

  /* HEXAGON */
  const hexagon = new PIXI.Graphics();
  hexagon.lineStyle(3, 0xffff00);
  hexagon.beginFill(0xffff00, 0.3);
  const sides = 6;
  const radius = 25;
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) {
      hexagon.moveTo(x, y);
    } else {
      hexagon.lineTo(x, y);
    }
  }
  hexagon.closePath();
  hexagon.endFill();
  hexagon.x = 0;
  hexagon.y = 100;
  hexagon.name = 'Demo Hexagon';
  objects.push(hexagon);

  /* STAR */
  const star = new PIXI.Graphics();
  star.beginFill(0xff00ff);
  const outerRadius = 25;
  const innerRadius = 12;
  const points = 5;
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) {
      star.moveTo(x, y);
    } else {
      star.lineTo(x, y);
    }
  }
  star.closePath();
  star.endFill();
  star.x = -100;
  star.y = -100;
  star.name = 'Demo Star';
  objects.push(star);

  /* BEZIER CURVE */
  const curve = new PIXI.Graphics();
  curve.lineStyle(4, 0x00ffff);
  curve.moveTo(0, 0);
  curve.bezierCurveTo(25, -50, 75, -50, 100, 0);
  curve.x = 50;
  curve.y = -100;
  curve.name = 'Demo Curve';
  objects.push(curve);

  return objects;
}

/**
 * animateObjects()
 *
 * Add simple animations to demo objects.
 */
export function animateObjects(objects: (THREE.Object3D | PIXI.DisplayObject)[], deltaTime: number): void {
  objects.forEach((object, index) => {
    const time = deltaTime * 0.001;
    const speed = 0.5 + index * 0.2;

    if (object instanceof THREE.Object3D) {
      /* 3D OBJECT ANIMATIONS */
      if (object.name?.includes('Cube')) {
        object.rotation.x = time * speed;
        object.rotation.y = time * speed;
      } else if (object.name?.includes('Sphere')) {
        object.position.y = 0.5 + Math.sin(time * speed) * 0.3;
      } else if (object.name?.includes('Cylinder')) {
        object.rotation.y = time * speed;
      } else if (object.name?.includes('Torus')) {
        object.rotation.x = time * speed * 0.5;
        object.rotation.z = time * speed * 0.7;
      } else if (object.name?.includes('Wireframe')) {
        object.rotation.x = time * speed;
        object.rotation.y = time * speed * 0.8;
        object.rotation.z = time * speed * 0.6;
      }
    } else if (object instanceof PIXI.Graphics || object instanceof PIXI.Container) {
      /* 2D OBJECT ANIMATIONS */
      if (object.name?.includes('Rectangle')) {
        object.rotation = time * speed * 0.5;
      } else if (object.name?.includes('Circle')) {
        const baseY = 0;
        object.y = baseY + Math.sin(time * speed) * 20;
      } else if (object.name?.includes('Triangle')) {
        object.rotation = -time * speed * 0.5;
      } else if (object.name?.includes('Hexagon')) {
        object.scale.x = 1 + Math.sin(time * speed) * 0.2;
        object.scale.y = 1 + Math.sin(time * speed) * 0.2;
      } else if (object.name?.includes('Star')) {
        object.rotation = time * speed;
        object.alpha = 0.7 + Math.sin(time * speed * 2) * 0.3;
      }
    }
  });
}

/**
 * createDemoScene()
 *
 * Create appropriate demo scene based on viewport mode.
 */
export function createDemoScene(mode: '2d' | '3d'): (THREE.Object3D | PIXI.DisplayObject)[] {
  return mode === '3d' ? create3DScene() : create2DScene();
}
