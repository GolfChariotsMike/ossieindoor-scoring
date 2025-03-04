
import { toast } from "@/hooks/use-toast";

// Track the application's offline mode status
let forcedOfflineMode = false;
const OFFLINE_MODE_KEY = 'volleyball-app-offline-mode';

// Initialize from localStorage if available
try {
  const storedValue = localStorage.getItem(OFFLINE_MODE_KEY);
  if (storedValue) {
    forcedOfflineMode = storedValue === 'true';
    console.log('Initialized offline mode from storage:', forcedOfflineMode);
  }
} catch (error) {
  console.error('Error reading offline mode from localStorage:', error);
}

/**
 * Enable forced offline mode to prevent network requests
 */
export const enableForcedOfflineMode = () => {
  forcedOfflineMode = true;
  try {
    localStorage.setItem(OFFLINE_MODE_KEY, 'true');
    console.log('Offline mode enabled and saved to localStorage');
  } catch (error) {
    console.error('Error saving offline mode to localStorage:', error);
  }
  
  // Don't show toast if we're already in offline mode
  if (navigator.onLine) {
    toast({
      title: "Offline Mode Enabled",
      description: "All requests will be handled locally until end of night.",
      duration: 3000,
    });
  }
};

/**
 * Disable forced offline mode to allow network requests
 */
export const disableForcedOfflineMode = () => {
  forcedOfflineMode = false;
  try {
    localStorage.setItem(OFFLINE_MODE_KEY, 'false');
    console.log('Offline mode disabled and saved to localStorage');
  } catch (error) {
    console.error('Error saving offline mode to localStorage:', error);
  }
  
  if (navigator.onLine) {
    toast({
      title: "Online Mode Restored",
      description: "Connection to server has been re-established.",
      duration: 3000,
    });
  } else {
    toast({
      title: "Online Mode Attempted",
      description: "Server connection will be restored when network is available.",
      duration: 3000,
    });
  }
};

/**
 * Ensure we're in online mode (for main pages)
 */
export const ensureOnlineMode = () => {
  if (forcedOfflineMode) {
    disableForcedOfflineMode();
    console.log('Forced online mode for main page navigation');
    return true;
  }
  return false;
};

/**
 * Check if the application is currently in offline mode
 * (either forced or due to actual network status)
 */
export const isOffline = (): boolean => {
  return forcedOfflineMode || !navigator.onLine;
};

/**
 * Get the current offline mode status for displaying in UI
 */
export const getOfflineStatus = (): { forced: boolean, network: boolean } => {
  return {
    forced: forcedOfflineMode,
    network: !navigator.onLine
  };
};

/**
 * Toggle offline mode
 */
export const toggleOfflineMode = (): boolean => {
  if (forcedOfflineMode) {
    disableForcedOfflineMode();
    return false;
  } else {
    enableForcedOfflineMode();
    return true;
  }
};

/**
 * Reset offline mode when the application is restarted
 */
export const resetOfflineMode = () => {
  forcedOfflineMode = false;
  try {
    localStorage.removeItem(OFFLINE_MODE_KEY);
    console.log('Offline mode reset and removed from localStorage');
  } catch (error) {
    console.error('Error removing offline mode from localStorage:', error);
  }
};

// Listen for actual network status changes
window.addEventListener('online', () => {
  if (!forcedOfflineMode) {
    console.log('Network connection restored (but will not be used if forced offline mode is enabled)');
  }
});

window.addEventListener('offline', () => {
  console.log('Network connection lost');
  if (!forcedOfflineMode) {
    toast({
      title: "You're offline",
      description: "Don't worry, everything will work in offline mode.",
      variant: "default",
    });
  }
});
