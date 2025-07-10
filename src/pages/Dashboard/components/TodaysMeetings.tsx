import React from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, MicrophoneIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader } from '../../../components/Card';
import { Meeting } from '../../../types';

interface TodaysMeetingsProps {
  meetings: Meeting[];
  onStartRecording: () => void;
  onDeleteMeeting: (e: React.MouseEvent, meetingId: string) => void;
  processingAudio: boolean;
  isRecording: boolean;
}

export const TodaysMeetings: React.FC<TodaysMeetingsProps> = React.memo(({
  meetings,
  onStartRecording,
  onDeleteMeeting,
  processingAudio,
  isRecording
}) => {
  const navigate = useNavigate();

  return (
    <Card noPadding>
      <CardHeader>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2" />
          Today's Meetings
        </h3>
      </CardHeader>
      <div className="divide-y divide-gray-200 dark:divide-slate-700">
        {meetings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
              <CalendarIcon className="h-12 w-12 text-gray-400 dark:text-slate-500" />
            </div>
            <h3 className="mt-4 text-base font-medium text-gray-900 dark:text-white">
              No meetings recorded today
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
              Click the "Record" button above to start capturing your meeting audio and get AI-powered notes.
            </p>
            <div className="mt-6">
              <button
                onClick={onStartRecording}
                disabled={processingAudio || isRecording}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MicrophoneIcon className="h-4 w-4 mr-2" />
                Start Your First Recording
              </button>
            </div>
          </div>
        ) : (
          meetings.map((meeting) => (
            <div
              key={meeting.id}
              onClick={() => navigate(`/meeting/${meeting.id}`)}
              className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {meeting.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {format(meeting.startTime, 'h:mm a')}
                    {meeting.endTime &&
                      ` - ${format(meeting.endTime, 'h:mm a')}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      meeting.isRecording
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {meeting.isRecording ? 'Recording' : 'Completed'}
                  </span>
                  {!meeting.isRecording && (
                    <button
                      onClick={(e) => onDeleteMeeting(e, meeting.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete meeting"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
});