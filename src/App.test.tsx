import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { useStore } from './store/useStore';

// Mock dependencies
jest.mock('./services/openai');
jest.mock('./services/supabase', () => ({
  authService: {
    getCurrentUser: jest.fn().mockResolvedValue(null),
    onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    signOut: jest.fn(),
  },
  databaseService: {
    getApiKey: jest.fn().mockResolvedValue(null),
    storeApiKey: jest.fn(),
  },
}));

describe('App', () => {
  beforeEach(() => {
    // Reset store with minimal required settings
    useStore.setState({
      settings: {
        audioQuality: 'medium',
        autoStartRecording: false
      },
      setSettings: jest.fn(),
      setUserId: jest.fn(),
    });
  });

  it('should render loading state initially', () => {
    render(<App />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render auth page when not authenticated', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Welcome to MeetingMind/i)).toBeInTheDocument();
    });
  });

  it('should handle authentication flow', async () => {
    const { authService } = require('./services/supabase');
    authService.getCurrentUser.mockResolvedValue({ id: 'user-123' });
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Enter your OpenAI API key/i)).toBeInTheDocument();
    });
  });
});
