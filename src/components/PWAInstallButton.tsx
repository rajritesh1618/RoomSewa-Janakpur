import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, Share, PlusSquare, Smartphone, X, ShieldCheck } from 'lucide-react';
import { JanakiMandirLogo } from './common/MithilaMotifs';
import { isAndroidApp } from '../services/nativeAndroid';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'mobile' | 'hero';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar', className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (installed PWA) or native Android
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true ||
      isAndroidApp();

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) return;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General prompt or APK link
      const directApk = '/android/app/build/outputs/apk/debug/app-debug.apk';
      const anchor = document.createElement('a');
      anchor.href = directApk;
      anchor.download = 'RoomSewa-Janakpur.apk';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
  };

  // If already installed
  if (isInstalled) {
    if (variant === 'hero') {
      return (
        <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-semibold border border-emerald-200 shadow-sm ${className}`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>App Installed</span>
        </div>
      );
    }
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>App Installed</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'hero' ? (
        <button
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 hover:from-amber-700 hover:to-rose-800 text-white font-bold text-sm sm:text-base shadow-lg shadow-amber-900/20 active:scale-95 transition-all cursor-pointer ${className}`}
        >
          <Smartphone className="w-5 h-5 text-amber-200 animate-bounce" />
          <span>Download Android App</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download App</span>
        </button>
      )}

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 relative animate-fade-in">
            <button 
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <JanakiMandirLogo size={44} />
              <div>
                <h3 className="font-bold text-stone-900 text-base">Install RoomSewa</h3>
                <p className="text-xs text-stone-500">Add to iPhone or iPad</p>
              </div>
            </div>

            <ol className="text-sm text-stone-700 space-y-3 mb-5 pl-1">
              <li className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                <span>Tap the <Share className="w-4 h-4 inline text-blue-600 mx-1" /> <strong>Share</strong> button in Safari</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                <span>Scroll down and select <PlusSquare className="w-4 h-4 inline text-stone-700 mx-1" /> <strong>Add to Home Screen</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">3</span>
                <span>Tap <strong>Add</strong> in the top-right corner</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
