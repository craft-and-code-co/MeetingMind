import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, MicrophoneIcon, DocumentTextIcon, StopIcon, ArrowRightOnRectangleIcon, TrashIcon, MagnifyingGlassIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { AudioRecorder } from '../components/AudioRecorder';
import { TranscriptionWidget } from '../components/TranscriptionWidget';
import { RemindersWidget } from '../components/RemindersWidget';
import { PermissionsDialog } from '../components/PermissionsDialog';
import { TemplateSelector } from '../components/TemplateSelector';
import { KeyboardShortcuts } from '../components/KeyboardShortcuts';
import { SystemTray } from '../components/SystemTray';
import { RecordingIndicator } from '../components/RecordingIndicator';
import { notificationService } from '../services/notifications';
import { meetingDetectionService } from '../services/meetingDetection';
import { openAIService } from '../services/openai';
import { authService } from '../services/supabase';
import { generateSampleData } from '../utils/sampleData';
import { meetingTemplates } from '../data/meetingTemplates';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { meetings, currentMeeting, setCurrentMeeting, addMeeting, updateMeeting, deleteMeeting, addActionItem, addNote } = useStore();
  const [processingAudio, setProcessingAudio] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showLiveTranscript, setShowLiveTranscript] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const settings = useStore((state) => state.settings);
  const todaysMeetings = meetings.filter(
    (m) => m.date === format(new Date(), 'yyyy-MM-dd')
  );

  // Create a ref to store the recording state for the useEffect
  const [isRecording, setIsRecording] = useState(false);

  const audioRecorder = AudioRecorder({
    onRecordingComplete: useCallback(async (audioBlob: Blob) => {
      if (!currentMeeting) return;
      
      setProcessingAudio(true);
      setIsTranscribing(true);
      try {
        // Convert blob to File for OpenAI
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        
        // Update meeting as completed
        updateMeeting(currentMeeting.id, {
          endTime: new Date(),
          isRecording: false
        });
        
        // Send meeting ended notification if enabled
        if (settings.meetingNotifications !== false) {
          notificationService.notifyMeetingEnded(currentMeeting.title);
        }

        // Transcribe audio
        try {
          const transcription = await openAIService.transcribeAudio(audioFile);
          setCurrentTranscription(transcription);
          
          // Save the transcription
          addNote({
            id: Date.now().toString(),
            meetingId: currentMeeting.id,
            rawTranscript: transcription,
            enhancedNotes: '',
            summary: '',
            actionItems: [],
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Generate AI title
          try {
            const aiTitle = await openAIService.generateMeetingTitle(transcription, 'descriptive');
            updateMeeting(currentMeeting.id, { title: aiTitle });
          } catch (error) {
            console.error('Failed to generate title:', error);
          }
          
          // Store template used
          if (selectedTemplateId) {
            updateMeeting(currentMeeting.id, { templateId: selectedTemplateId });
          }
          
          // Send transcription ready notification if enabled
          if (settings.transcriptionNotifications !== false) {
            notificationService.notifyTranscriptionReady(currentMeeting.title);
          }
          
          // Navigate to meeting detail view after a short delay
          setTimeout(() => {
            navigate(`/meeting/${currentMeeting.id}`);
          }, 2000);
        } catch (error) {
          console.error('Transcription failed:', error);
          alert('Failed to transcribe audio. Please check your API key.');
        }
      } catch (error) {
        console.error('Failed to process recording:', error);
        alert('Failed to process recording');
      } finally {
        setProcessingAudio(false);
        setIsTranscribing(false);
      }
    }, [currentMeeting, updateMeeting, addNote, navigate, selectedTemplateId, settings.meetingNotifications, settings.transcriptionNotifications]),
    onAudioChunk: useCallback(async (audioBlob: Blob) => {
      try {
        const chunkTranscript = await openAIService.transcribeAudioChunk(audioBlob);
        if (chunkTranscript) {
          setLiveTranscript(prev => {
            // Add a space between chunks if there's existing text
            const separator = prev && !prev.endsWith(' ') ? ' ' : '';
            return prev + separator + chunkTranscript;
          });
        }
      } catch (error) {
        console.error('Live transcription error:', error);
      }
    }, [])
  });

  // Update isRecording state when audioRecorder state changes
  React.useEffect(() => {
    setIsRecording(audioRecorder.isRecording);
  }, [audioRecorder.isRecording]);

  // System tray and Electron listeners
  React.useEffect(() => {
    if (window.electronAPI) {
      // Update tray menu when recording state changes
      window.electronAPI.updateTrayMenu?.({ isRecording });
      
      // Listen for tray toggle recording events
      const handleTrayToggle = () => {
        if (isRecording) {
          handleStopRecording();
        } else {
          handleStartRecording();
        }
      };
      
      window.electronAPI.onTrayToggleRecording?.(handleTrayToggle);
    }
    
    // Start meeting detection if auto-start is enabled
    if (settings.autoStartRecording) {
      meetingDetectionService.startMonitoring();
    }
    
    // Listen for meeting detection events
    const handleMeetingDetected = (event: CustomEvent) => {
      if (settings.meetingDetectionNotifications !== false) {
        // Notification is already sent by the detection service
      }
      
      // Auto-start recording if enabled and no meeting is currently being recorded
      if (settings.autoStartRecording && !isRecording) {
        setTimeout(() => {
          handleStartRecording();
        }, 2000); // Give user 2 seconds to see the notification
      }
    };
    
    window.addEventListener('meetingDetected', handleMeetingDetected as EventListener);
    
    return () => {
      window.removeEventListener('meetingDetected', handleMeetingDetected as EventListener);
      meetingDetectionService.stopMonitoring();
    };
  }, [isRecording, settings.autoStartRecording, settings.meetingDetectionNotifications]);

  const handleStopRecording = () => {
    audioRecorder.stopRecording();
  };

  const handleStartRecording = async () => {
    // Check if we have microphone permission
    const hasPermission = localStorage.getItem('meetingmind-mic-permission') === 'granted';
    
    if (!hasPermission) {
      // Check current permission status
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (result.state !== 'granted') {
          setShowPermissionsDialog(true);
          return;
        }
      } catch {
        // Permissions API not supported, show dialog to be safe
        setShowPermissionsDialog(true);
        return;
      }
    }
    
    // Reset live transcript for new recording
    setLiveTranscript('');
    
    // Use default template or 'custom' if none selected
    const templateId = selectedTemplateId || settings.defaultMeetingTemplate || 'custom';
    const template = meetingTemplates.find(t => t.id === templateId);
    
    const newMeeting = {
      id: Date.now().toString(),
      title: template ? `${template.icon} ${template.name} - ${format(new Date(), 'MMM dd, HH:mm')}` : `Meeting ${format(new Date(), 'MMM dd, HH:mm')}`,
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: new Date(),
      participants: [],
      platform: 'other' as const,
      isRecording: true,
      templateId: templateId
    };
    
    addMeeting(newMeeting);
    setCurrentMeeting(newMeeting);
    audioRecorder.startRecording();
    setShowTemplateSelector(false);
    
    // Send notification if enabled
    if (settings.meetingNotifications !== false) {
      notificationService.notifyMeetingStarted(newMeeting.title);
    }
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

  const handleDeleteMeeting = (e: React.MouseEvent, meetingId: string) => {
    e.stopPropagation(); // Prevent navigation to meeting detail
    
    if (window.confirm('Are you sure you want to delete this meeting? This will also delete all notes, action items, and reminders associated with it.')) {
      deleteMeeting(meetingId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">MeetingMind</h1>
            <nav className="flex space-x-4">
              <button 
                onClick={() => navigate('/search')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                Search
              </button>
              <button 
                onClick={() => navigate('/analytics')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <ChartBarIcon className="h-4 w-4 mr-1" />
                Analytics
              </button>
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
                onClick={() => navigate('/reminders')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Reminders
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
            {audioRecorder.isRecording && (
              <button
                onClick={() => setShowLiveTranscript(!showLiveTranscript)}
                className="ml-3 inline-flex items-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                {showLiveTranscript ? 'Hide' : 'Show'} Live Transcript
              </button>
            )}
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
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {meeting.title}
                      </h4>
                      <p className="text-sm text-gray-500">
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
                          onClick={(e) => handleDeleteMeeting(e, meeting.id)}
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

      {/* Floating Transcription Widget */}
      <TranscriptionWidget
        isRecording={audioRecorder.isRecording}
        recordingTime={audioRecorder.recordingTime}
        onStop={handleStopRecording}
        transcription={currentTranscription}
        isTranscribing={isTranscribing}
      />
      
      {/* Reminders Widget */}
      <RemindersWidget />
      
      {/* Permissions Dialog */}
      <PermissionsDialog
        isOpen={showPermissionsDialog}
        onClose={() => setShowPermissionsDialog(false)}
        onPermissionsGranted={() => {
          setShowPermissionsDialog(false);
          handleStartRecording();
        }}
      />
      
      {/* Template Selector Dialog */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Choose a Meeting Template
              </h2>
            </div>
            <div className="p-6 overflow-y-auto">
              <TemplateSelector
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={(templateId) => {
                  setSelectedTemplateId(templateId);
                  setShowTemplateSelector(false);
                  handleStartRecording();
                }}
              />
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        isRecording={audioRecorder.isRecording}
      />
      
      {/* System Tray */}
      <SystemTray
        isRecording={audioRecorder.isRecording}
        onToggleRecording={audioRecorder.isRecording ? handleStopRecording : handleStartRecording}
        onOpenApp={() => window.electronAPI?.show?.()}
        onQuit={() => window.electronAPI?.quit?.()}
      />

      {/* Recording Indicator */}
      <RecordingIndicator 
        isRecording={audioRecorder.isRecording}
        duration={audioRecorder.recordingTime}
      />

      {/* Live Transcript Modal */}
      {showLiveTranscript && audioRecorder.isRecording && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Live Transcript</h3>
              <button
                onClick={() => setShowLiveTranscript(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="text-gray-600">
                {liveTranscript ? (
                  <div className="whitespace-pre-wrap">{liveTranscript}</div>
                ) : (
                  <div className="text-center">
                    <MicrophoneIcon className="h-12 w-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-lg mb-2">Listening...</p>
                    <p className="text-sm text-gray-500">Transcription will appear here as you speak.</p>
                    <p className="text-xs text-gray-400 mt-4">Audio is processed every 5 seconds</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};