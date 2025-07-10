import {
  validateOpenAIApiKey,
  sanitizeTextInput,
  validateAudioFile,
  validateMeetingTitle,
  validateFolderName,
  RateLimiter,
  ValidationError,
} from '../../utils/validation';

describe('Validation Utilities', () => {
  describe('validateOpenAIApiKey', () => {
    it('should validate correct OpenAI API key format', () => {
      const validKey = 'sk-' + 'a'.repeat(48); // sk- + 48 chars = 51 total
      expect(() => validateOpenAIApiKey(validKey)).not.toThrow();
      expect(validateOpenAIApiKey(validKey)).toBe(true);
    });

    it('should throw error for invalid key format', () => {
      expect(() => validateOpenAIApiKey('')).toThrow('API key is required');
      expect(() => validateOpenAIApiKey('invalid-key')).toThrow('Invalid OpenAI API key format');
      expect(() => validateOpenAIApiKey('sk-short')).toThrow('Invalid OpenAI API key format');
    });

    it('should throw error for keys with invalid characters', () => {
      const keyWithInvalidChars = 'sk-' + 'a'.repeat(40) + '<script>';
      expect(() => validateOpenAIApiKey(keyWithInvalidChars)).toThrow('API key contains invalid characters');
    });
  });

  describe('sanitizeTextInput', () => {
    it('should remove dangerous characters', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const sanitized = sanitizeTextInput(input);
      expect(sanitized).toBe('Hello scriptalert(xss)/script World');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      expect(sanitizeTextInput(input)).toBe('Hello World');
    });

    it('should limit length to 10000 characters', () => {
      const longInput = 'a'.repeat(15000);
      const sanitized = sanitizeTextInput(longInput);
      expect(sanitized.length).toBe(10000);
    });

    it('should throw error for non-string input', () => {
      expect(() => sanitizeTextInput(123 as any)).toThrow('Input must be a string');
    });
  });

  describe('validateAudioFile', () => {
    it('should validate allowed audio file types', () => {
      const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/m4a', 'audio/mp4'];
      
      validTypes.forEach(type => {
        const file = new File([''], 'test.mp3', { type });
        expect(() => validateAudioFile(file)).not.toThrow();
      });
    });

    it('should throw error for invalid file types', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(() => validateAudioFile(file)).toThrow('Invalid audio file type');
    });

    it('should throw error for files larger than 25MB', () => {
      const largeFile = new File(['a'.repeat(26 * 1024 * 1024)], 'large.mp3', { type: 'audio/mp3' });
      expect(() => validateAudioFile(largeFile)).toThrow('Audio file too large (max 25MB)');
    });
  });

  describe('validateMeetingTitle', () => {
    it('should validate and sanitize meeting titles', () => {
      const title = 'Project <script>Meeting</script>';
      const validated = validateMeetingTitle(title);
      expect(validated).toBe('Project scriptMeeting/script');
    });

    it('should throw error for empty title', () => {
      expect(() => validateMeetingTitle('')).toThrow('Meeting title is required');
      expect(() => validateMeetingTitle('   ')).toThrow('Meeting title is required');
    });

    it('should throw error for title exceeding 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      expect(() => validateMeetingTitle(longTitle)).toThrow('Meeting title too long (max 200 characters)');
    });
  });

  describe('validateFolderName', () => {
    it('should validate and sanitize folder names', () => {
      const name = 'My <Folder>';
      const validated = validateFolderName(name);
      expect(validated).toBe('My Folder');
    });

    it('should throw error for reserved names', () => {
      const reservedNames = ['undefined', 'null', 'system', 'admin'];
      reservedNames.forEach(name => {
        expect(() => validateFolderName(name)).toThrow('Folder name is reserved');
      });
    });

    it('should throw error for folder name exceeding 50 characters', () => {
      const longName = 'a'.repeat(51);
      expect(() => validateFolderName(longName)).toThrow('Folder name too long (max 50 characters)');
    });
  });

  describe('RateLimiter', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should allow requests within rate limit', () => {
      const limiter = new RateLimiter(3, 60000); // 3 requests per minute
      
      expect(limiter.canMakeRequest('user1')).toBe(true);
      expect(limiter.canMakeRequest('user1')).toBe(true);
      expect(limiter.canMakeRequest('user1')).toBe(true);
    });

    it('should block requests exceeding rate limit', () => {
      const limiter = new RateLimiter(2, 60000); // 2 requests per minute
      
      expect(limiter.canMakeRequest('user1')).toBe(true);
      expect(limiter.canMakeRequest('user1')).toBe(true);
      expect(limiter.canMakeRequest('user1')).toBe(false);
    });

    it('should reset rate limit after time window', () => {
      const limiter = new RateLimiter(1, 60000); // 1 request per minute
      
      expect(limiter.canMakeRequest('user1')).toBe(true);
      expect(limiter.canMakeRequest('user1')).toBe(false);
      
      // Advance time by 1 minute
      jest.advanceTimersByTime(60001);
      
      expect(limiter.canMakeRequest('user1')).toBe(true);
    });

    it('should track remaining requests correctly', () => {
      const limiter = new RateLimiter(3, 60000);
      
      expect(limiter.getRemainingRequests('user1')).toBe(3);
      limiter.canMakeRequest('user1');
      expect(limiter.getRemainingRequests('user1')).toBe(2);
      limiter.canMakeRequest('user1');
      expect(limiter.getRemainingRequests('user1')).toBe(1);
    });

    it('should handle different users separately', () => {
      const limiter = new RateLimiter(1, 60000);
      
      expect(limiter.canMakeRequest('user1')).toBe(true);
      expect(limiter.canMakeRequest('user1')).toBe(false);
      expect(limiter.canMakeRequest('user2')).toBe(true);
    });
  });
});