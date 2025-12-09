import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import TreeParticles from './TreeParticles';
import { AppState } from '../types';
import { COLORS } from '../constants';

interface ExperienceProps {
  appState: AppState;
  primaryColor: string;
}

const Experience: React.FC<ExperienceProps> = ({ appState, primaryColor }) => {
  return (
    <div className="w-full h-screen bg-[#020502]">
      <Canvas dpr={[1, 2]} gl={{ antialias: false, toneMappingExposure: 1.0 }}>
        {/* Cinematic Camera Angle */}
        <PerspectiveCamera makeDefault position={[0, 4, 20]} fov={45} />
        
        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 3} 
          maxPolarAngle={Math.PI / 1.8}
          minDistance={12}
          maxDistance={35}
          autoRotate={appState === AppState.FORMED}
          autoRotateSpeed={0.5}
        />

        {/* LUXURY LIGHTING */}
        <ambientLight intensity={0.2} color={COLORS.EMERALD_DEEP} />
        
        {/* Main Golden Spotlight */}
        <spotLight 
            position={[10, 20, 10]} 
            angle={0.4} 
            penumbra={0.5} 
            intensity={3} 
            color={COLORS.WARM_WHITE} 
            castShadow 
        />
        
        {/* Rim Light for separation */}
        <pointLight position={[-10, 5, -10]} intensity={2} color={COLORS.GOLD} />
        
        {/* Fill Light */}
        <pointLight position={[0, -5, 10]} intensity={1} color={COLORS.EMERALD_LIGHT} />

        {/* Trump Tower / Lobby Environment */}
        <Environment preset="lobby" />
        
        <Stars radius={80} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

        {/* THE TREE */}
        <TreeParticles appState={appState} primaryColor={primaryColor} />

        {/* CINEMATIC POST PROCESSING */}
        <EffectComposer disableNormalPass>
            <Bloom 
                luminanceThreshold={0.7} // Lower threshold to make gold glow
                mipmapBlur 
                intensity={1.2} 
                radius={0.6} 
            />
            <Vignette eskil={false} offset={0.2} darkness={0.6} />
            <Noise opacity={0.03} /> 
        </EffectComposer>
        
        {/* Reflective Marble Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]}>
            <circleGeometry args={[50]} />
            <meshStandardMaterial 
                color="#001a10" 
                roughness={0.02} 
                metalness={0.8} 
            />
        </mesh>

      </Canvas>
    </div>
  );
};

export default Experience;
