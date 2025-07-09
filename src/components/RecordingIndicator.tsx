import React, { useState, useEffect } from 'react';
import { MicrophoneIcon } from '@heroicons/react/24/solid';

interface RecordingIndicatorProps {
  isRecording: boolean;
  duration: number;
}

export const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({ isRecording, duration }) => {
  const [isPulsing, setIsPulsing] = useState(true);

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setIsPulsing(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  if (!isRecording) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-8 left-8 z-50">
      <div className="relative">
        {/* Pulsing background */}
        <div className={`absolute inset-0 bg-red-500 rounded-full ${isPulsing ? 'animate-ping' : ''}`} />
        
        {/* Main indicator */}
        <div className="relative bg-red-500 text-white px-4 py-3 rounded-full shadow-lg flex items-center space-x-2">
          <MicrophoneIcon className="h-5 w-5" />
          <span className="font-medium">{formatDuration(duration)}</span>
          <span className="text-sm">Recording</span>
        </div>
      </div>
    </div>
  );
};