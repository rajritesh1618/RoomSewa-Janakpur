import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { JanakiMandirLogo } from './common/MithilaMotifs';

export const PWAUpdatePrompt: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateFunction, setUpdateFunction] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    // Dynamic import to support vite-plugin-pwa registerSW without breaking non-PWA runtime
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        const updateSW = registerSW({
          onNeedRefresh() {
            setNeedRefresh(true);
          },
          onOfflineReady() {
            console.log('RoomSewa is ready for offline caching');
          }
        });
        setUpdateFunction(() => () => updateSW(true));
      })
      .catch(() => {
        // Fallback for native/dev mode
      });
  }, []);

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 animate-slide-up max-w-sm w-full">
      <div className="bg-stone-900/95 text-stone-100 rounded-2xl p-4 shadow-2xl border border-amber-500/30 backdrop-blur flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <JanakiMandirLogo size={36} />
          <div>
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>New version available</span>
            </div>
            <p className="text-[11px] text-stone-300">Update now for the latest features</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => updateFunction?.()}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Update Now</span>
          </button>
          <button 
            onClick={() => setNeedRefresh(false)}
            className="text-stone-400 hover:text-stone-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
