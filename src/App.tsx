import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useStore } from './store/useStore';
import { openAIService } from './services/openai';
import { authService, databaseService } from './services/supabase';
import './App.css';

// Lazy load all pages for code splitting
const Setup = lazy(() => import('./pages/Setup').then(module => ({ default: module.Setup })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const ActionItems = lazy(() => import('./pages/ActionItems').then(module => ({ default: module.ActionItems })));
const MeetingDetail = lazy(() => import('./pages/MeetingDetail').then(module => ({ default: module.MeetingDetail })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const Auth = lazy(() => import('./pages/Auth').then(module => ({ default: module.Auth })));
const Reminders = lazy(() => import('./pages/Reminders').then(module => ({ default: module.Reminders })));
const Search = lazy(() => import('./pages/Search').then(module => ({ default: module.Search })));
const Analytics = lazy(() => import('./pages/Analytics').then(module => ({ default: module.Analytics })));

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
            try {
              // Validate the key format before trying to initialize
              const { validateOpenAIApiKey } = await import('./utils/validation');
              validateOpenAIApiKey(settings.openAIApiKey);
              
              await openAIService.initialize(settings.openAIApiKey);
              if (settings.openAIModel) {
                openAIService.setDefaultModel(settings.openAIModel);
              }
              setHasApiKey(true);
            } catch (error) {
              console.warn('Invalid API key in settings:', error);
              // Clear invalid API key
              setSettings({ openAIApiKey: undefined });
            }
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
                try {
                  // Validate the key format before trying to initialize
                  const { validateOpenAIApiKey } = await import('./utils/validation');
                  validateOpenAIApiKey(storedKey);
                  
                  setSettings({ openAIApiKey: storedKey });
                  await openAIService.initialize(storedKey);
                  if (settings.openAIModel) {
                    openAIService.setDefaultModel(settings.openAIModel);
                  }
                  setHasApiKey(true);
                } catch (initError) {
                  console.warn('Invalid API key from database:', initError);
                  // Remove invalid key from database
                  try {
                    await databaseService.removeApiKey(user.id);
                  } catch (removeError) {
                    console.error('Failed to remove invalid key from database:', removeError);
                  }
                }
              }
            } catch (error) {
              console.error('Failed to get API key from database:', error);
            }
            
            // Fallback to local storage via Electron
            if (!hasApiKey && window.electronAPI) {
              try {
                const localKey = await window.electronAPI.getApiKey();
                if (localKey) {
                  try {
                    // Validate the key format before trying to initialize
                    const { validateOpenAIApiKey } = await import('./utils/validation');
                    validateOpenAIApiKey(localKey);
                    
                    setSettings({ openAIApiKey: localKey });
                    await openAIService.initialize(localKey);
                    if (settings.openAIModel) {
                      openAIService.setDefaultModel(settings.openAIModel);
                    }
                    setHasApiKey(true);
                    // Sync to Supabase for future use
                    try {
                      await databaseService.storeApiKey(user.id, localKey);
                    } catch (storeError) {
                      console.warn('Failed to sync API key to database:', storeError);
                    }
                  } catch (initError) {
                    console.warn('Invalid local API key:', initError);
                    // Clear invalid key from local storage if possible
                    if (window.electronAPI?.removeApiKey) {
                      try {
                        await window.electronAPI.removeApiKey();
                      } catch (removeError) {
                        console.error('Failed to remove invalid key from local storage:', removeError);
                      }
                    }
                  }
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
    const initializeOpenAI = async () => {
      console.log('Settings API key changed:', !!settings.openAIApiKey);
      if (settings.openAIApiKey) {
        try {
          // Validate the key format before trying to initialize
          const { validateOpenAIApiKey } = await import('./utils/validation');
          validateOpenAIApiKey(settings.openAIApiKey);
          
          await openAIService.initialize(settings.openAIApiKey);
          if (settings.openAIModel) {
            openAIService.setDefaultModel(settings.openAIModel);
          }
          setHasApiKey(true);
          console.log('API key set, hasApiKey:', true);
        } catch (error) {
          console.warn('Failed to initialize OpenAI with settings API key:', error);
          // Clear invalid API key from settings
          setSettings({ openAIApiKey: undefined });
          setHasApiKey(false);
        }
      } else {
        setHasApiKey(false);
      }
    };

    initializeOpenAI();
  }, [settings.openAIApiKey, settings.openAIModel, setSettings]);

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
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('App-level error:', error, errorInfo);
      // In production, send to error tracking service
    }}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
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
          </Suspense>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
