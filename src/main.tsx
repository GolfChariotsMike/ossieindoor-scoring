
import { createRoot } from 'react-dom/client';
import { StrictMode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { supabase } from './integrations/supabase/client';
import { cleanOldMatches } from './services/indexedDB';
import { isOffline } from './utils/offlineMode';

// Create a query client with default options for online/offline behavior
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry if we're offline
      retry: isOffline() ? false : 3,
      // Keep unused data in cache longer in offline mode
      gcTime: isOffline() ? 1000 * 60 * 60 * 24 : 1000 * 60 * 5, // 24 hours offline vs 5 minutes online
      // Consider data fresh longer in offline mode
      staleTime: isOffline() ? 1000 * 60 * 60 : 1000 * 30, // 1 hour offline vs 30 seconds online
      // Refetch less frequently in offline mode
      refetchInterval: isOffline() ? false : 1000 * 60 * 5,
    },
  },
});

const root = createRoot(document.getElementById('root')!);

// Component to handle database cleanup after app mounts
const DatabaseCleanup = () => {
  useEffect(() => {
    // Only run cleanup if online and after a delay to avoid startup issues
    if (!isOffline()) {
      const cleanupTimer = setTimeout(() => {
        cleanOldMatches().catch(error => {
          console.error('Failed to clean old matches:', error);
        });
      }, 10000); // 10 second delay
      
      return () => clearTimeout(cleanupTimer);
    }
  }, []);
  
  return null;
};

// Global error handler for uncaught errors
window.onerror = async (message, source, lineno, colno, error) => {
  console.error('Uncaught error:', {
    message,
    source,
    lineno,
    colno,
    error
  });
  
  try {
    // Only log to Supabase if we're online
    if (!isOffline()) {
      const browserInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        windowSize: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };

      await supabase.from('crash_logs').insert({
        error_type: 'uncaught_error',
        error_message: message?.toString() || 'Unknown error',
        error_stack: error?.stack,
        browser_info: browserInfo,
        url: window.location.href
      });
    }
  } catch (loggingError) {
    // If we can't log to the database, at least log to console
    console.error('Failed to log crash to database:', loggingError);
  }
};

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', async (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  try {
    // Only log to Supabase if we're online
    if (!isOffline()) {
      const browserInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        windowSize: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };

      await supabase.from('crash_logs').insert({
        error_type: 'unhandled_promise_rejection',
        error_message: event.reason?.message || 'Unknown promise rejection',
        error_stack: event.reason?.stack,
        browser_info: browserInfo,
        url: window.location.href
      });
    }
  } catch (loggingError) {
    console.error('Failed to log promise rejection to database:', loggingError);
  }
});

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <DatabaseCleanup />
    </QueryClientProvider>
  </StrictMode>
);
