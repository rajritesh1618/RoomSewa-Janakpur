import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateFunction, setUpdateFunction] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    try {
      const update = registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('[PWA] New version detected and ready to install.');
          setNeedRefresh(true);
        },
        onOfflineReady() {
          console.log('[PWA] App is ready for offline usage.');
          setOfflineReady(true);
        },
        onRegisterError(error: any) {
          console.error('[PWA] Service worker registration error:', error);
        },
      });

      setUpdateFunction(() => update);
    } catch (e) {
      console.warn('[PWA] Service worker not supported or registered in this environment:', e);
    }
  }, []);

  const updateApp = async () => {
    if (updateFunction) {
      try {
        await updateFunction(true);
      } catch {
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  };

  return {
    needRefresh,
    offlineReady,
    updateApp,
    dismissRefresh: () => setNeedRefresh(false),
  };
}
