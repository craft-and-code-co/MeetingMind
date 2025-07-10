import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  MicrophoneIcon, 
  DocumentTextIcon, 
  StopIcon, 
  TrashIcon,
  BellIcon,
  CheckCircleIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { AudioRecorder } from '../components/AudioRecorder';
import { TranscriptionWidget } from '../components/TranscriptionWidget';
import { RemindersWidget } from '../components/RemindersWidget';
import { PermissionsDialog } from '../components/PermissionsDialog';
import { TemplateSelector } from '../components/TemplateSelector';
import { KeyboardShortcuts } from '../components/KeyboardShortcuts';
import { SystemTray } from '../components/SystemTray';
import { RecordingIndicator } from '../components/RecordingIndicator';
import { Card, CardHeader, CardBody, StatCard } from '../components/Card';
import { notificationService } from '../services/notifications';
import { meetingDetectionService } from '../services/meetingDetection';
import { openAIService } from '../services/openai';
import { authService } from '../services/supabase';
import { meetingTemplates } from '../data/meetingTemplates';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { meetings, currentMeeting, setCurrentMeeting, addMeeting, updateMeeting, deleteMeeting, addActionItem, addNote, reminders, notes, actionItems } = useStore();
  const [processingAudio, setProcessingAudio] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showLiveTranscript, setShowLiveTranscript] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const currentMeetingRef = React.useRef(currentMeeting);
  const settings = useStore((state) => state.settings);
  const todaysMeetings = meetings.filter(
    (m) => m.date === format(new Date(), 'yyyy-MM-dd')
  );
  
  // Calculate stats
  const pendingReminders = reminders.filter(r => r.status === 'pending').length;
  const pendingActionItems = actionItems.filter(item => item.status === 'pending').length;

  // Create a ref to store the recording state for the useEffect
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = React.useRef(isRecording);
  
  // Keep refs in sync
  React.useEffect(() => {
    currentMeetingRef.current = currentMeeting;
    isRecordingRef.current = isRecording;
  }, [currentMeeting, isRecording]);

  const audioRecorder = AudioRecorder({
    onRecordingComplete: useCallback(async (audioBlob: Blob) => {
      const meeting = currentMeetingRef.current;
      console.log('onRecordingComplete called, meeting:', meeting);
      if (!meeting) {
        console.error('No current meeting found!');
        alert('Error: No active meeting. Please try recording again.');
        return;
      }
      
      setProcessingAudio(true);
      setIsTranscribing(true);
      console.log('Processing recording, blob size:', audioBlob.size);
      try {
        // Convert blob to File for OpenAI
        const audioFile = new File([audioBlob], 'recording.webm', { type: audioBlob.type || 'audio/webm' });
        console.log('Created audio file:', audioFile.name, 'size:', audioFile.size, 'type:', audioFile.type);
        
        // Update meeting as completed
        updateMeeting(meeting.id, {
          endTime: new Date(),
          isRecording: false
        });
        
        // Send meeting ended notification if enabled
        if (settings.meetingNotifications !== false) {
          notificationService.notifyMeetingEnded(meeting.title);
        }

        // Transcribe audio
        try {
          console.log('Starting transcription, file size:', audioFile.size);
          const transcription = await openAIService.transcribeAudio(audioFile);
          console.log('Transcription result:', transcription);
          setCurrentTranscription(transcription);
          
          // Save the transcription
          addNote({
            id: Date.now().toString(),
            meetingId: meeting.id,
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
            updateMeeting(meeting.id, { title: aiTitle });
          } catch (error) {
            console.error('Failed to generate title:', error);
          }
          
          // Store template used
          if (selectedTemplateId) {
            updateMeeting(meeting.id, { templateId: selectedTemplateId });
          }
          
          // Send transcription ready notification if enabled
          if (settings.transcriptionNotifications !== false) {
            notificationService.notifyTranscriptionReady(meeting.title);
          }
          
          // Navigate to meeting detail view after a short delay
          setTimeout(() => {
            navigate(`/meeting/${meeting.id}`);
          }, 2000);
        } catch (error) {
          console.error('Transcription failed:', error);
          alert(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Failed to process recording:', error);
        alert(`Failed to process recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setProcessingAudio(false);
        setIsTranscribing(false);
        setCurrentMeeting(null);
      }
    }, [updateMeeting, addNote, navigate, selectedTemplateId, settings.meetingNotifications, settings.transcriptionNotifications]),
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
      // Update application menu when recording state changes
      window.electronAPI.updateApplicationMenu?.({ isRecording });
    }
  }, [isRecording]);

  // Set up IPC listeners once (separate from recording state updates)
  React.useEffect(() => {
    if (window.electronAPI) {
      // Listen for tray toggle recording events
      const handleTrayToggle = () => {
        if (isRecordingRef.current) {
          handleStopRecording();
        } else {
          handleStartRecording();
        }
      };
      
      const cleanupTrayToggle = window.electronAPI.onTrayToggleRecording?.(handleTrayToggle);
      
      // Listen for meeting detection from native notifications
      const handleMeetingDetectedFromNotification = (event: any, meeting: any) => {
        if (settings.meetingDetectionNotifications !== false) {
          // Show the app
          if (window.electronAPI?.show) {
            window.electronAPI.show();
          }
        }
        
        // Auto-start recording if enabled and no meeting is currently being recorded
        if (settings.autoStartRecording && !isRecordingRef.current) {
          setTimeout(() => {
            handleStartRecording();
          }, 500); // Quick start since user clicked the notification
        }
      };
      
      const cleanupMeetingDetected = window.electronAPI.onMeetingDetectedNotificationClicked?.(handleMeetingDetectedFromNotification);
      const cleanupStartRecording = window.electronAPI.onStartRecordingFromNotification?.(handleMeetingDetectedFromNotification);
      
      return () => {
        cleanupTrayToggle?.();
        cleanupMeetingDetected?.();
        cleanupStartRecording?.();
      };
    }
  }, []); // Empty dependency array - only run once

  // Meeting detection effect
  React.useEffect(() => {
    
    // Start meeting detection if auto-start is enabled or meeting detection is enabled
    if (settings.autoStartRecording || settings.meetingDetectionNotifications !== false) {
      meetingDetectionService.startMonitoring();
      
      // Set up callback for meeting detection
      meetingDetectionService.setOnMeetingDetectedCallback((meeting) => {
        // Auto-start recording if enabled and no meeting is currently being recorded
        if (settings.autoStartRecording && !isRecordingRef.current) {
          setTimeout(() => {
            handleStartRecording();
          }, 2000); // Give user 2 seconds to see the notification
        }
      });
    }
    
    // Listen for meeting detection events (fallback for web-based detection)
    const handleMeetingDetected = (event: CustomEvent) => {
      if (settings.meetingDetectionNotifications !== false) {
        // Notification is already sent by the detection service
      }
      
      // Auto-start recording if enabled and no meeting is currently being recorded
      if (settings.autoStartRecording && !isRecordingRef.current) {
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
  }, [settings.autoStartRecording, settings.meetingDetectionNotifications]);

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
    <>
      <div className="max-w-none mx-auto px-6 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<MicrophoneIcon className="h-8 w-8" />}
            iconColor="text-indigo-600"
            label="Total Meetings"
            value={meetings.length}
          />
          
          <StatCard
            icon={<DocumentTextIcon className="h-8 w-8" />}
            iconColor="text-blue-600"
            label="Total Notes"
            value={notes.length}
          />
          
          <StatCard
            icon={<CheckCircleIcon className="h-8 w-8" />}
            iconColor="text-green-600"
            label="Pending Actions"
            value={pendingActionItems}
          />
          
          <StatCard
            icon={<BellIcon className="h-8 w-8" />}
            iconColor="text-purple-600"
            label="Active Reminders"
            value={pendingReminders}
          />
        </div>

        {/* Recording Control */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {audioRecorder.isRecording ? 'Recording in Progress' : 'Start New Meeting'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
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
                  Record
                </>
              )}
            </button>
            {audioRecorder.isRecording && (
              <button
                onClick={() => setShowLiveTranscript(!showLiveTranscript)}
                className="ml-3 inline-flex items-center px-4 py-3 border border-gray-300 dark:border-slate-600 text-base font-medium rounded-md text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                {showLiveTranscript ? 'Hide' : 'Show'} Live Transcript
              </button>
            )}
          </div>
        </Card>

        {/* Today's Meetings */}
        <Card noPadding>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Today's Meetings
            </h3>
          </CardHeader>
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {todaysMeetings.length === 0 ? (
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
                    onClick={handleStartRecording}
                    disabled={processingAudio || audioRecorder.isRecording}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MicrophoneIcon className="h-4 w-4 mr-2" />
                    Start Your First Recording
                  </button>
                </div>
              </div>
            ) : (
              todaysMeetings.map((meeting) => (
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
        </Card>

      </div>

      {/* Floating Transcription Widget */}
      <TranscriptionWidget
        isRecording={audioRecorder.isRecording}
        recordingTime={audioRecorder.recordingTime}
        onStop={handleStopRecording}
        transcription={currentTranscription}
        isTranscribing={isTranscribing}
      />
      
      {/* Removed floating RemindersWidget - now integrated into dashboard */}
      
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
        <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
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
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="w-full text-center text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
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
        duration={audioRecorder.recordingTimeSeconds}
      />

      {/* Live Transcript Modal */}
      {showLiveTranscript && audioRecorder.isRecording && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold dark:text-white">Live Transcript</h3>
              <button
                onClick={() => setShowLiveTranscript(false)}
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
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-4">Recording time: {audioRecorder.recordingTime}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};