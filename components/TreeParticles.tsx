import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, ParticleData } from '../types';
import { PHYSICS, TREE_CONFIG, COLORS } from '../constants';

interface TreeParticlesProps {
  appState: AppState;
  primaryColor: string;
}

// Reusable temporary objects to avoid GC
const tempVec3 = new THREE.Vector3();
const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();

// Custom Shader for the Sparkling Foliage
const FoliageShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(COLORS.EMERALD_DEEP) },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 4.0 },
    uMixColor: { value: new THREE.Color(COLORS.GOLD) }
  },
  vertexShader: `
    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uSize;
    attribute float aScale;
    attribute vec3 aRandom;
    
    varying vec3 vPosition;
    varying float vAlpha;

    void main() {
      vPosition = position;
      
      // Twinkle effect based on time and random attributes
      float twinkle = sin(uTime * 2.0 + aRandom.x * 10.0);
      vAlpha = 0.6 + 0.4 * twinkle;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      gl_PointSize = uSize * aScale * uPixelRatio * (20.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform vec3 uMixColor;
    varying float vAlpha;

    void main() {
      // Circular particle
      float r = distance(gl_PointCoord, vec2(0.5));
      if (r > 0.5) discard;

      // Soft glow edge
      float glow = 1.0 - (r * 2.0);
      glow = pow(glow, 1.5);

      vec3 finalColor = mix(uColor, uMixColor, glow * 0.3);

      gl_FragColor = vec4(finalColor, vAlpha * glow);
    }
  `
};

