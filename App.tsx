import React, { useState } from 'react';
import Experience from './components/Experience';
import UIOverlay from './components/UIOverlay';
import CameraFeed from './components/CameraFeed';
import { AppState } from './types';
import { COLORS } from './constants';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.FORMED);
  const [primaryColor, setPrimaryColor] = useState<string>(COLORS.EMERALD_DEEP);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // GESTURE HANDLER
  // Open Hand = Scatters (CHAOS)
  // Fist = Assembles (FORMED)
  const handleGesture = (gesture: 'OPEN_HAND' | 'FIST') => {
      if (gesture === 'OPEN_HAND' && appState !== AppState.CHAOS) {
          setAppState(AppState.CHAOS);
      } else if (gesture === 'FIST' && appState !== AppState.FORMED) {
          setAppState(AppState.FORMED);
      }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-[#020502]">
      <Experience appState={appState} primaryColor={primaryColor} />
      
      <UIOverlay 
        appState={appState}
        setAppState={setAppState}
        primaryColor={primaryColor}
        setPrimaryColor={setPrimaryColor}
        isCameraActive={isCameraActive}
        toggleCamera={() => setIsCameraActive(!isCameraActive)}
      />

      <CameraFeed 
        isActive={isCameraActive} 
        onGestureDetected={handleGesture}
      />
    </div>
  );
};

export default App;