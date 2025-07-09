import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Setup } from './pages/Setup';
import { Dashboard } from './pages/Dashboard';
import { ActionItems } from './pages/ActionItems';
import { MeetingDetail } from './pages/MeetingDetail';
import { Auth } from './pages/Auth';
import { useStore } from './store/useStore';
import { openAIService } from './services/openai';
import { authService } from './services/supabase';
import './App.css';

const queryClient = new QueryClient();

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const settings = useStore((state) => state.settings);
  const setSettings = useStore((state) => state.setSettings);
  const setUserId = useStore((state) => state.setUserId);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
          setUserId(user.id);
          
          // Check for API key if authenticated
          if (window.electronAPI) {
            const storedKey = await window.electronAPI.getApiKey();
            if (storedKey) {
              setSettings({ openAIApiKey: storedKey });
              openAIService.initialize(storedKey);
              setHasApiKey(true);
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
  }, [setSettings, setUserId]);

  useEffect(() => {
    // Initialize OpenAI when settings change
    if (settings.openAIApiKey) {
      openAIService.initialize(settings.openAIApiKey);
      setHasApiKey(true);
    }
  }, [settings.openAIApiKey]);

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
    if (!isAuthenticated) return '/auth';
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
              <Dashboard />
            }
          />
          <Route
            path="/action-items"
            element={
              !isAuthenticated ? <Navigate to="/auth" /> :
              !hasApiKey ? <Navigate to="/setup" /> :
              <ActionItems />
            }
          />
          <Route
            path="/meeting/:meetingId"
            element={
              !isAuthenticated ? <Navigate to="/auth" /> :
              !hasApiKey ? <Navigate to="/setup" /> :
              <MeetingDetail />
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
