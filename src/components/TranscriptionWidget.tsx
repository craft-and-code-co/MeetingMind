import React, { useState } from 'react';
import { 
  XMarkIcon, 
  MicrophoneIcon, 
  StopIcon,
  ChevronUpIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';

interface TranscriptionWidgetProps {
  isRecording: boolean;
  recordingTime: string;
  onStop: () => void;
  transcription?: string;
  isTranscribing?: boolean;
}

export const TranscriptionWidget: React.FC<TranscriptionWidgetProps> = ({
  isRecording,
  recordingTime,
  onStop,
  transcription = '',
  isTranscribing = false
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const currentMeeting = useStore((state) => state.currentMeeting);

  if (!isRecording && !isTranscribing && !transcription) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isExpanded ? 'w-96' : 'w-80'
    }`}>
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isRecording ? (
                <>
                  <div className="relative">
                    <MicrophoneIcon className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                  </div>
                  <span className="text-sm font-medium">Recording • {recordingTime}</span>
                </>
              ) : isTranscribing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span className="text-sm font-medium">Transcribing...</span>
                </>
              ) : (
                <>
                  <MicrophoneIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Transcription Complete</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-indigo-700 rounded transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronUpIcon className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-indigo-700 rounded transition-colors"
                title="Minimize"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-4">
            {/* Meeting Info */}
            {currentMeeting && (
              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{currentMeeting.title}</p>
                <p className="text-xs text-gray-500">
                  Started {format(currentMeeting.startTime, 'h:mm a')}
                </p>
              </div>
            )}

            {/* Transcription */}
            {(transcription || isExpanded) && (
              <div className={`${isExpanded ? 'h-64' : 'h-32'} overflow-y-auto mb-4`}>
                <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                  Live Transcription
                </h4>
                <div className="bg-gray-50 rounded-md p-3">
                  {transcription ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {transcription}
                      {isTranscribing && <span className="animate-pulse">|</span>}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      Waiting for speech...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {isRecording && 'Speak clearly into your microphone'}
                {isTranscribing && 'Processing audio...'}
                {!isRecording && !isTranscribing && 'Review and edit in meeting details'}
              </div>
              {isRecording && (
                <button
                  onClick={onStop}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <StopIcon className="h-3.5 w-3.5 mr-1" />
                  Stop
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Minimized State */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="absolute -top-12 right-0 bg-indigo-600 text-white px-3 py-1.5 rounded-md shadow-lg hover:bg-indigo-700 transition-all duration-200"
        >
          <div className="flex items-center space-x-2">
            {isRecording && (
              <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            )}
            <span className="text-xs font-medium">
              {isRecording ? `Recording ${recordingTime}` : 'Show Transcription'}
            </span>
          </div>
        </button>
      )}
    </div>
  );
};