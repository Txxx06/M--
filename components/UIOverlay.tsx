import React from 'react';
import { AppState } from '../types';
import { COLORS } from '../constants';

interface UIOverlayProps {
  appState: AppState;
  setAppState: (s: AppState) => void;
  primaryColor: string;
  setPrimaryColor: (c: string) => void;
  isCameraActive: boolean;
  toggleCamera: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  appState, 
  setAppState, 
  primaryColor, 
  setPrimaryColor,
  isCameraActive,
  toggleCamera
}) => {
  
  const handleToggleState = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling to OrbitControls or App handlers
    setAppState(appState === AppState.FORMED ? AppState.CHAOS : AppState.FORMED);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 sm:p-12 z-10">
      {/* BRANDING */}
      <div className="flex flex-col items-center sm:items-start space-y-4 select-none">
        <div className="border-4 border-double border-yellow-600 p-4 bg-black/40 backdrop-blur-md">
            <h1 
                className="text-6xl sm:text-8xl font-serif font-bold text-center tracking-tighter"
                style={{ 
                    color: COLORS.GOLD,
                    textShadow: '0 2px 10px rgba(212, 175, 55, 0.5)'
                }}
            >
                M
            </h1>
        </div>
        <h2 
            className="text-sm sm:text-lg font-serif tracking-[0.3em] text-center uppercase"
            style={{ color: '#D4AF37' }}
        >
            Luxury Edition
        </h2>
      </div>

      {/* CENTER INTERACTION */}
      {!isCameraActive && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group" onClick={handleToggleState}>
              <div className="w-32 h-32 rounded-full border border-yellow-600/30 flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-yellow-600">
                <div className="text-center">
                    <span className="block text-yellow-500/80 font-serif text-xs uppercase tracking-widest mb-1">
                        {appState === AppState.CHAOS ? 'Restore' : 'Scatter'}
                    </span>
                    <div className={`w-2 h-2 mx-auto rounded-full ${appState === AppState.CHAOS ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                </div>
              </div>
          </div>
      )}

      {/* CONTROLS FOOTER */}
      <div className="flex flex-col sm:flex-row items-end sm:items-end justify-between pointer-events-auto gap-8 w-full">
        
        {/* COLOR SELECTOR */}
        <div className="flex flex-col gap-3">
            <span className="text-yellow-600/70 font-serif text-xs tracking-widest uppercase border-b border-yellow-600/20 pb-1">
                Illumination
            </span>
            <div className="flex gap-4">
                {[COLORS.EMERALD_DEEP, COLORS.BURGUNDY, COLORS.GOLD, '#000000'].map((c) => (
                    <button
                        key={c}
                        onClick={() => setPrimaryColor(c)}
                        className={`w-10 h-10 rounded-sm border transition-all hover:scale-110 shadow-lg ${primaryColor === c ? 'border-yellow-400 scale-110 ring-2 ring-yellow-600/30' : 'border-white/10 opacity-80'}`}
                        style={{ backgroundColor: c }}
                        aria-label="Change Color"
                    />
                ))}
            </div>
        </div>

        {/* MODE & CAMERA */}
        <div className="flex flex-col items-end gap-3">
             <div className="bg-black/80 backdrop-blur border border-yellow-900/50 px-6 py-2 rounded-sm">
                <span className="text-yellow-500 font-serif text-sm uppercase tracking-widest">
                    State: {appState}
                </span>
             </div>

             <button 
                onClick={toggleCamera}
                className={`flex items-center gap-3 px-8 py-4 rounded-sm border transition-all uppercase font-serif tracking-widest text-xs font-bold
                    ${isCameraActive 
                        ? 'bg-red-900/20 border-red-500 text-red-400 hover:bg-red-900/40' 
                        : 'bg-yellow-900/10 border-yellow-600 text-yellow-500 hover:bg-yellow-900/20'
                    }`}
             >
                {isCameraActive ? 'Disable Camera' : 'Enable Gestures'}
             </button>
             
             {isCameraActive && (
                 <div className="text-[10px] text-yellow-600/50 font-sans uppercase tracking-widest">
                    Palm: Chaos • Fist: Form
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;