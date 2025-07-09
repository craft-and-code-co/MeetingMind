import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { databaseService } from '../services/supabase';
import { openAIService } from '../services/openai';

export const Setup: React.FC = () => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const [error, setError] = useState('');
  const setSettings = useStore((state) => state.setSettings);
  const userId = useStore((state) => state.userId);

  // Check if user already has an API key stored
  useEffect(() => {
    const checkExistingKey = async () => {
      if (!userId) return;
      
      try {
        const storedKey = await databaseService.getApiKey(userId);
        if (storedKey) {
          setSettings({ openAIApiKey: storedKey });
          // Key found and set, navigation will happen automatically
        }
      } catch (error) {
        console.error('Failed to check for existing API key:', error);
      } finally {
        setIsCheckingKey(false);
      }
    };

    checkExistingKey();
  }, [userId, setSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate API key format
      if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
        throw new Error('Invalid API key format');
      }

      // Try to store in Supabase first for cross-device access
      let supabaseSuccess = false;
      if (userId) {
        try {
          await databaseService.storeApiKey(userId, apiKey);
          supabaseSuccess = true;
        } catch (error) {
          console.error('Failed to store in Supabase:', error);
          // Continue - we'll fall back to local storage
        }
      }

      // Also store locally via Electron if available
      if (window.electronAPI) {
        try {
          await window.electronAPI.storeApiKey(apiKey);
        } catch (error) {
          console.error('Failed to store locally:', error);
          if (!supabaseSuccess) {
            throw new Error('Failed to save API key. Please check your connection and try again.');
          }
        }
      }

      // Update settings
      setSettings({ openAIApiKey: apiKey });
      
      // Initialize OpenAI service
      openAIService.initialize(apiKey);
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking for existing configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Welcome to MeetingMind
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your AI-powered meeting assistant
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-gray-700"
              >
                OpenAI API Key
              </label>
              <div className="mt-1">
                <input
                  id="apiKey"
                  name="apiKey"
                  type="password"
                  autoComplete="off"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="sk-..."
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Your API key will be stored securely on your device
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || !apiKey}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Get Started'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Need an API key?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Get API Key from OpenAI
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};