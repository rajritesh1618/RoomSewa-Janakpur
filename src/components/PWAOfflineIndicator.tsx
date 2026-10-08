import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { onNetworkChange } from '../services/nativeAndroid';

export const PWAOfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const cleanup = onNetworkChange((online) => {
      setIsOnline(online);
      if (online) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    });

    return () => cleanup();
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300">
      {!isOnline ? (
        <div className="bg-amber-600/95 text-amber-50 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md backdrop-blur">
          <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
          <span>You are offline. Showing cached content. Online sync will resume once connected.</span>
        </div>
      ) : showReconnected ? (
        <div className="bg-emerald-600/95 text-emerald-50 px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-md backdrop-blur animate-fade-in">
          <Wifi className="w-3.5 h-3.5 text-emerald-200" />
          <span>Back online. Syncing latest listings with Firebase...</span>
        </div>
      ) : null}
    </div>
  );
};
