import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import { Dashboard } from '../../pages/Dashboard';
import { useStore } from '../../store/useStore';
import { openAIService } from '../../services/openai';
import { notificationService } from '../../services/notifications';

// Mock dependencies
jest.mock('../../services/openai');
jest.mock('../../services/notifications');
jest.mock('../../services/meetingDetection', () => ({
  meetingDetectionService: {
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
  },
}));

// Mock AudioRecorder to control recording flow
jest.mock('../../components/AudioRecorder', () => {
  const React = require('react');
  return {
    AudioRecorder: jest.fn((props) => {
      const [isRecording, setIsRecording] = React.useState(false);
      const [recordingTime, setRecordingTime] = React.useState('00:00');
      
      return {
        isRecording,
        recordingTime,
        recordingTimeSeconds: 0,
        startRecording: jest.fn(() => {
          setIsRecording(true);
          setRecordingTime('00:05');
        }),
        stopRecording: jest.fn(() => {
          setIsRecording(false);
          // Simulate recording completion
          setTimeout(() => {
            const audioBlob = new Blob(['mock audio'], { type: 'audio/webm' });
            props.onRecordingComplete(audioBlob);
          }, 100);
        }),
      };
    }),
  };
});

describe('Recording Workflow Integration', () => {
  beforeEach(() => {
    // Reset store
    useStore.setState({
      meetings: [],
      notes: [],
      actionItems: [],
      reminders: [],
      currentMeeting: null,
      settings: {
        openAIApiKey: 'sk-test-key',
        meetingNotifications: true,
      },
    });

    // Mock OpenAI responses
    (openAIService.initialize as jest.Mock).mockResolvedValue(undefined);
    (openAIService.transcribeAudio as jest.Mock).mockResolvedValue(
      'This is a test meeting about project planning. We need to finish the design by Friday.'
    );
    (openAIService.enhanceNotes as jest.Mock).mockResolvedValue({
      summary: 'Project planning meeting discussing design deadline',
      enhancedNotes: '# Project Planning\n\n- Design deadline: Friday\n- Team assignments discussed',
      actionItems: [
        { description: 'Complete design mockups', dueDate: '2024-01-05' },
        { description: 'Review project timeline' },
      ],
      highlights: [
        { type: 'decision', text: 'Design must be completed by Friday' },
      ],
    });
  });

  it('should complete full recording workflow from start to finish', async () => {
    render(<Dashboard />);

    // Check initial state
    expect(screen.getByText('Start New Meeting')).toBeInTheDocument();
    expect(screen.getByText('No meetings recorded today')).toBeInTheDocument();

    // Start recording
    const recordButton = screen.getByRole('button', { name: /record/i });
    fireEvent.click(recordButton);

    // Template selector should appear
    await waitFor(() => {
      expect(screen.getByText('Choose a Meeting Template')).toBeInTheDocument();
    });

    // Select a template
    const generalTemplate = screen.getByText('General Meeting');
    fireEvent.click(generalTemplate);

    // Recording should start
    await waitFor(() => {
      expect(screen.getByText('Recording in Progress')).toBeInTheDocument();
    });

    // Verify meeting was created
    const state = useStore.getState();
    expect(state.meetings).toHaveLength(1);
    expect(state.currentMeeting).toBeTruthy();
    expect(state.currentMeeting?.isRecording).toBe(true);

    // Stop recording
    const stopButton = screen.getByRole('button', { name: /stop recording/i });
    fireEvent.click(stopButton);

    // Wait for processing
    await waitFor(() => {
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for transcription to complete
    await waitFor(() => {
      expect(openAIService.transcribeAudio).toHaveBeenCalled();
      expect(openAIService.enhanceNotes).toHaveBeenCalled();
    }, { timeout: 5000 });

    // Verify final state
    await waitFor(() => {
      const finalState = useStore.getState();
      
      // Meeting should be completed
      expect(finalState.meetings[0].isRecording).toBe(false);
      expect(finalState.meetings[0].endTime).toBeTruthy();
      
      // Notes should be created
      expect(finalState.notes).toHaveLength(1);
      expect(finalState.notes[0].rawTranscript).toContain('test meeting about project planning');
      expect(finalState.notes[0].enhancedNotes).toContain('Project Planning');
      
      // Action items should be created
      expect(finalState.actionItems).toHaveLength(2);
      expect(finalState.actionItems[0].description).toBe('Complete design mockups');
      expect(finalState.actionItems[1].description).toBe('Review project timeline');
      
      // Current meeting should be cleared
      expect(finalState.currentMeeting).toBeNull();
    });

    // Verify notifications were sent
    expect(notificationService.notifyMeetingStarted).toHaveBeenCalled();
    expect(notificationService.notifyMeetingEnded).toHaveBeenCalled();
  });

  it('should handle recording errors gracefully', async () => {
    // Mock transcription failure
    (openAIService.transcribeAudio as jest.Mock).mockRejectedValue(
      new Error('Transcription failed')
    );
    
    const alertMock = jest.spyOn(window, 'alert').mockImplementation();

    render(<Dashboard />);

    // Start recording
    fireEvent.click(screen.getByRole('button', { name: /record/i }));
    
    // Select template
    await waitFor(() => screen.getByText('Choose a Meeting Template'));
    fireEvent.click(screen.getByText('General Meeting'));

    // Stop recording
    await waitFor(() => screen.getByText('Recording in Progress'));
    fireEvent.click(screen.getByRole('button', { name: /stop recording/i }));

    // Wait for error
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(
        'Failed to transcribe audio. Please check your OpenAI API key and try again.'
      );
    });

    alertMock.mockRestore();
  });

  it('should show live transcript option during recording', async () => {
    render(<Dashboard />);

    // Start recording
    fireEvent.click(screen.getByRole('button', { name: /record/i }));
    await waitFor(() => screen.getByText('Choose a Meeting Template'));
    fireEvent.click(screen.getByText('General Meeting'));

    // Wait for recording to start
    await waitFor(() => {
      expect(screen.getByText('Recording in Progress')).toBeInTheDocument();
    });

    // Live transcript button should be visible
    const liveTranscriptButton = screen.getByRole('button', { name: /show live transcript/i });
    expect(liveTranscriptButton).toBeInTheDocument();

    // Click to show live transcript
    fireEvent.click(liveTranscriptButton);

    // Live transcript modal should appear
    await waitFor(() => {
      expect(screen.getByText('Live Transcript')).toBeInTheDocument();
      expect(screen.getByText(/Live transcription is coming soon!/)).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByRole('button', { 'aria-label': /close/i });
    fireEvent.click(closeButton);

    // Modal should be hidden
    await waitFor(() => {
      expect(screen.queryByText('Live Transcript')).not.toBeInTheDocument();
    });
  });

  it('should display today\'s meetings after recording', async () => {
    // Add a completed meeting to the store
    useStore.setState({
      meetings: [{
        id: '1',
        title: 'Morning Standup',
        date: new Date().toISOString().split('T')[0],
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        endTime: new Date(Date.now() - 1800000), // 30 minutes ago
        isRecording: false,
        participants: [],
        platform: 'other',
      }],
    });

    render(<Dashboard />);

    // Should show the meeting in today's list
    expect(screen.getByText('Morning Standup')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    
    // Should not show "No meetings" message
    expect(screen.queryByText('No meetings recorded today')).not.toBeInTheDocument();
  });

  it('should calculate and display correct statistics', async () => {
    // Set up store with test data
    useStore.setState({
      meetings: [
        { id: '1', title: 'Meeting 1', date: '2024-01-01', startTime: new Date(), participants: [], platform: 'other' },
        { id: '2', title: 'Meeting 2', date: '2024-01-01', startTime: new Date(), participants: [], platform: 'other' },
      ],
      notes: [
        { id: '1', meetingId: '1', rawTranscript: '', enhancedNotes: '', summary: '', actionItems: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '2', meetingId: '2', rawTranscript: '', enhancedNotes: '', summary: '', actionItems: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '3', meetingId: '1', rawTranscript: '', enhancedNotes: '', summary: '', actionItems: [], createdAt: new Date(), updatedAt: new Date() },
      ],
      actionItems: [
        { id: '1', meetingId: '1', date: '2024-01-01', description: 'Task 1', status: 'pending', createdAt: new Date() },
        { id: '2', meetingId: '1', date: '2024-01-01', description: 'Task 2', status: 'completed', createdAt: new Date() },
        { id: '3', meetingId: '2', date: '2024-01-01', description: 'Task 3', status: 'pending', createdAt: new Date() },
      ],
      reminders: [
        { id: '1', meetingId: '1', title: 'Reminder 1', description: '', dueDate: '2024-01-05', reminderDate: '2024-01-04', status: 'pending', priority: 'high', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', meetingId: '2', title: 'Reminder 2', description: '', dueDate: '2024-01-06', reminderDate: '2024-01-05', status: 'sent', priority: 'medium', createdAt: new Date(), updatedAt: new Date() },
      ],
    });

    render(<Dashboard />);

    // Check statistics
    expect(screen.getByText('Total Meetings')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 meetings

    expect(screen.getByText('Total Notes')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // 3 notes

    expect(screen.getByText('Pending Actions')).toBeInTheDocument();
    expect(screen.getAllByText('2')[0]).toBeInTheDocument(); // 2 pending action items

    expect(screen.getByText('Active Reminders')).toBeInTheDocument();
    expect(screen.getAllByText('1')[0]).toBeInTheDocument(); // 1 pending reminder
  });
});