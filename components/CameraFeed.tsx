import React, { useEffect, useRef, useState } from 'react';

interface CameraFeedProps {
  isActive: boolean;
  onGestureDetected: (gesture: 'OPEN_HAND' | 'FIST') => void;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ isActive, onGestureDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [status, setStatus] = useState<string>('Initializing AI...');
  const gestureRecognizerRef = useRef<any>(null);
  const requestRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);
  const lastPredictionTimeRef = useRef<number>(0);

  // Load MediaPipe GestureRecognizer
  useEffect(() => {
    if (!isActive) return;

    let isMounted = true;

    const loadModel = async () => {
      try {
        setStatus('Loading Model...');
        // Dynamic import from CDN
        // @ts-ignore
        const { FilesetResolver, GestureRecognizer } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/+esm');

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );

        if (!isMounted) return;

        gestureRecognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        setIsLoaded(true);
        setStatus('Scanning Hand');
        startCamera();
      } catch (error) {
        console.error("Failed to load MediaPipe:", error);
        setStatus('AI Load Failed');
      }
    };

    loadModel();

    return () => {
      isMounted = false;
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => {
            // Start prediction loop once video is playing
            requestRef.current = requestAnimationFrame(predictWebcam);
        }).catch(e => console.error("Video play failed", e));
      }
    } catch (err) {
      console.error("Camera denied:", err);
      setStatus('Camera Denied');
    }
  };

  const predictWebcam = () => {
    if (!videoRef.current || !gestureRecognizerRef.current) return;

    const now = Date.now();
    
    // Throttle prediction to ~5 FPS (200ms) to save CPU/GPU for the 3D scene
    if (now - lastPredictionTimeRef.current > 200) {
        try {
            if (videoRef.current.readyState === 4 && videoRef.current.currentTime !== lastVideoTimeRef.current) {
                lastVideoTimeRef.current = videoRef.current.currentTime;
                lastPredictionTimeRef.current = now;

                const results = gestureRecognizerRef.current.recognizeForVideo(videoRef.current, now);

                if (results.gestures.length > 0) {
                    const gestureName = results.gestures[0][0].categoryName;
                    const score = results.gestures[0][0].score;

                    if (score > 0.5) {
                        if (gestureName === 'Open_Palm') {
                            onGestureDetected('OPEN_HAND');
                            setStatus('Detected: OPEN HAND');
                        } else if (gestureName === 'Closed_Fist') {
                            onGestureDetected('FIST');
                            setStatus('Detected: FIST');
                        } else {
                            setStatus('Scanning...');
                        }
                    }
                }
            }
        } catch (e) {
            console.warn("Prediction error:", e);
        }
    }

    // Continue loop
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  if (!isActive) return null;

  return (
    <div className="absolute bottom-6 left-6 w-36 h-28 sm:w-48 sm:h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-[0_0_20px_rgba(255,0,127,0.3)] z-50 bg-black/80 backdrop-blur">
      <video 
        ref={videoRef} 
        playsInline 
        muted 
        className={`w-full h-full object-cover opacity-80 transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-50'}`}
      />
      
      {/* HUD Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {!isLoaded && (
             <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        )}
        {isLoaded && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        )}
        <div className="absolute bottom-0 w-full bg-black/50 backdrop-blur-sm py-1 text-center">
            <span className="text-[10px] text-rose-300 tracking-widest uppercase font-bold">{status}</span>
        </div>
      </div>
    </div>
  );
};

export default CameraFeed;