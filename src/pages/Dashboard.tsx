import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, MicrophoneIcon, DocumentTextIcon, StopIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { AudioRecorder } from '../components/AudioRecorder';
import { openAIService } from '../services/openai';
import { authService } from '../services/supabase';
import { generateSampleData } from '../utils/sampleData';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { meetings, currentMeeting, setCurrentMeeting, addMeeting, updateMeeting, addActionItem } = useStore();
  const [processingAudio, setProcessingAudio] = useState(false);
  const todaysMeetings = meetings.filter(
    (m) => m.date === format(new Date(), 'yyyy-MM-dd')
  );

  const audioRecorder = AudioRecorder({
    onRecordingComplete: useCallback(async (audioBlob: Blob) => {
      if (!currentMeeting) return;
      
      setProcessingAudio(true);
      try {
        // Convert blob to File for OpenAI
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        
        // Update meeting as completed
        updateMeeting(currentMeeting.id, {
          endTime: new Date(),
          isRecording: false
        });

        // TODO: Process audio with OpenAI
        console.log('Audio recording complete, size:', audioBlob.size);
        
        // Navigate to meeting detail view (to be implemented)
        // navigate(`/meeting/${currentMeeting.id}`);
      } catch (error) {
        console.error('Failed to process recording:', error);
        alert('Failed to process recording');
      } finally {
        setProcessingAudio(false);
        setCurrentMeeting(null);
      }
    }, [currentMeeting, updateMeeting, setCurrentMeeting])
  });

  const handleStartRecording = () => {
    const newMeeting = {
      id: Date.now().toString(),
      title: `Meeting ${format(new Date(), 'MMM dd, HH:mm')}`,
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: new Date(),
      participants: [],
      platform: 'other' as const,
      isRecording: true,
    };
    
    addMeeting(newMeeting);
    setCurrentMeeting(newMeeting);
    audioRecorder.startRecording();
  };

  const handleStopRecording = () => {
    audioRecorder.stopRecording();
  };

  // Temporary function to load sample data
  const loadSampleData = () => {
    const { meetings: sampleMeetings, actionItems: sampleActionItems } = generateSampleData();
    sampleMeetings.forEach(meeting => addMeeting(meeting));
    sampleActionItems.forEach(item => addActionItem(item));
    alert('Sample data loaded! Check the Action Items page.');
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">MyGranola</h1>
            <nav className="flex space-x-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-gray-900 bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigate('/action-items')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Action Items
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Settings
              </button>
              <button 
                onClick={handleSignOut}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recording Control */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {audioRecorder.isRecording ? 'Recording in Progress' : 'Start New Meeting'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {audioRecorder.isRecording
                  ? `Recording time: ${audioRecorder.recordingTime}`
                  : 'Click record to capture your meeting audio'}
              </p>
            </div>
            <button
              onClick={audioRecorder.isRecording ? handleStopRecording : handleStartRecording}
              disabled={processingAudio}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                audioRecorder.isRecording
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                audioRecorder.isRecording ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {audioRecorder.isRecording ? (
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
                  Start Recording
                </>
              )}
            </button>
          </div>
        </div>

        {/* Today's Meetings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Today's Meetings
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {todaysMeetings.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No meetings yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start recording to capture your first meeting
                </p>
              </div>
            ) : (
              todaysMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  onClick={() => navigate(`/meeting/${meeting.id}`)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {meeting.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {format(meeting.startTime, 'h:mm a')}
                        {meeting.endTime &&
                          ` - ${format(meeting.endTime, 'h:mm a')}`}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        meeting.isRecording
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {meeting.isRecording ? 'Recording' : 'Completed'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Temporary Sample Data Button */}
        <div className="mt-8 text-center">
          <button
            onClick={loadSampleData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Load Sample Data (For Testing)
          </button>
        </div>
      </main>
    </div>
  );
};