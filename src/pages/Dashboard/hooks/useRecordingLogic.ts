import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../../../store/useStore';
import { AudioRecorder } from '../../../components/AudioRecorder';
import { openAIService } from '../../../services/openai';
import { notificationService } from '../../../services/notifications';
import { meetingTemplates } from '../../../data/meetingTemplates';
import { Note } from '../../../types';

export const useRecordingLogic = () => {
  const { currentMeeting, setCurrentMeeting, addMeeting, updateMeeting, addNote, addActionItem } = useStore();
  const settings = useStore((state) => state.settings);
  
  const [processingAudio, setProcessingAudio] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showLiveTranscript, setShowLiveTranscript] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  const currentMeetingRef = useRef(currentMeeting);
  const isRecordingRef = useRef(isRecording);
  
  // Keep refs in sync
  useEffect(() => {
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
          
          // Note: Transcription is saved as part of the enhanced note below

          // Get selected template
          const template = selectedTemplateId ? meetingTemplates.find(t => t.id === selectedTemplateId) : null;

          // Enhance notes with AI
          console.log('Enhancing notes with AI...');
          const enhanced = await openAIService.enhanceNotes(transcription, template?.enhancementTemplate);
          console.log('Enhanced notes:', enhanced);
          
          // Summary is stored in the Note, not the Meeting

          // Save complete note with proper structure
          const noteData: Note = {
            id: Date.now().toString(),
            meetingId: meeting.id,
            rawTranscript: transcription,
            enhancedNotes: enhanced.enhancedNotes,
            summary: enhanced.summary,
            actionItems: [],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          addNote(noteData);

          // Add action items
          enhanced.actionItems.forEach((item) => {
            addActionItem({
              id: Date.now().toString() + Math.random(),
              meetingId: meeting.id,
              date: meeting.date,
              description: item.description || '',
              status: 'pending',
              createdAt: new Date(),
              dueDate: item.dueDate || undefined,
            });
          });

          // Clear current meeting
          setCurrentMeeting(null);
        } catch (error) {
          console.error('Transcription failed:', error);
          alert('Failed to transcribe audio. Please check your OpenAI API key and try again.');
        }
      } finally {
        setProcessingAudio(false);
        setIsTranscribing(false);
        setCurrentTranscription('');
      }
    }, [currentMeeting, setCurrentMeeting, updateMeeting, addNote, addActionItem, selectedTemplateId, settings.meetingNotifications])
  });

  const handleStartRecording = useCallback(() => {
    setShowTemplateSelector(true);
  }, []);

  const startRecordingWithTemplate = useCallback(async () => {
    const templateName = selectedTemplateId 
      ? meetingTemplates.find(t => t.id === selectedTemplateId)?.name || 'Meeting'
      : 'Meeting';
    
    const newMeeting = {
      id: Date.now().toString(),
      title: `${templateName} - ${new Date().toLocaleTimeString()}`,
      date: new Date().toISOString().split('T')[0],
      startTime: new Date(),
      isRecording: true,
      templateId: selectedTemplateId || undefined,
      participants: [],
      platform: 'other' as const,
    };
    
    try {
      addMeeting(newMeeting);
      setCurrentMeeting(newMeeting);
      setIsRecording(true);
      await audioRecorder.startRecording();
      setShowTemplateSelector(false);
      
      // Send notification if enabled
      if (settings.meetingNotifications !== false) {
        notificationService.notifyMeetingStarted(newMeeting.title);
      }
    } catch (error: any) {
      // Handle permission denied or other errors
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setShowPermissionsDialog(true);
      } else {
        alert(`Recording failed: ${error.message || 'Unknown error'}`);
      }
      // Clean up on error
      setCurrentMeeting(null);
      setIsRecording(false);
    }
  }, [selectedTemplateId, addMeeting, setCurrentMeeting, audioRecorder, settings.meetingNotifications]);

  const handleStopRecording = useCallback(() => {
    console.log('Stop recording clicked, current meeting:', currentMeetingRef.current);
    if (!currentMeetingRef.current) {
      console.error('No current meeting to stop!');
      return;
    }
    setIsRecording(false);
    audioRecorder.stopRecording();
  }, [audioRecorder]);

  return {
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
    liveTranscript,
    isRecording,
    handleStartRecording,
    handleStopRecording,
    startRecordingWithTemplate
  };
};