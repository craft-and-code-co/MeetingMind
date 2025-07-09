import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcutsProps {
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onStartRecording,
  onStopRecording,
  isRecording
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check if the user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Command/Ctrl + key shortcuts
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'r':
            event.preventDefault();
            if (isRecording) {
              onStopRecording();
            } else {
              onStartRecording();
            }
            break;
          case 'd':
            event.preventDefault();
            navigate('/dashboard');
            break;
          case 'a':
            event.preventDefault();
            navigate('/action-items');
            break;
          case 's':
            event.preventDefault();
            navigate('/settings');
            break;
          case 'f':
            event.preventDefault();
            navigate('/search');
            break;
          case 'n':
            event.preventDefault();
            navigate('/reminders');
            break;
        }
      }

      // Escape key
      if (event.key === 'Escape') {
        if (isRecording) {
          onStopRecording();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isRecording, onStartRecording, onStopRecording, navigate]);

  return null; // This component doesn't render anything
};