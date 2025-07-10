import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  ChartBarIcon, 
  HomeIcon, 
  CheckCircleIcon, 
  BellIcon, 
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  MicrophoneIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { authService } from '../services/supabase';
import { MeetingsSidebar } from './MeetingsSidebar';
import { FolderModal } from './FolderModal';
import { Folder } from '../types';
import { ChatAssistant } from './ChatAssistant';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, updateSettings, isRecording, setIsRecording, addFolder, updateFolder, deleteFolder, deleteMeeting } = useStore();
  
  const isDarkMode = settings.theme === 'dark';
  
  // Folder modal state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  
  // Pages that should show the sidebar
  const sidebarPages = ['/dashboard', '/search'];
  const shouldShowSidebar = sidebarPages.includes(location.pathname);
  
  // Global navigation listener for menu bar actions
  useEffect(() => {
    if (window.electronAPI) {
      const handleNavigation = (event: any, path: string) => {
        navigate(path);
      };
      
      const cleanup = window.electronAPI.onNavigateTo?.(handleNavigation);
      
      // Cleanup function
      return () => {
        cleanup?.();
      };
    }
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const toggleTheme = () => {
    updateSettings({ theme: isDarkMode ? 'light' : 'dark' });
  };

  // Apply dark class to document root
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleStartRecording = () => {
    // Navigate to home/dashboard to start recording
    navigate('/dashboard');
    // The recording will be triggered from the dashboard
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setShowFolderModal(true);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setShowFolderModal(true);
  };

  const handleDeleteFolder = (folderId: string) => {
    if (window.confirm('Are you sure you want to delete this folder? Meetings will be moved to the main view.')) {
      deleteFolder(folderId);
    }
  };

  const handleSaveFolder = (name: string, color: string) => {
    if (editingFolder) {
      updateFolder(editingFolder.id, { name, color, updatedAt: new Date() });
    } else {
      const newFolder: Folder = {
        id: Date.now().toString(),
        name,
        color,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addFolder(newFolder);
    }
    setShowFolderModal(false);
    setEditingFolder(null);
  };

  const handleMoveMeeting = (meetingId: string, folderId: string | undefined) => {
    // This is handled by the MeetingsSidebar component
    console.log('Moving meeting', meetingId, 'to folder', folderId);
  };
  
  const handleDeleteMeeting = (meetingId: string) => {
    deleteMeeting(meetingId);
  };

  const navigationItems = [
    { path: '/dashboard', label: 'Home', icon: HomeIcon },
    { path: '/search', label: 'Search', icon: MagnifyingGlassIcon },
    { path: '/analytics', label: 'Analytics', icon: ChartBarIcon },
    { path: '/action-items', label: 'Calendar', icon: CheckCircleIcon },
    { path: '/reminders', label: 'Reminders', icon: BellIcon },
    { path: '/settings', label: 'Settings', icon: Cog6ToothIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-none mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-xl font-bold text-gray-900 dark:text-white hover:opacity-80"
              >
                MeetingMind
              </button>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`
                      inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${isActive(item.path)
                        ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 mr-1.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
              {/* Recording Button - Removed to avoid redundancy
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isRecording
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
                title={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? (
                  <>
                    <StopIcon className="h-4 w-4 mr-1" />
                    Stop
                  </>
                ) : (
                  <>
                    <MicrophoneIcon className="h-4 w-4 mr-1" />
                    Record
                  </>
                )}
              </button>
              */}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md transition-colors text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="p-2 rounded-md transition-colors text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden pb-3">
            <div className="flex flex-wrap gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`
                      inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors
                      ${isActive(item.path)
                        ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex bg-gray-50 dark:bg-slate-900">
        {/* Sidebar */}
        {shouldShowSidebar && (
          <MeetingsSidebar
            onCreateFolder={handleCreateFolder}
            onEditFolder={handleEditFolder}
            onDeleteFolder={handleDeleteFolder}
            onMoveMeeting={handleMoveMeeting}
            onDeleteMeeting={handleDeleteMeeting}
          />
        )}
        
        {/* Main Content Area */}
        <main className="flex-1 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white">
          {children}
        </main>
      </div>

      {/* Folder Modal */}
      <FolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSave={handleSaveFolder}
        folder={editingFolder}
      />

      {/* Chat Assistant */}
      <ChatAssistant />
    </div>
  );
};