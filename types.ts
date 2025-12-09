import { Vector3, Color } from 'three';

export enum AppState {
  FORMED = 'FORMED', // The Tree
  CHAOS = 'CHAOS',   // The Explosion
}

export interface ParticleData {
  // Dual Position System
  treePos: Vector3;   // Target Position (Cone)
  chaosPos: Vector3;  // Chaos Position (Sphere)
  
  rotation: Vector3;
  scale: number;
  color: Color;
  speedOffset: number; // Randomize movement slightly
  type: 'ornament_gold' | 'ornament_red' | 'gift_box' | 'light';
}
