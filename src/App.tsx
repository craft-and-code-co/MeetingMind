import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Setup } from './pages/Setup';
import { Dashboard } from './pages/Dashboard';
import { ActionItems } from './pages/ActionItems';
import { MeetingDetail } from './pages/MeetingDetail';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { Reminders } from './pages/Reminders';
import { Search } from './pages/Search';
import { Analytics } from './pages/Analytics';
import { Layout } from './components/Layout';
import { useStore } from './store/useStore';
import { openAIService } from './services/openai';
import { authService, databaseService } from './services/supabase';
import './App.css';

const queryClient = new QueryClient();

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const settings = useStore((state) => state.settings);
  const setSettings = useStore((state) => state.setSettings);
  const setUserId = useStore((state) => state.setUserId);
  
  // Development mode flag
  const skipAuth = process.env.REACT_APP_SKIP_AUTH === 'true';

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        // Skip auth in development mode
        if (skipAuth) {
          setIsAuthenticated(true);
          setUserId('dev-user');
          
          // Check for API key in settings
          if (settings.openAIApiKey) {
            openAIService.initialize(settings.openAIApiKey);
            if (settings.openAIModel) {
              openAIService.setDefaultModel(settings.openAIModel);
            }
            setHasApiKey(true);
          }
        } else {
          const user = await authService.getCurrentUser();
          if (user) {
            setIsAuthenticated(true);
            setUserId(user.id);
            
            // Check for API key from Supabase first
            try {
              const storedKey = await databaseService.getApiKey(user.id);
              if (storedKey) {
                setSettings({ openAIApiKey: storedKey });
                openAIService.initialize(storedKey);
                if (settings.openAIModel) {
                  openAIService.setDefaultModel(settings.openAIModel);
                }
                setHasApiKey(true);
              }
            } catch (error) {
              console.error('Failed to get API key from database:', error);
            }
            
            // Fallback to local storage via Electron
            if (!hasApiKey && window.electronAPI) {
              try {
                const localKey = await window.electronAPI.getApiKey();
                if (localKey) {
                  setSettings({ openAIApiKey: localKey });
                  openAIService.initialize(localKey);
                  if (settings.openAIModel) {
                    openAIService.setDefaultModel(settings.openAIModel);
                  }
                  setHasApiKey(true);
                  // Sync to Supabase for future use
                  await databaseService.storeApiKey(user.id, localKey);
                }
              } catch (error) {
                console.error('Failed to get local API key:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setHasApiKey(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSettings, setUserId, hasApiKey, settings.openAIApiKey, settings.openAIModel, skipAuth]);

  useEffect(() => {
    // Initialize OpenAI when settings change
    console.log('Settings API key changed:', !!settings.openAIApiKey);
    if (settings.openAIApiKey) {
      openAIService.initialize(settings.openAIApiKey);
      if (settings.openAIModel) {
        openAIService.setDefaultModel(settings.openAIModel);
      }
      setHasApiKey(true);
      console.log('API key set, hasApiKey:', true);
    }
  }, [settings.openAIApiKey, settings.openAIModel]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Determine initial route
  const getInitialRoute = () => {
    if (!isAuthenticated && !skipAuth) return '/auth';
    if (!hasApiKey) return '/setup';
    return '/dashboard';
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={<Navigate to={getInitialRoute()} />}
          />
          <Route
            path="/auth"
            element={isAuthenticated ? <Navigate to="/setup" /> : <Auth />}
          />
          <Route
            path="/setup"
            element={
              !isAuthenticated ? <Navigate to="/auth" /> :
              hasApiKey ? <Navigate to="/dashboard" /> : 
              <Setup />
            }
          />
          <Route
            path="/dashboard"
            element={
              !isAuthenticated ? <Navigate to="/auth" /> :
              !hasApiKey ? <Navigate to="/setup" /> :
              <Layout><Dashboard /></Layout>
            }
          />
          <Route
            path="/action-items"
            element={
              !isAuthenticated ? <Navigate to="/auth" /> :
              !hasApiKey ? <Navigate to="/setup" /> :
              <Layout><ActionItems /></Layout>
            }
          />
          <Route
            path="/meeting/:meetingId"
            element={
              !isAuthenticated ? <Navigate to="/auth" /> :
              !hasApiKey ? <Navigate to="/setup" /> :
              <Layout><MeetingDetail /></Layout>
            }
          />
          <Route
            path="/settings"
            element={
              !isAuthenticated ? <Navigate to="/auth" /> :
              !hasApiKey ? <Navigate to="/setup" /> :
              <Layout><Settings /></Layout>
            }
          />
          <Route
            path="/reminders"
            element={
              !isAuthenticated ? <Navigate to="/auth" /> :
              !hasApiKey ? <Navigate to="/setup" /> :
              <Layout><Reminders /></Layout>
            }
          />
          <Route
            path="/search"
            element={
              !isAuthenticated ? <Navigate to="/auth" /> :
              !hasApiKey ? <Navigate to="/setup" /> :
              <Layout><Search /></Layout>
            }
          />
          <Route
            path="/analytics"
            element={
              !isAuthenticated ? <Navigate to="/auth" /> :
              !hasApiKey ? <Navigate to="/setup" /> :
              <Layout><Analytics /></Layout>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
