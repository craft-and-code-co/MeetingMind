import React from 'react';
import { MicrophoneIcon, StopIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Card } from '../../../components/Card';

interface RecordingControlProps {
  isRecording: boolean;
  recordingTime: string;
  processingAudio: boolean;
  showLiveTranscript: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onToggleLiveTranscript: () => void;
  recordButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export const RecordingControl: React.FC<RecordingControlProps> = ({
  isRecording,
  recordingTime,
  processingAudio,
  showLiveTranscript,
  onStartRecording,
  onStopRecording,
  onToggleLiveTranscript,
  recordButtonRef
}) => {
  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isRecording ? 'Recording in Progress' : 'Start New Meeting'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {isRecording
              ? `Recording time: ${recordingTime}`
              : 'Click record to capture your meeting audio'}
          </p>
        </div>
        <button
          ref={recordButtonRef}
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={processingAudio}
          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-indigo-600 hover:bg-indigo-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isRecording ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRecording ? (
            <>
              <StopIcon className="h-5 w-5 mr-2" />
              Stop Recording
            </>
          ) : processingAudio ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>
              <MicrophoneIcon className="h-5 w-5 mr-2" />
              Record
            </>
          )}
        </button>
        {isRecording && (
          <button
            onClick={onToggleLiveTranscript}
            className="ml-3 inline-flex items-center px-4 py-3 border border-gray-300 dark:border-slate-600 text-base font-medium rounded-md text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            {showLiveTranscript ? 'Hide' : 'Show'} Live Transcript
          </button>
        )}
      </div>
    </Card>
  );
};