import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';

export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const isAndroidApp = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

/**
 * Initialize native Android plugins:
 * - Configure Status Bar
 * - Dismiss Splash Screen after mount
 */
export async function initNativeAndroid(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    // Configure Status Bar
    await StatusBar.setStyle({ style: Style.Dark }); // White icons
    await StatusBar.setBackgroundColor({ color: '#991b1b' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.warn('Status Bar configuration error:', err);
  }

  try {
    // Hide native splash screen smoothly
    await SplashScreen.hide({ fadeOutDuration: 400 });
  } catch (err) {
    console.warn('Splash Screen hide error:', err);
  }
}

/**
 * Setup Android Hardware Back Button listener
 * Returns cleanup function
 */
export function setupAndroidBackButton(handlers: {
  hasOpenModal: () => boolean;
  closeActiveModal: () => void;
  canGoBack: () => boolean;
  goBack: () => void;
  onExitToast: (msg: string) => void;
}): () => void {
  if (!isNativeApp()) {
    return () => {};
  }

  let lastBackPressTime = 0;

  const backListener = CapApp.addListener('backButton', () => {
    // 1. If modal/dialog is open, close it
    if (handlers.hasOpenModal()) {
      handlers.closeActiveModal();
      return;
    }

    // 2. If navigated inside app, go back to previous screen
    if (handlers.canGoBack()) {
      handlers.goBack();
      return;
    }

    // 3. Double-tap back button within 2 seconds to exit app
    const now = Date.now();
    if (now - lastBackPressTime < 2000) {
      CapApp.exitApp();
    } else {
      lastBackPressTime = now;
      handlers.onExitToast('Press back again to exit RoomSewa');
    }
  });

  return () => {
    backListener.then(l => l.remove()).catch(() => {});
  };
}

/**
 * Network state monitoring helper for native and web
 */
export async function getNetworkStatus(): Promise<{ connected: boolean; connectionType: string }> {
  try {
    const status = await Network.getStatus();
    return {
      connected: status.connected,
      connectionType: status.connectionType
    };
  } catch {
    return {
      connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
      connectionType: 'unknown'
    };
  }
}

export function onNetworkChange(callback: (connected: boolean) => void): () => void {
  try {
    const listenerPromise = Network.addListener('networkStatusChange', status => {
      callback(status.connected);
    });

    return () => {
      listenerPromise.then(l => l.remove()).catch(() => {});
    };
  } catch {
    const onOnline = () => callback(true);
    const onOffline = () => callback(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }
}
