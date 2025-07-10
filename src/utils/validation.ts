/**
 * Input validation utilities for security and data integrity
 */

import { validationConfig, rateLimitConfig } from '../config';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates OpenAI API key format
 */
export function validateOpenAIApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new ValidationError('API key is required');
  }
  
  // Check API key format using config
  const { prefix, minLength, maxLength } = validationConfig.apiKey;
  if (!apiKey.startsWith(prefix)) {
    throw new ValidationError('Invalid OpenAI API key format - must start with sk-');
  }
  
  if (apiKey.length < minLength || apiKey.length > maxLength) {
    throw new ValidationError(`Invalid OpenAI API key length - must be between ${minLength} and ${maxLength} characters`);
  }
  
  // Check for suspicious patterns
  if (apiKey.includes('<') || apiKey.includes('>') || apiKey.includes('"')) {
    throw new ValidationError('API key contains invalid characters');
  }
  
  return true;
}

/**
 * Sanitizes text input to prevent injection attacks
 */
export function sanitizeTextInput(input: string): string {
  if (typeof input !== 'string') {
    throw new ValidationError('Input must be a string');
  }
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>\"'&]/g, '') // Remove HTML/JS injection chars
    .replace(/\x00/g, '') // Remove null bytes
    .trim()
    .substring(0, validationConfig.fileSizes.maxTextLength); // Limit length to prevent DoS
}

/**
 * Validates file upload for audio transcription
 */
export function validateAudioFile(file: File): boolean {
  const allowedTypes = validationConfig.allowedAudioTypes;
  
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError('Invalid audio file type');
  }
  
  // Limit file size (OpenAI's limit)
  const maxSize = validationConfig.fileSizes.maxAudioSize;
  if (file.size > maxSize) {
    throw new ValidationError(`Audio file too large (max ${maxSize / 1024 / 1024}MB)`);
  }
  
  return true;
}

/**
 * Validates meeting title input
 */
export function validateMeetingTitle(title: string): string {
  const sanitized = sanitizeTextInput(title);
  
  if (sanitized.length < 1) {
    throw new ValidationError('Meeting title is required');
  }
  
  if (sanitized.length > validationConfig.inputLengths.maxMeetingTitle) {
    throw new ValidationError(`Meeting title too long (max ${validationConfig.inputLengths.maxMeetingTitle} characters)`);
  }
  
  return sanitized;
}

/**
 * Validates folder name input
 */
export function validateFolderName(name: string): string {
  const sanitized = sanitizeTextInput(name);
  
  if (sanitized.length < 1) {
    throw new ValidationError('Folder name is required');
  }
  
  if (sanitized.length > validationConfig.inputLengths.maxFolderName) {
    throw new ValidationError(`Folder name too long (max ${validationConfig.inputLengths.maxFolderName} characters)`);
  }
  
  // Prevent reserved names
  const reservedNames = validationConfig.reservedNames;
  if (reservedNames.includes(sanitized.toLowerCase())) {
    throw new ValidationError('Folder name is reserved');
  }
  
  return sanitized;
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = rateLimitConfig.default.maxRequests,
    private windowMs: number = rateLimitConfig.default.windowMs
  ) {}
  
  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
  
  getRemainingRequests(key: string): number {
    const requests = this.requests.get(key) || [];
    const now = Date.now();
    const validRequests = requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// Global rate limiter for OpenAI API calls
export const openAIRateLimiter = new RateLimiter(
  rateLimitConfig.openai.maxRequests,
  rateLimitConfig.openai.windowMs
);