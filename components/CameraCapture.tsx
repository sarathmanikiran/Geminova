
import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Icons } from './Icons';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const webcamRef = useRef<Webcam>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
      setIsCameraOpen(false);
    }
  }, [webcamRef, onCapture]);
  
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode,
  };

  return (
    <>
      <button onClick={() => setIsCameraOpen(true)} className="p-2 rounded-full hover:bg-white/10 transition-all transform hover:scale-110 hover:shadow-glow-accent active:scale-95" title="Use Camera">
        <Icons.Camera className="w-5 h-5" />
      </button>

      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-gray-900 p-4 rounded-lg border border-glass-border relative w-full max-w-3xl shadow-glow-primary">
             <button onClick={() => setIsCameraOpen(false)} className="absolute top-2 right-2 p-2 bg-gray-800/50 rounded-full z-10 hover:shadow-glow-accent transition-all transform hover:scale-110 active:scale-95">
                <Icons.Close className="w-6 h-6" />
              </button>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="rounded-md w-full h-auto"
            />
            <div className="absolute bottom-4 w-full px-8 flex items-center justify-between">
              {/* Spacer to center the capture button */}
              <div className="w-12 h-12" />

              <button onClick={capture} className="w-16 h-16 rounded-full bg-white flex items-center justify-center animate-pulse-glow shadow-glow-primary transition-transform transform hover:scale-105 active:scale-95">
                 <div className="w-14 h-14 rounded-full bg-white border-2 border-black"></div>
              </button>
              
              <button 
                onClick={toggleCamera} 
                className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-transform transform hover:scale-105 active:scale-95" 
                aria-label="Switch camera" 
                title="Switch Camera"
              >
                <Icons.FlipCamera className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
