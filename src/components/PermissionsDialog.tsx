import React, { useState, useEffect } from 'react';
import { MicrophoneIcon, ComputerDesktopIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

interface PermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionsGranted: () => void;
}

export const PermissionsDialog: React.FC<PermissionsDialogProps> = ({
  isOpen,
  onClose,
  onPermissionsGranted,
}) => {
  const [microphoneStatus, setMicrophoneStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkPermissions();
    }
  }, [isOpen]);

  const checkPermissions = async () => {
    try {
      // Check if we already have microphone permission
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (result.state === 'granted') {
        setMicrophoneStatus('granted');
        onPermissionsGranted();
      } else if (result.state === 'denied') {
        setMicrophoneStatus('denied');
      }
    } catch (error) {
      console.log('Permissions API not supported, will request on use');
    }
  };

  const requestMicrophonePermission = async () => {
    setIsChecking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed to request permission
      stream.getTracks().forEach(track => track.stop());
      setMicrophoneStatus('granted');
      
      // Store permission granted status
      localStorage.setItem('meetingmind-mic-permission', 'granted');
      
      setTimeout(() => {
        onPermissionsGranted();
      }, 500);
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicrophoneStatus('denied');
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Permissions Required
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:text-slate-500 dark:hover:text-slate-400">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
            MeetingMind needs access to your microphone to record and transcribe meetings.
          </p>

          <div className="space-y-4">
            {/* Microphone Permission */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {microphoneStatus === 'granted' ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                ) : microphoneStatus === 'denied' ? (
                  <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
                ) : (
                  <MicrophoneIcon className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Microphone Access
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Required to capture audio from your meetings
                </p>
                {microphoneStatus === 'denied' && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Permission denied. Please enable microphone access in your browser settings.
                  </p>
                )}
              </div>
            </div>

            {/* System Audio (Future) */}
            <div className="flex items-start space-x-3 opacity-50">
              <div className="flex-shrink-0">
                <ComputerDesktopIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  System Audio (Coming Soon)
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Capture audio from other applications like Zoom or Teams
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
          {microphoneStatus === 'pending' ? (
            <button
              onClick={requestMicrophonePermission}
              disabled={isChecking}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              {isChecking ? 'Requesting Permission...' : 'Grant Microphone Access'}
            </button>
          ) : microphoneStatus === 'denied' ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                To enable microphone access:
              </p>
              <ol className="text-xs text-gray-500 dark:text-slate-400 text-left list-decimal list-inside">
                <li>Click the lock icon in your browser's address bar</li>
                <li>Find "Microphone" in the permissions list</li>
                <li>Change it from "Block" to "Allow"</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          ) : (
            <button
              onClick={onPermissionsGranted}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};