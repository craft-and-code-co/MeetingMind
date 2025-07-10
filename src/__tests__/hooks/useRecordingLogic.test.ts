import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecordingLogic } from '../../pages/Dashboard/hooks/useRecordingLogic';
import { useStore } from '../../store/useStore';
import { openAIService } from '../../services/openai';
import { notificationService } from '../../services/notifications';

// Mock dependencies
jest.mock('../../store/useStore');
jest.mock('../../services/openai');
jest.mock('../../services/notifications');
jest.mock('../../components/AudioRecorder', () => ({
  AudioRecorder: jest.fn(() => ({
    isRecording: false,
    recordingTime: '00:00',
    recordingTimeSeconds: 0,
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
  })),
}));

describe('useRecordingLogic', () => {
  const mockStore = {
    currentMeeting: null,
    setCurrentMeeting: jest.fn(),
    addMeeting: jest.fn(),
    updateMeeting: jest.fn(),
    addNote: jest.fn(),
    addActionItem: jest.fn(),
    settings: {
      meetingNotifications: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockStore);
      }
      return mockStore;
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRecordingLogic());

    expect(result.current.processingAudio).toBe(false);
    expect(result.current.currentTranscription).toBe('');
    expect(result.current.isTranscribing).toBe(false);
    expect(result.current.showPermissionsDialog).toBe(false);
    expect(result.current.showTemplateSelector).toBe(false);
    expect(result.current.showLiveTranscript).toBe(false);
    expect(result.current.isRecording).toBe(false);
  });

  it('should show template selector when starting recording', () => {
    const { result } = renderHook(() => useRecordingLogic());

    act(() => {
      result.current.handleStartRecording();
    });

    expect(result.current.showTemplateSelector).toBe(true);
  });

  it('should handle stop recording', () => {
    const { result } = renderHook(() => useRecordingLogic());
    
    // Set current meeting
    mockStore.currentMeeting = { id: '123', title: 'Test Meeting' };

    act(() => {
      result.current.handleStopRecording();
    });

    expect(result.current.audioRecorder.stopRecording).toHaveBeenCalled();
  });

  it('should create meeting when starting recording with template', async () => {
    const { result } = renderHook(() => useRecordingLogic());

    await act(async () => {
      result.current.setSelectedTemplateId('standup');
      await result.current.startRecordingWithTemplate();
    });

    expect(mockStore.addMeeting).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Daily Standup'),
        isRecording: true,
        templateId: 'standup',
      })
    );
    expect(mockStore.setCurrentMeeting).toHaveBeenCalled();
    expect(notificationService.notifyMeetingStarted).toHaveBeenCalled();
  });

  it('should handle recording completion with transcription', async () => {
    const mockTranscription = 'This is a test transcription';
    const mockEnhanced = {
      summary: 'Test summary',
      enhancedNotes: '# Enhanced Notes\n- Test note',
      actionItems: [{ description: 'Test action' }],
      highlights: [],
    };

    (openAIService.transcribeAudio as jest.Mock).mockResolvedValue(mockTranscription);
    (openAIService.enhanceNotes as jest.Mock).mockResolvedValue(mockEnhanced);

    const { result } = renderHook(() => useRecordingLogic());
    
    // Set current meeting
    mockStore.currentMeeting = { 
      id: '123', 
      title: 'Test Meeting',
      date: '2024-01-01',
    };

    // Get the onRecordingComplete callback from AudioRecorder
    const audioRecorderCall = (require('../../components/AudioRecorder').AudioRecorder as jest.Mock).mock.calls[0][0];
    const onRecordingComplete = audioRecorderCall.onRecordingComplete;

    // Create a mock audio blob
    const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });

    // Call the callback
    await act(async () => {
      await onRecordingComplete(mockBlob);
    });

    // Verify transcription was called
    expect(openAIService.transcribeAudio).toHaveBeenCalled();
    
    // Verify notes were enhanced
    expect(openAIService.enhanceNotes).toHaveBeenCalledWith(mockTranscription, undefined);
    
    // Verify note was added
    expect(mockStore.addNote).toHaveBeenCalledWith(
      expect.objectContaining({
        meetingId: '123',
        rawTranscript: mockTranscription,
        enhancedNotes: mockEnhanced.enhancedNotes,
        summary: mockEnhanced.summary,
      })
    );
    
    // Verify action items were added
    expect(mockStore.addActionItem).toHaveBeenCalledWith(
      expect.objectContaining({
        meetingId: '123',
        description: 'Test action',
        status: 'pending',
      })
    );
    
    // Verify meeting was updated
    expect(mockStore.updateMeeting).toHaveBeenCalledWith('123', {
      endTime: expect.any(Date),
      isRecording: false,
    });
    
    // Verify notifications
    expect(notificationService.notifyMeetingEnded).toHaveBeenCalled();
  });

  it('should handle permission denied by showing dialog', async () => {
    const { result } = renderHook(() => useRecordingLogic());
    
    // Mock startRecording to throw permission error
    const mockStartRecording = jest.fn().mockRejectedValue(
      new DOMException('Permission denied', 'NotAllowedError')
    );
    result.current.audioRecorder.startRecording = mockStartRecording;

    await act(async () => {
      result.current.setSelectedTemplateId('standup');
      await result.current.startRecordingWithTemplate();
    });

    expect(result.current.showPermissionsDialog).toBe(true);
  });

  it('should handle transcription failure gracefully', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation();
    (openAIService.transcribeAudio as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useRecordingLogic());
    
    mockStore.currentMeeting = { id: '123', title: 'Test Meeting' };

    const audioRecorderCall = (require('../../components/AudioRecorder').AudioRecorder as jest.Mock).mock.calls[0][0];
    const onRecordingComplete = audioRecorderCall.onRecordingComplete;

    await act(async () => {
      await onRecordingComplete(new Blob(['audio'], { type: 'audio/webm' }));
    });

    expect(alertMock).toHaveBeenCalledWith(
      'Failed to transcribe audio. Please check your OpenAI API key and try again.'
    );
    
    alertMock.mockRestore();
  });

  it('should handle missing current meeting gracefully', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation();
    const { result } = renderHook(() => useRecordingLogic());
    
    // No current meeting
    mockStore.currentMeeting = null;

    const audioRecorderCall = (require('../../components/AudioRecorder').AudioRecorder as jest.Mock).mock.calls[0][0];
    const onRecordingComplete = audioRecorderCall.onRecordingComplete;

    await act(async () => {
      await onRecordingComplete(new Blob(['audio'], { type: 'audio/webm' }));
    });

    expect(alertMock).toHaveBeenCalledWith(
      'Error: No active meeting. Please try recording again.'
    );
    
    alertMock.mockRestore();
  });
});