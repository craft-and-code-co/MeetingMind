import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  KeyIcon, 
  UserCircleIcon,
  BellIcon,
  MicrophoneIcon,
  TrashIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  Bars3Icon,
  SparklesIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { authService, databaseService } from '../services/supabase';
import { openAIService } from '../services/openai';
import { TemplateSelector } from '../components/TemplateSelector';
import { NotificationSettings } from '../components/NotificationSettings';
import { ModelComparison } from '../components/ModelComparison';

export const Settings: React.FC = () => {
  const { settings, setSettings, userId } = useStore();
  const [userEmail, setUserEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // Audio quality settings
  const [audioQuality, setAudioQuality] = useState(settings.audioQuality || 'medium');
  const [autoStartRecording, setAutoStartRecording] = useState(settings.autoStartRecording || false);
  
  // Template settings
  const [defaultMeetingTemplate, setDefaultMeetingTemplate] = useState(settings.defaultMeetingTemplate || 'custom');
  
  // Menu bar settings
  const [showMenuBar, setShowMenuBar] = useState(settings.showMenuBar !== false);
  const [menuBarAlwaysVisible, setMenuBarAlwaysVisible] = useState(settings.menuBarAlwaysVisible || false);
  
  // Model selection
  const [selectedModel, setSelectedModel] = useState(settings.openAIModel || 'gpt-4o');
  
  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    // Get current user email
    const loadUserInfo = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setUserEmail(user.email || '');
      }
    };
    loadUserInfo();
  }, []);

  const handleUpdateApiKey = async () => {
    if (!apiKey || !apiKey.startsWith('sk-') || apiKey.length < 20) {
      setError('Invalid API key format');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      // Store in Supabase
      if (userId) {
        await databaseService.storeApiKey(userId, apiKey);
      }

      // Store locally if Electron
      if (window.electronAPI) {
        await window.electronAPI.storeApiKey(apiKey);
      }

      // Update app state
      setSettings({ openAIApiKey: apiKey });
      openAIService.initialize(apiKey);

      setSuccessMessage('API key updated successfully!');
      setApiKey('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = () => {
    setSettings({
      audioQuality: audioQuality as 'low' | 'medium' | 'high',
      autoStartRecording,
      defaultMeetingTemplate,
      showMenuBar,
      menuBarAlwaysVisible,
      openAIModel: selectedModel as 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo-preview'
    });
    
    // Update OpenAI service with new model
    openAIService.setDefaultModel(selectedModel);
    
    setSuccessMessage('All settings saved successfully!');
    setHasUnsavedChanges(false);
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  // Track changes
  useEffect(() => {
    const hasChanges = 
      audioQuality !== (settings.audioQuality || 'medium') ||
      autoStartRecording !== (settings.autoStartRecording || false) ||
      defaultMeetingTemplate !== (settings.defaultMeetingTemplate || 'custom') ||
      showMenuBar !== (settings.showMenuBar !== false) ||
      menuBarAlwaysVisible !== (settings.menuBarAlwaysVisible || false) ||
      selectedModel !== (settings.openAIModel || 'gpt-4o');
    
    setHasUnsavedChanges(hasChanges);
  }, [audioQuality, autoStartRecording, defaultMeetingTemplate, showMenuBar, menuBarAlwaysVisible, selectedModel, settings]);

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    // In a real app, you'd call a Supabase function to delete all user data
    alert('Account deletion is not implemented in this demo');
  };

  return (
    <div className={`max-w-4xl mx-auto px-6 py-6 ${hasUnsavedChanges ? 'pb-24' : ''}`}>
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <CheckIcon className="h-5 w-5 text-green-400" />
              <p className="ml-3 text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Account Section */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <UserCircleIcon className="h-5 w-5 mr-2" />
              Account
            </h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{userEmail}</p>
            </div>
            <div>
              <button
                onClick={() => authService.resetPassword(userEmail)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>

        {/* API Key Section */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <KeyIcon className="h-5 w-5 mr-2" />
              OpenAI API Key
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current API Key
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {settings.openAIApiKey ? 
                    (showApiKey ? settings.openAIApiKey : '••••••••••••••••' + settings.openAIApiKey.slice(-4)) : 
                    'Not set'
                  }
                </p>
                {settings.openAIApiKey && (
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="mt-1 text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    {showApiKey ? 'Hide' : 'Show'} API Key
                  </button>
                )}
              </div>

              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                  Update API Key
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="password"
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <button
                    onClick={handleUpdateApiKey}
                    disabled={isLoading || !apiKey}
                    className="px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Updating...' : 'Update'}
                  </button>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recording Settings */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <MicrophoneIcon className="h-5 w-5 mr-2" />
              Recording Settings
            </h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Audio Quality
              </label>
              <select
                value={audioQuality}
                onChange={(e) => setAudioQuality(e.target.value as 'low' | 'medium' | 'high')}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="low">Low (smaller file size)</option>
                <option value="medium">Medium (balanced)</option>
                <option value="high">High (best quality)</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoStart"
                checked={autoStartRecording}
                onChange={(e) => setAutoStartRecording(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="autoStart" className="ml-2 block text-sm text-gray-900">
                Automatically start recording when a meeting is detected
              </label>
            </div>

          </div>
        </div>

        {/* OpenAI Model Selection */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2" />
              OpenAI Model Selection
            </h2>
          </div>
          <div className="px-6 py-4">
            <ModelComparison
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
            />
            
          </div>
        </div>

        {/* Menu Bar Settings */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Bars3Icon className="h-5 w-5 mr-2" />
              Menu Bar Settings
            </h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showMenuBar"
                checked={showMenuBar}
                onChange={(e) => setShowMenuBar(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="showMenuBar" className="ml-2 block text-sm text-gray-900">
                Show menu bar items (native macOS menu bar)
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="menuBarAlwaysVisible"
                checked={menuBarAlwaysVisible}
                onChange={(e) => setMenuBarAlwaysVisible(e.target.checked)}
                disabled={!showMenuBar}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="menuBarAlwaysVisible" className="ml-2 block text-sm text-gray-900">
                Keep menu bar always visible (even when app is hidden)
              </label>
            </div>

            <div className="text-sm text-gray-500 space-y-2">
              <p>• The system tray icon will always be available regardless of these settings</p>
              <p>• Menu bar shortcuts: Cmd+N (New Recording), Cmd+, (Settings), Cmd+D (Dashboard)</p>
              <p>• Use View menu to quickly navigate between Dashboard (Cmd+1) and Recordings (Cmd+2)</p>
            </div>

          </div>
        </div>

        {/* Meeting Templates */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
              Meeting Templates
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              {/* Explanation Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">How Templates Enhance Your Meetings</p>
                    <p className="mb-2">
                      Templates guide our AI to focus on specific aspects of your meetings:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><strong>Daily Standup:</strong> Extracts individual updates, blockers, and tasks</li>
                      <li><strong>One-on-One:</strong> Focuses on feedback, goals, and action items</li>
                      <li><strong>Client Meeting:</strong> Captures requirements, commitments, and follow-ups</li>
                      <li><strong>Brainstorming:</strong> Organizes ideas by theme and next steps</li>
                    </ul>
                    <p className="mt-2 text-xs italic">
                      The AI adapts its note-taking style based on your template choice.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Default Meeting Template
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  Set your most common meeting type as the default. You can always change it when recording.
                </p>
                <TemplateSelector
                  selectedTemplateId={defaultMeetingTemplate}
                  onSelectTemplate={setDefaultMeetingTemplate}
                  showInSettings={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <BellIcon className="h-5 w-5 mr-2" />
              Notifications
            </h2>
          </div>
          <NotificationSettings />
        </div>

        {/* Danger Zone */}
        <div className="bg-white shadow rounded-lg border-red-300">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-red-600 flex items-center">
              <TrashIcon className="h-5 w-5 mr-2" />
              Danger Zone
            </h2>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-gray-700 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Account
            </button>
          </div>
        </div>
        
        {/* Save Button - Fixed at bottom */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <p className="text-sm text-gray-600">
                You have unsaved changes
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save All Changes
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};