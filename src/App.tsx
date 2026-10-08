import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoomProvider, useRooms } from './context/RoomContext';
import { ChatProvider } from './context/ChatContext';
import { ContentProvider } from './context/ContentContext';
import { ProfilePictureProvider } from './context/ProfilePictureContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { RoomListingsView } from './components/RoomListingsView';
import { ChowksView } from './components/ChowksView';
import { AddEditRoom } from './components/AddEditRoom';
import { Dashboard } from './components/Dashboard';
import { PremiumPage } from './components/PremiumPage';
import { AdminPanel } from './components/AdminPanel';
import { RoomDetailModal } from './components/RoomDetailModal';
import { AuthModal, AuthMode } from './components/AuthModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { PWAOfflineIndicator } from './components/PWAOfflineIndicator';
import { RoomListing } from './types';
import { initNativeAndroid, setupAndroidBackButton } from './services/nativeAndroid';

function MainApp() {
  const { currentUser, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [selectedChowk, setSelectedChowk] = useState('all');
  const [activeModalRoom, setActiveModalRoom] = useState<RoomListing | null>(null);
  const [editingRoom, setEditingRoom] = useState<RoomListing | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [exitToastMessage, setExitToastMessage] = useState<string | null>(null);

  // Initialize native Android plugins & hardware back button handling
  useEffect(() => {
    initNativeAndroid();

    const cleanupBack = setupAndroidBackButton({
      hasOpenModal: () => {
        return !!activeModalRoom || authModalOpen || !!editingRoom;
      },
      closeActiveModal: () => {
        if (activeModalRoom) setActiveModalRoom(null);
        if (authModalOpen) setAuthModalOpen(false);
        if (editingRoom) setEditingRoom(null);
      },
      canGoBack: () => {
        return currentView !== 'home';
      },
      goBack: () => {
        setCurrentView('home');
      },
      onExitToast: (msg) => {
        setExitToastMessage(msg);
        setTimeout(() => setExitToastMessage(null), 2000);
      }
    });

    return () => cleanupBack();
  }, [activeModalRoom, authModalOpen, editingRoom, currentView]);

  const handleNavigate = (view: string, extraData?: any) => {
    if (view === 'listings' && extraData?.chowk) {
      setSelectedChowk(extraData.chowk);
    } else if (view === 'listings') {
      setSelectedChowk('all');
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2] text-stone-900 font-sans selection:bg-amber-200">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={() => {
          setAuthModalMode('login');
          setAuthModalOpen(true);
        }}
      />

      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectRoom={(r) => setActiveModalRoom(r)}
            onOpenAuth={() => {
              setAuthModalMode('signup');
              setAuthModalOpen(true);
            }}
          />
        )}

        {currentView === 'listings' && (
          <RoomListingsView
            initialChowk={selectedChowk}
            onSelectRoom={(r) => setActiveModalRoom(r)}
          />
        )}

        {currentView === 'chowks' && (
          <ChowksView
            onSelectChowk={(c) => {
              setSelectedChowk(c);
              setCurrentView('listings');
            }}
          />
        )}

        {currentView === 'add-room' && (
          <AddEditRoom
            initialRoom={editingRoom}
            onCancel={() => {
              setEditingRoom(null);
              setCurrentView('home');
            }}
            onSuccess={() => {
              setEditingRoom(null);
              setCurrentView('dashboard');
            }}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            onNavigate={handleNavigate}
            onEditRoom={(r) => {
              setEditingRoom(r);
              setCurrentView('add-room');
            }}
            onSelectRoom={(r) => setActiveModalRoom(r)}
          />
        )}

        {currentView === 'premium' && (
          <PremiumPage onNavigate={handleNavigate} />
        )}

        {currentView === 'admin' && isAdmin && (
          <AdminPanel />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-300 border-t border-amber-950/60 safe-pb">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h3 className="font-mithila text-lg font-bold text-amber-400">RoomSewa Janakpur</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Janakpurdham's dedicated platform for room, flat, and house rentals. 
                Built with Mithila values, connecting tenants and owners without intermediaries.
              </p>
              <PWAInstallButton variant="navbar" />
            </div>

            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">Popular Localities</h4>
              <ul className="text-xs space-y-2 text-stone-400">
                <li><button onClick={() => handleNavigate('listings', { chowk: 'Janaki Mandir' })} className="hover:text-amber-300">Janaki Mandir Area</button></li>
                <li><button onClick={() => handleNavigate('listings', { chowk: 'Bhanu Chowk' })} className="hover:text-amber-300">Bhanu Chowk (Station)</button></li>
                <li><button onClick={() => handleNavigate('listings', { chowk: 'Ramanand Chowk' })} className="hover:text-amber-300">Ramanand Chowk</button></li>
                <li><button onClick={() => handleNavigate('listings', { chowk: 'Shiva Chowk' })} className="hover:text-amber-300">Shiva Chowk</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">Quick Navigation</h4>
              <ul className="text-xs space-y-2 text-stone-400">
                <li><button onClick={() => handleNavigate('listings')} className="hover:text-amber-300">Find Rooms</button></li>
                <li><button onClick={() => handleNavigate('chowks')} className="hover:text-amber-300">Explore Chowks</button></li>
                <li><button onClick={() => handleNavigate('add-room')} className="hover:text-amber-300">Post Room (Free)</button></li>
                <li><button onClick={() => handleNavigate('premium')} className="hover:text-amber-300">Premium Upgrade</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">Service Guarantee</h4>
              <ul className="text-xs space-y-2 text-stone-400">
                <li>✓ Zero broker fee guarantee</li>
                <li>✓ Verified property addresses</li>
                <li>✓ Real-time Firestore sync</li>
                <li>✓ Native Android APK support</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
            <span>© {new Date().getFullYear()} RoomSewa Janakpur. All rights reserved.</span>
            <span>जनकपुरधाम, धनुषा, नेपाल • जय जानकी माता</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {activeModalRoom && (
        <RoomDetailModal
          room={activeModalRoom}
          onClose={() => setActiveModalRoom(null)}
          onOpenAuth={() => {
            setActiveModalRoom(null);
            setAuthModalMode('login');
            setAuthModalOpen(true);
          }}
        />
      )}

      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
        />
      )}

      {/* PWA & Network Banner */}
      <PWAUpdatePrompt />
      <PWAOfflineIndicator />

      {/* Android Native Back Toast */}
      {exitToastMessage && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
          <div className="bg-stone-900/90 text-stone-100 text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-stone-700/50 backdrop-blur">
            <span>{exitToastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <RoomProvider>
          <ChatProvider>
            <ProfilePictureProvider>
              <MainApp />
            </ProfilePictureProvider>
          </ChatProvider>
        </RoomProvider>
      </ContentProvider>
    </AuthProvider>
  );
}
