
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { supabase } from './integrations/supabase/client';

const queryClient = new QueryClient();
const root = createRoot(document.getElementById('root')!);

// Global error handler for uncaught errors
window.onerror = async (message, source, lineno, colno, error) => {
  try {
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

    console.error('Crash logged to database:', {
      message,
      source,
      lineno,
      colno,
      error
    });
  } catch (loggingError) {
    // If we can't log to the database, at least log to console
    console.error('Failed to log crash to database:', loggingError);
  }
};

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', async (event) => {
  try {
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

    console.error('Promise rejection logged to database:', event.reason);
  } catch (loggingError) {
    console.error('Failed to log promise rejection to database:', loggingError);
  }
});

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
