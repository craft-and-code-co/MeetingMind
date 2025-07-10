import React, { useState, useEffect } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';
import { intervalsConfig } from '../config';
import { useStore } from '../store/useStore';

interface RecordingIndicatorProps {
  isRecording: boolean;
  duration: number;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
}

export const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({ 
  isRecording, 
  duration,
  onStartRecording,
  onStopRecording 
}) => {
  const [isPulsing, setIsPulsing] = useState(true);

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setIsPulsing(prev => !prev);
      }, intervalsConfig.ui.pulsingAnimation);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Always show the button, not just when recording
  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isRecording ? (
        <div className="relative">
          {/* Pulsing background */}
          <div className={`absolute inset-0 bg-red-500 rounded-full ${isPulsing ? 'animate-ping' : ''}`} />
          
          {/* Recording indicator with stop button */}
          <button
            onClick={onStopRecording}
            className="relative bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center space-x-2 transition-colors"
          >
            <StopIcon className="h-5 w-5" />
            <span className="font-medium">{formatDuration(duration)}</span>
            <span className="text-sm">Stop Recording</span>
          </button>
        </div>
      ) : (
        <button
          onClick={onStartRecording}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2 transition-colors"
        >
          <MicrophoneIcon className="h-5 w-5" />
          <span className="font-medium">Start Recording</span>
        </button>
      )}
    </div>
  );
};