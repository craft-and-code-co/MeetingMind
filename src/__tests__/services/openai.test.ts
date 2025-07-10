import { OpenAIService } from '../../services/openai';
import { ValidationError } from '../../utils/validation';
import * as validation from '../../utils/validation';

// Mock OpenAI module
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: jest.fn(),
      },
    },
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}));

// Mock validation module
jest.mock('../../utils/validation', () => ({
  ...jest.requireActual('../../utils/validation'),
  validateOpenAIApiKey: jest.fn(),
  validateAudioFile: jest.fn(),
  openAIRateLimiter: {
    canMakeRequest: jest.fn().mockReturnValue(true),
  },
}));

describe('OpenAIService', () => {
  let service: OpenAIService;
  let mockOpenAI: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    service = new OpenAIService();
    
    // Get the mocked OpenAI instance
    const OpenAI = (await import('openai')).default;
    mockOpenAI = new OpenAI({ apiKey: 'test-key' });
  });

  describe('initialize', () => {
    it('should initialize with valid API key', async () => {
      (validation.validateOpenAIApiKey as jest.Mock).mockReturnValue(true);
      
      await expect(service.initialize('sk-validkey123')).resolves.not.toThrow();
    });

    it('should throw error for invalid API key', async () => {
      (validation.validateOpenAIApiKey as jest.Mock).mockImplementation(() => {
        throw new ValidationError('Invalid API key format');
      });
      
      await expect(service.initialize('invalid-key')).rejects.toThrow('Invalid API key: Invalid API key format');
    });

    it('should lazy load OpenAI module', async () => {
      (validation.validateOpenAIApiKey as jest.Mock).mockReturnValue(true);
      
      await service.initialize('sk-validkey123');
      
      // Verify OpenAI was imported
      const OpenAI = (await import('openai')).default;
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'sk-validkey123',
        dangerouslyAllowBrowser: true,
      });
    });
  });

  describe('setDefaultModel', () => {
    it('should set the default model', () => {
      service.setDefaultModel('gpt-4');
      // Note: We can't directly test private property, but we can test its effect
      expect(() => service.setDefaultModel('gpt-4')).not.toThrow();
    });
  });

  describe('transcribeAudio', () => {
    beforeEach(async () => {
      (validation.validateOpenAIApiKey as jest.Mock).mockReturnValue(true);
      await service.initialize('sk-test');
    });

    it('should transcribe audio file successfully', async () => {
      const mockFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' });
      const mockResponse = { text: 'Transcribed text' };
      
      (validation.validateAudioFile as jest.Mock).mockReturnValue(true);
      mockOpenAI.audio.transcriptions.create.mockResolvedValue(mockResponse);
      
      const result = await service.transcribeAudio(mockFile);
      
      expect(result).toBe('Transcribed text');
      expect(validation.validateAudioFile).toHaveBeenCalledWith(mockFile);
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith({
        file: mockFile,
        model: 'whisper-1',
      });
    });

    it('should throw error if client not initialized', async () => {
      const uninitialized = new OpenAIService();
      const mockFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' });
      
      await expect(uninitialized.transcribeAudio(mockFile)).rejects.toThrow('OpenAI client not initialized');
    });

    it('should throw error for invalid audio file', async () => {
      const mockFile = new File(['audio'], 'test.txt', { type: 'text/plain' });
      
      (validation.validateAudioFile as jest.Mock).mockImplementation(() => {
        throw new ValidationError('Invalid audio file type');
      });
      
      await expect(service.transcribeAudio(mockFile)).rejects.toThrow('Invalid audio file: Invalid audio file type');
    });

    it('should throw error when rate limit exceeded', async () => {
      const mockFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' });
      
      (validation.validateAudioFile as jest.Mock).mockReturnValue(true);
      (validation.openAIRateLimiter.canMakeRequest as jest.Mock).mockReturnValue(false);
      
      await expect(service.transcribeAudio(mockFile)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('transcribeAudioChunk', () => {
    beforeEach(async () => {
      (validation.validateOpenAIApiKey as jest.Mock).mockReturnValue(true);
      await service.initialize('sk-test');
    });

    it('should transcribe audio chunk successfully', async () => {
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockOpenAI.audio.transcriptions.create.mockResolvedValue('Chunk transcript');
      
      const result = await service.transcribeAudioChunk(mockBlob);
      
      expect(result).toBe('Chunk transcript');
    });

    it('should return empty string on error', async () => {
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockOpenAI.audio.transcriptions.create.mockRejectedValue(new Error('API Error'));
      
      const result = await service.transcribeAudioChunk(mockBlob);
      
      expect(result).toBe('');
    });

    it('should return empty string when rate limited', async () => {
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      (validation.openAIRateLimiter.canMakeRequest as jest.Mock).mockReturnValue(false);
      
      const result = await service.transcribeAudioChunk(mockBlob);
      
      expect(result).toBe('');
    });
  });

  describe('enhanceNotes', () => {
    beforeEach(async () => {
      (validation.validateOpenAIApiKey as jest.Mock).mockReturnValue(true);
      await service.initialize('sk-test');
    });

    it('should enhance notes successfully', async () => {
      const transcript = 'Meeting transcript text';
      const template = 'Template text';
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              summary: 'Meeting summary',
              enhancedNotes: '# Enhanced Notes',
              actionItems: [{ description: 'Action 1' }],
              highlights: [{ type: 'decision', text: 'Important decision' }],
            }),
          },
        }],
      };
      
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
      
      const result = await service.enhanceNotes(transcript, template);
      
      expect(result).toEqual({
        summary: 'Meeting summary',
        enhancedNotes: '# Enhanced Notes',
        actionItems: [{ description: 'Action 1' }],
        highlights: [{ type: 'decision', text: 'Important decision' }],
      });
      
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: expect.stringContaining(transcript) }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });
    });

    it('should throw error if no response', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });
      
      await expect(service.enhanceNotes('transcript')).rejects.toThrow('No response from OpenAI');
    });
  });

  describe('generateFollowUpEmail', () => {
    beforeEach(async () => {
      (validation.validateOpenAIApiKey as jest.Mock).mockReturnValue(true);
      await service.initialize('sk-test');
    });

    it('should generate follow-up email', async () => {
      const meetingNotes = 'Meeting notes';
      const actionItems = [
        { id: '1', description: 'Task 1', status: 'pending' as const, meetingId: '1', date: '2024-01-01', createdAt: new Date() },
      ];
      const mockResponse = {
        choices: [{
          message: { content: 'Generated email content' },
        }],
      };
      
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
      
      const result = await service.generateFollowUpEmail(meetingNotes, actionItems);
      
      expect(result).toBe('Generated email content');
    });
  });

  describe('generateMeetingTitle', () => {
    beforeEach(async () => {
      (validation.validateOpenAIApiKey as jest.Mock).mockReturnValue(true);
      await service.initialize('sk-test');
    });

    it('should generate meeting title with different styles', async () => {
      const transcript = 'Meeting about project planning';
      const mockResponse = {
        choices: [{
          message: { content: 'Project Planning Session' },
        }],
      };
      
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
      
      const result = await service.generateMeetingTitle(transcript, 'professional');
      
      expect(result).toBe('Project Planning Session');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: expect.stringContaining('professional') }],
        temperature: 0.5,
        max_tokens: 50,
      });
    });

    it('should use higher temperature for creative style', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Creative Title' } }],
      });
      
      await service.generateMeetingTitle('transcript', 'creative');
      
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({ temperature: 0.8 })
      );
    });

    it('should return default title if no response', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });
      
      const result = await service.generateMeetingTitle('transcript');
      
      expect(result).toBe('Team Meeting');
    });
  });

  describe('extractReminders', () => {
    beforeEach(async () => {
      (validation.validateOpenAIApiKey as jest.Mock).mockReturnValue(true);
      await service.initialize('sk-test');
    });

    it('should extract reminders from transcript', async () => {
      const transcript = 'We need to submit the report by Friday';
      const actionItems = [{ description: 'Submit report' }];
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              reminders: [{
                title: 'Submit Report',
                description: 'Submit quarterly report',
                dueDate: '2024-01-05',
                priority: 'high' as const,
                reminderOffset: 24,
              }],
            }),
          },
        }],
      };
      
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
      
      const result = await service.extractReminders(transcript, actionItems);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        title: 'Submit Report',
        priority: 'high',
        reminderOffset: 24,
      });
    });

    it('should return empty array if no reminders', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({ reminders: [] }),
          },
        }],
      });
      
      const result = await service.extractReminders('transcript', []);
      
      expect(result).toEqual([]);
    });
  });
});