import React from 'react';
import { MicrophoneIcon } from '@heroicons/react/24/outline';

interface LiveTranscriptModalProps {
  show: boolean;
  recordingTime: string;
  onClose: () => void;
}

export const LiveTranscriptModal: React.FC<LiveTranscriptModalProps> = ({
  show,
  recordingTime,
  onClose
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold dark:text-white">Live Transcript</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-400"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="text-gray-600 dark:text-slate-400">
            <div className="text-center">
              <MicrophoneIcon className="h-12 w-12 text-gray-400 dark:text-slate-600 mx-auto mb-2 animate-pulse" />
              <p className="text-lg mb-2 dark:text-white">Recording in Progress</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Live transcription is coming soon!</p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Your full meeting will be transcribed after you stop recording. 
                  Live transcription requires additional setup and will be available in a future update.
                </p>
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-4">Recording time: {recordingTime}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};