const TreeParticles: React.FC<TreeParticlesProps> = ({ appState, primaryColor }) => {
  const foliageRef = useRef<THREE.Points>(null);
  const ornamentMeshRef = useRef<THREE.InstancedMesh>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  // Transition Progress: 0 = FORMED (Tree), 1 = CHAOS (Explosion)
  const progressRef = useRef(0);

  // --- 1. DATA GENERATION ---
  const { foliageGeo, ornaments } = useMemo(() => {
    // A. FOLIAGE (POINTS)
    const foliagePositions = new Float32Array(TREE_CONFIG.FOLIAGE_COUNT * 3);
    const foliageChaosPositions = new Float32Array(TREE_CONFIG.FOLIAGE_COUNT * 3);
    const foliageScales = new Float32Array(TREE_CONFIG.FOLIAGE_COUNT);
    const foliageRandoms = new Float32Array(TREE_CONFIG.FOLIAGE_COUNT * 3);

    for (let i = 0; i < TREE_CONFIG.FOLIAGE_COUNT; i++) {
      // Tree Form (Cone)
      const y = Math.random() * TREE_CONFIG.HEIGHT;
      const r = (TREE_CONFIG.RADIUS * (1 - y / TREE_CONFIG.HEIGHT)) * Math.sqrt(Math.random()); // Volume filling
      const theta = Math.random() * Math.PI * 2;
      
      const treeX = r * Math.cos(theta);
      const treeY = y - TREE_CONFIG.HEIGHT / 2;
      const treeZ = r * Math.sin(theta);

      // Chaos Form (Sphere)
      const u = Math.random();
      const v = Math.random();
      const thetaChaos = 2 * Math.PI * u;
      const phiChaos = Math.acos(2 * v - 1);
      const rChaos = PHYSICS.CHAOS_RADIUS * Math.cbrt(Math.random()); // Uniform sphere

      foliagePositions[i * 3] = treeX;
      foliagePositions[i * 3 + 1] = treeY;
      foliagePositions[i * 3 + 2] = treeZ;

      foliageChaosPositions[i * 3] = rChaos * Math.sin(phiChaos) * Math.cos(thetaChaos);
      foliageChaosPositions[i * 3 + 1] = rChaos * Math.sin(phiChaos) * Math.sin(thetaChaos);
      foliageChaosPositions[i * 3 + 2] = rChaos * Math.cos(phiChaos);

      foliageScales[i] = Math.random();
      foliageRandoms[i * 3] = Math.random();
      foliageRandoms[i * 3 + 1] = Math.random();
      foliageRandoms[i * 3 + 2] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(foliagePositions, 3)); // Will change dynamically
    geo.setAttribute('aTarget', new THREE.BufferAttribute(foliagePositions.slice(), 3)); // Tree target
    geo.setAttribute('aChaos', new THREE.BufferAttribute(foliageChaosPositions, 3)); // Chaos target
    geo.setAttribute('aScale', new THREE.BufferAttribute(foliageScales, 1));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(foliageRandoms, 3));

    // B. ORNAMENTS (INSTANCES)
    const ornData: ParticleData[] = [];
    for (let i = 0; i < TREE_CONFIG.ORNAMENT_COUNT; i++) {
      const y = Math.random() * TREE_CONFIG.HEIGHT;
      const r = TREE_CONFIG.RADIUS * (1 - y / TREE_CONFIG.HEIGHT) + 0.2; // Surface + offset
      const theta = Math.random() * Math.PI * 2;

      const treePos = new THREE.Vector3(r * Math.cos(theta), y - TREE_CONFIG.HEIGHT/2, r * Math.sin(theta));
      const chaosPos = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize().multiplyScalar(PHYSICS.CHAOS_RADIUS * 0.8);

      const typeRand = Math.random();
      let type: ParticleData['type'] = 'ornament_gold';
      let color = COLORS.GOLD;
      let scale = 0.35;

      if (typeRand > 0.7) {
        type = 'gift_box';
        color = COLORS.BURGUNDY;
        scale = 0.5;
      } else if (typeRand > 0.4) {
        type = 'ornament_red';
        color = COLORS.BURGUNDY;
      }

      ornData.push({
        treePos,
        chaosPos,
        rotation: new THREE.Vector3(Math.random()*Math.PI, Math.random()*Math.PI, 0),
        scale,
        color: new THREE.Color(color),
        speedOffset: Math.random(),
        type
      });
    }

    return { foliageGeo: geo, ornaments: ornData };
  }, []);


  // --- 2. ANIMATION LOOP ---
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    // Smooth State Transition
    const targetProgress = appState === AppState.CHAOS ? 1 : 0;
    // Non-linear ease for "Explosion" feel
    const lerpRate = appState === AppState.CHAOS ? 0.08 : 0.04; 
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, targetProgress, lerpRate);
    const P = progressRef.current;

    // A. UPDATE FOLIAGE (Shader Uniforms + Position Interpolation)
    if (shaderRef.current && foliageRef.current && foliageRef.current.geometry.attributes.position) {
      shaderRef.current.uniforms.uTime.value = time;
      shaderRef.current.uniforms.uColor.value.set(primaryColor);

      // We manually update positions in JS buffer for Dual Position logic 
      const positions = foliageRef.current.geometry.attributes.position.array as Float32Array;
      const targets = foliageRef.current.geometry.attributes.aTarget.array as Float32Array;
      const chaos = foliageRef.current.geometry.attributes.aChaos.array as Float32Array;

      for (let i = 0; i < TREE_CONFIG.FOLIAGE_COUNT; i++) {
        const i3 = i * 3;
        
        // Lerp coordinates
        const tx = targets[i3];
        const ty = targets[i3+1];
        const tz = targets[i3+2];
        const cx = chaos[i3];
        const cy = chaos[i3+1];
        const cz = chaos[i3+2];

        // Add Noise/Hover
        const noise = Math.sin(time + i) * PHYSICS.HOVER_AMPLITUDE * (1-P); // Only hover when formed

        positions[i3] = THREE.MathUtils.lerp(tx, cx, P) + noise;
        positions[i3+1] = THREE.MathUtils.lerp(ty, cy, P) + noise;
        positions[i3+2] = THREE.MathUtils.lerp(tz, cz, P);
      }
      foliageRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // B. UPDATE ORNAMENTS
    if (ornamentMeshRef.current) {
      ornaments.forEach((orn, i) => {
        // Position Lerp
        tempVec3.lerpVectors(orn.treePos, orn.chaosPos, P);

        // Rotation: Spin fast in Chaos, settle in Formed
        const spinSpeed = 3 * P; 
        const hover = Math.sin(time * 2 + orn.speedOffset) * PHYSICS.HOVER_AMPLITUDE * (1-P);
        
        tempObj.position.copy(tempVec3);
        tempObj.position.y += hover;

        tempObj.rotation.x = orn.rotation.x + time * spinSpeed;
        tempObj.rotation.y = orn.rotation.y + time * spinSpeed;
        tempObj.scale.setScalar(orn.scale * (1 + 0.2 * Math.sin(time * 3 + i)));

        tempObj.updateMatrix();
        ornamentMeshRef.current!.setMatrixAt(i, tempObj.matrix);
        ornamentMeshRef.current!.setColorAt(i, orn.color);
      });
      ornamentMeshRef.current.instanceMatrix.needsUpdate = true;
      if (ornamentMeshRef.current.instanceColor) ornamentMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. FOLIAGE POINTS */}
      <points ref={foliageRef} geometry={foliageGeo}>
        <shaderMaterial 
          ref={shaderRef} 
          args={[FoliageShaderMaterial]} 
          transparent 
          depthWrite={false} 
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 2. ORNAMENTS */}
      <instancedMesh ref={ornamentMeshRef} args={[undefined, undefined, TREE_CONFIG.ORNAMENT_COUNT]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshPhysicalMaterial 
          metalness={0.9} 
          roughness={0.1} 
          clearcoat={1} 
          envMapIntensity={2} 
        />
      </instancedMesh>

      {/* 3. THE TOPPER STAR */}
      <LuxuryStar appState={appState} progressRef={progressRef} />
    </group>
  );
};

const LuxuryStar = ({ appState, progressRef }: { appState: AppState, progressRef: React.MutableRefObject<number> }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (!ref.current) return;
        const time = state.clock.getElapsedTime();
        const P = progressRef.current;
        
        // Position
        const targetY = TREE_CONFIG.HEIGHT / 2 + 1;
        const chaosY = targetY + 10;
        ref.current.position.y = THREE.MathUtils.lerp(targetY, chaosY, P);
        
        // Spin
        ref.current.rotation.y = time * 0.5;
    });

    return (
        <group ref={ref}>
            <mesh>
                <icosahedronGeometry args={[1.5, 0]} />
                <meshStandardMaterial 
                    color={COLORS.GOLD} 
                    emissive={COLORS.GOLD}
                    emissiveIntensity={2}
                    metalness={1}
                    roughness={0.2}
                />
            </mesh>
            <pointLight distance={15} intensity={5} color={COLORS.GOLD} />
        </group>
    );
}

export default TreeParticles;