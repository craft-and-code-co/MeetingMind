import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export const Setup: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const setSettings = useStore((state) => state.setSettings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate API key format
      if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
        throw new Error('Invalid API key format');
      }

      // Store API key securely via Electron
      if (window.electronAPI) {
        await window.electronAPI.storeApiKey(apiKey);
      } else {
        console.warn('Electron API not available, storing in memory only');
      }

      // Update settings
      setSettings({ openAIApiKey: apiKey });
      
      // Navigation will happen automatically via App.tsx routing
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Welcome to MyGranola
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