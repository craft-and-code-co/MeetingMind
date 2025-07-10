import React, { useMemo, useRef, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { TranscriptionWidget } from '../../components/TranscriptionWidget';
import { PermissionsDialog } from '../../components/PermissionsDialog';
import { TemplateSelector } from '../../components/TemplateSelector';
import { KeyboardShortcuts } from '../../components/KeyboardShortcuts';
import { SystemTray } from '../../components/SystemTray';
import { RecordingIndicator } from '../../components/RecordingIndicator';
import { authService } from '../../services/supabase';
import { meetingDetectionService } from '../../services/meetingDetection';
import { OnboardingModal, FeatureTooltip, SampleMeeting } from '../../components/Onboarding';
import { useOnboarding } from '../../hooks/useOnboarding';
import { KeyboardShortcutLegend } from '../../components/KeyboardShortcutLegend';

// Components
import { QuickStats } from './components/QuickStats';
import { RecordingControl } from './components/RecordingControl';
import { TodaysMeetings } from './components/TodaysMeetings';
import { LiveTranscriptModal } from './components/LiveTranscriptModal';

// Hooks
import { useRecordingLogic } from './hooks/useRecordingLogic';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const meetings = useStore((state) => state.meetings);
  const reminders = useStore((state) => state.reminders);
  const notes = useStore((state) => state.notes);
  const actionItems = useStore((state) => state.actionItems);
  const deleteMeeting = useStore((state) => state.deleteMeeting);
  
  // Onboarding
  const {
    shouldShowOnboarding,
    shouldShowTooltip,
    completeOnboarding,
    markTooltipSeen,
    onboardingState
  } = useOnboarding();
  
  const [showSampleMeeting, setShowSampleMeeting] = useState(false);
  const recordButtonRef = useRef<HTMLButtonElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  
  const {
    audioRecorder,
    processingAudio,
    currentTranscription,
    isTranscribing,
    showPermissionsDialog,
    setShowPermissionsDialog,
    showTemplateSelector,
    setShowTemplateSelector,
    selectedTemplateId,
    setSelectedTemplateId,
    showLiveTranscript,
    setShowLiveTranscript,
    isRecording,
    handleStartRecording,
    handleStopRecording,
    startRecordingWithTemplate
  } = useRecordingLogic();

  // Filter today's meetings
  const todaysMeetings = useMemo(() => 
    meetings.filter((m) => m.date === format(new Date(), 'yyyy-MM-dd')),
    [meetings]
  );
  
  // Calculate stats
  const pendingReminders = useMemo(() => 
    reminders.filter(r => r.status === 'pending').length,
    [reminders]
  );
  const pendingActionItems = useMemo(() => 
    actionItems.filter(item => item.status === 'pending').length,
    [actionItems]
  );

  const handleMeetingDetectedFromNotification = React.useCallback(() => {
    if (!audioRecorder.isRecording) {
      handleStartRecording();
    }
  }, [audioRecorder.isRecording, handleStartRecording]);

  // Meeting detection setup
  React.useEffect(() => {
    if (!window.electronAPI) return;

    console.log('Setting up meeting detection handlers');
    
    // Set up handlers
    window.electronAPI.onMeetingDetectedNotificationClicked?.(
      handleMeetingDetectedFromNotification
    );
    window.electronAPI.onStartRecordingFromNotification?.(
      handleMeetingDetectedFromNotification
    );

    // Start monitoring
    meetingDetectionService.startMonitoring();

    return () => {
      meetingDetectionService.stopMonitoring();
    };
  }, [handleMeetingDetectedFromNotification]);

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
        <QuickStats
          totalMeetings={meetings.length}
          totalNotes={notes.length}
          pendingActionItems={pendingActionItems}
          pendingReminders={pendingReminders}
        />

        {/* Recording Control - Removed to avoid redundancy, using bottom-right indicator instead */}
        {/*
        <RecordingControl
          isRecording={audioRecorder.isRecording}
          recordingTime={audioRecorder.recordingTime}
          processingAudio={processingAudio}
          showLiveTranscript={showLiveTranscript}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onToggleLiveTranscript={() => setShowLiveTranscript(!showLiveTranscript)}
          recordButtonRef={recordButtonRef}
        />
        */}

        {/* Today's Meetings */}
        <TodaysMeetings
          meetings={todaysMeetings}
          onStartRecording={handleStartRecording}
          onDeleteMeeting={handleDeleteMeeting}
          processingAudio={processingAudio}
          isRecording={audioRecorder.isRecording}
        />
      </div>

      {/* Floating Transcription Widget */}
      <TranscriptionWidget
        isRecording={audioRecorder.isRecording}
        recordingTime={audioRecorder.recordingTime}
        onStop={handleStopRecording}
        transcription={currentTranscription}
        isTranscribing={isTranscribing}
      />
      
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
                  startRecordingWithTemplate();
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
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
      />

      {/* Live Transcript Modal */}
      <LiveTranscriptModal
        show={showLiveTranscript && audioRecorder.isRecording}
        recordingTime={audioRecorder.recordingTime}
        onClose={() => setShowLiveTranscript(false)}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={shouldShowOnboarding}
        onClose={() => completeOnboarding()}
        onComplete={() => {
          completeOnboarding();
          setShowSampleMeeting(true);
        }}
      />

      {/* Sample Meeting */}
      {showSampleMeeting && (
        <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full">
            <SampleMeeting
              onStart={() => {
                setShowSampleMeeting(false);
                handleStartRecording();
              }}
            />
            <button
              onClick={() => setShowSampleMeeting(false)}
              className="mt-4 w-full text-center text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
            >
              Skip this step
            </button>
          </div>
        </div>
      )}

      {/* Feature Tooltips */}
      {shouldShowTooltip('hasSeenRecordingTooltip') && recordButtonRef.current && (
        <FeatureTooltip
          targetRef={recordButtonRef}
          title="Start Recording"
          description="Click here to record your first meeting. MeetingMind will transcribe and enhance your notes automatically!"
          position="bottom"
          onDismiss={() => markTooltipSeen('hasSeenRecordingTooltip')}
        />
      )}

      {shouldShowTooltip('hasSeenExportTooltip') && exportButtonRef.current && meetings.length > 0 && (
        <FeatureTooltip
          targetRef={exportButtonRef}
          title="Export Your Notes"
          description="You can export your meeting notes as PDF or Markdown files to share with your team."
          position="left"
          onDismiss={() => markTooltipSeen('hasSeenExportTooltip')}
        />
      )}

      {/* Keyboard Shortcut Legend */}
      <KeyboardShortcutLegend />
    </>
  );
};