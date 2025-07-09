import React, { useEffect } from 'react';

interface SystemTrayProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  onOpenApp: () => void;
  onQuit: () => void;
}

export const SystemTray: React.FC<SystemTrayProps> = ({
  isRecording,
  onToggleRecording,
  onOpenApp,
  onQuit
}) => {
  useEffect(() => {
    // Check if running in Electron
    if (window.electronAPI && window.electronAPI.setupSystemTray) {
      window.electronAPI.setupSystemTray({
        isRecording,
        onToggleRecording,
        onOpenApp,
        onQuit
      });
    }
  }, [isRecording, onToggleRecording, onOpenApp, onQuit]);

  return null; // This component doesn't render anything
};