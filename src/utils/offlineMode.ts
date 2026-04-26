// Track the application's offline mode status
let forcedOfflineMode = false;
const OFFLINE_MODE_KEY = 'volleyball-app-offline-mode';

// Initialize from localStorage if available
try {
  const storedValue = localStorage.getItem(OFFLINE_MODE_KEY);
  if (storedValue) {
    forcedOfflineMode = storedValue === 'true';
  }
} catch (error) {
  console.error('Error reading offline mode from localStorage:', error);
}

export const enableForcedOfflineMode = () => {
  forcedOfflineMode = true;
  try {
    localStorage.setItem(OFFLINE_MODE_KEY, 'true');
  } catch (error) {
    console.error('Error saving offline mode to localStorage:', error);
  }
};

export const disableForcedOfflineMode = () => {
  forcedOfflineMode = false;
  try {
    localStorage.setItem(OFFLINE_MODE_KEY, 'false');
  } catch (error) {
    console.error('Error saving offline mode to localStorage:', error);
  }
};

export const ensureOnlineMode = () => {
  if (forcedOfflineMode) {
    disableForcedOfflineMode();
    return true;
  }
  return false;
};

export const isOffline = (): boolean => {
  return forcedOfflineMode || !navigator.onLine;
};

export const getOfflineStatus = (): { forced: boolean, network: boolean } => {
  return {
    forced: forcedOfflineMode,
    network: !navigator.onLine
  };
};

export const toggleOfflineMode = (): boolean => {
  if (forcedOfflineMode) {
    disableForcedOfflineMode();
    return false;
  } else {
    enableForcedOfflineMode();
    return true;
  }
};

export const resetOfflineMode = () => {
  forcedOfflineMode = false;
  try {
    localStorage.removeItem(OFFLINE_MODE_KEY);
  } catch (error) {
    console.error('Error removing offline mode from localStorage:', error);
  }
};
