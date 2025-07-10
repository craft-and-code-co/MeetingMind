import { useRef, useState, useCallback } from 'react';
import { audioConfig, intervalsConfig } from '../config';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onAudioChunk?: (audioBlob: Blob) => void;
}

export const AudioRecorder = ({ onRecordingComplete, onAudioChunk }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tempChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConfig.constraints
      });
      
      streamRef.current = stream;
      // Use a more compatible format for chunked recording
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/ogg';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          tempChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        console.log('Recording complete, blob size:', audioBlob.size);
        onRecordingComplete(audioBlob);
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(intervalsConfig.recording.dataCollection);
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, intervalsConfig.recording.timerUpdate);

      // Disable live transcription for now - requires more complex audio handling
      // Live transcription would need proper audio encoding and buffering
      // which is beyond the scope of a simple chunk-based approach

      // If Electron API available, notify main process
      if (window.electronAPI) {
        await window.electronAPI.startAudioCapture();
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone. Please check your permissions.');
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop chunk timer
      if (chunkTimerRef.current) {
        clearInterval(chunkTimerRef.current);
        chunkTimerRef.current = null;
      }
      
      setRecordingTime(0);
      tempChunksRef.current = [];

      // If Electron API available, notify main process
      if (window.electronAPI) {
        await window.electronAPI.stopAudioCapture();
      }
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    recordingTime: formatTime(recordingTime),
    recordingTimeSeconds: recordingTime,
    startRecording,
    stopRecording
  };
};