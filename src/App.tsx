import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoomProvider, useRooms } from './context/RoomContext';
import { ChatProvider } from './context/ChatContext';
import { ContentProvider } from './context/ContentContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { RoomListingsView } from './components/RoomListingsView';
import { ChowksView } from './components/ChowksView';
import { AddEditRoom } from './components/AddEditRoom';
import { Dashboard } from './components/Dashboard';
import { PremiumPage } from './components/PremiumPage';
import { AdminPanel } from './components/AdminPanel';
import { MessagesView } from './components/chat/MessagesView';
import { NoticeBanner } from './components/chat/NoticeBanner';
import { AuthModal, AuthMode } from './components/AuthModal';
import { RoomDetailModal } from './components/RoomDetailModal';
import { ProfilePictureProvider } from './context/ProfilePictureContext';
import { ProfilePictureModals } from './components/profile/ProfilePictureModals';
import { MandatoryPhoneModal } from './components/profile/MandatoryPhoneModal';
import { RoomListing } from './types';
import { APIProvider } from '@vis.gl/react-google-maps';
import { verifyEmailRoomSewa } from './services/authService';

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyD5D09SQ5IUwybuEVxcM64JvHQqTiBJzBs';

function MainAppContent() {
  const { currentUser, userProfile, isOwner, isAdmin } = useAuth();
  const { rooms } = useRooms();
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedChowkFilter, setSelectedChowkFilter] = useState<string>('all');
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);
  const [activeModalRoom, setActiveModalRoom] = useState<RoomListing | null>(null);
  const [editingRoom, setEditingRoom] = useState<RoomListing | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authResetToken, setAuthResetToken] = useState('');
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'my-rooms' | 'saved' | 'inquiries' | 'profile'>('overview');
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  // Handle URL actions: email verification and password reset links
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const action = searchParams.get('action');
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (action === 'verify-email' && token && email) {
      // Clear URL params without page reload
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      verifyEmailRoomSewa(token, email)
        .then((res) => {
          setAuthEmail(email);
          setAuthModalMode('login');
          setAuthSuccessMessage(
            res.message || '🎉 Your RoomSewa account has been verified! You can now log in using your Gmail and password.'
          );
          setAuthModalOpen(true);
        })
        .catch((err) => {
          setAuthEmail(email);
          setAuthModalMode('login');
          setAuthSuccessMessage(err.message || 'Verification could not be completed.');
          setAuthModalOpen(true);
        });
    } else if (action === 'reset-password' && token && email) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      setAuthEmail(email);
      setAuthResetToken(token);
      setAuthModalMode('reset-password');
      setAuthSuccessMessage('Please set a new password for your account.');
      setAuthModalOpen(true);
    }
  }, []);

  // Check if current user is authorized to view Premium Dashboard
  const isPremiumDashboardAllowed = Boolean(currentUser && (isOwner || userProfile?.role === 'owner' || isAdmin));

  // Automatically open Admin Panel directly when an admin signs in
  const [wasAdmin, setWasAdmin] = useState(isAdmin);
  useEffect(() => {
    if (!wasAdmin && isAdmin) {
      setCurrentView('admin');
      window.location.hash = 'admin';
    }
    setWasAdmin(isAdmin);
  }, [isAdmin, wasAdmin]);

  // Sync route and enforce route protection on URL hash change or initial load
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (!hash) return;
      if (hash === 'premium') {
        // Enforce owner check strictly on route/URL entry
        if (!isPremiumDashboardAllowed) {
          window.location.hash = '';
          setCurrentView('home');
          return;
        }
      }
      if (hash === 'admin') {
        // Enforce admin check strictly on route/URL entry
        if (!isAdmin) {
          window.location.hash = '';
          setCurrentView('home');
          return;
        }
      }
      if (['home', 'listings', 'chowks', 'add-room', 'dashboard', 'profile', 'premium', 'admin', 'messages'].includes(hash)) {
        setCurrentView(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isPremiumDashboardAllowed, isAdmin]);

  // Ensure that if user logs out or role changes to seeker while viewing premium, redirect immediately to home
  useEffect(() => {
    if (currentView === 'premium' && !isPremiumDashboardAllowed) {
      setCurrentView('home');
      if (window.location.hash === '#premium') {
        window.location.hash = '';
      }
    }
  }, [currentView, isPremiumDashboardAllowed]);

  // Ensure that if user is on admin view but is not admin, redirect immediately to home
  useEffect(() => {
    if (currentView === 'admin' && !isAdmin) {
      setCurrentView('home');
      if (window.location.hash === '#admin') {
        window.location.hash = '';
      }
    }
  }, [currentView, isAdmin]);

  const handleNavigate = (view: string, extraData?: any) => {
    if (view === 'premium') {
      if (!isPremiumDashboardAllowed) {
        // Reject navigation attempt by seeker or unauthenticated user
        return;
      }
    }
    if (view === 'admin') {
      if (!isAdmin) {
        // Normal users must never access admin features
        return;
      }
    }
    if (view === 'listings') {
      if (extraData?.chowk) {
        setSelectedChowkFilter(extraData.chowk);
      } else {
        setSelectedChowkFilter('all');
      }
    }
    if (view === 'dashboard' && extraData?.tab) {
      setDashboardTab(extraData.tab);
    }
    if (view === 'messages') {
      setSelectedConversationId(extraData?.conversationId);
    }
    setCurrentView(view);
    if (view === 'home') {
      if (window.location.hash) window.location.hash = '';
    } else {
      window.location.hash = view;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'login' | 'signup' | 'forgot-password' | 'reset-password' = 'login', emailParam: string = '') => {
    setAuthModalMode(mode);
    if (emailParam) {
      setAuthEmail(emailParam);
    }
    setAuthSuccessMessage(null);
    setAuthModalOpen(true);
  };

  const handleSelectRoom = (room: RoomListing) => {
    setActiveModalRoom(room);
  };

  const handleOpenChat = (conversationId: string) => {
    handleNavigate('messages', { conversationId });
  };

  const handleStartEditRoom = (room: RoomListing) => {
    setEditingRoom(room);
    setCurrentView('add-room');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Google Maps Quota Notice Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
      />

      {/* Global Notice Banner */}
      <NoticeBanner />

      {/* Main Routed Content Area */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            onNavigateListings={(chowk) => {
              if (chowk) setSelectedChowkFilter(chowk);
              else setSelectedChowkFilter('all');
              setCurrentView('listings');
            }}
            onSelectRoom={handleSelectRoom}
            onOpenAuth={handleOpenAuth}
            onOpenChat={handleOpenChat}
            onNavigateAddRoom={() => {
              setEditingRoom(null);
              setCurrentView('add-room');
            }}
            onNavigatePremium={() => setCurrentView('premium')}
          />
        )}

        {currentView === 'listings' && (
          <RoomListingsView
            initialChowk={selectedChowkFilter}
            onSelectRoom={handleSelectRoom}
            onOpenAuth={() => handleOpenAuth('login')}
            onOpenChat={handleOpenChat}
          />
        )}

        {currentView === 'chowks' && (
          <ChowksView
            onSelectChowk={(cName) => {
              setSelectedChowkFilter(cName);
              setCurrentView('listings');
            }}
          />
        )}

        {currentView === 'add-room' && (
          <AddEditRoom
            initialData={editingRoom}
            onSuccess={() => {
              setEditingRoom(null);
              setCurrentView('dashboard');
            }}
            onCancel={() => {
              setEditingRoom(null);
              setCurrentView('dashboard');
            }}
            onNavigatePremium={() => setCurrentView('premium')}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            initialTab={dashboardTab}
            onNavigateAddRoom={() => {
              setEditingRoom(null);
              setCurrentView('add-room');
            }}
            onEditRoom={handleStartEditRoom}
            onSelectRoom={handleSelectRoom}
            onNavigatePremium={() => setCurrentView('premium')}
            onOpenChat={handleOpenChat}
          />
        )}

        {currentView === 'profile' && (
          <Dashboard
            initialTab="profile"
            onNavigateAddRoom={() => {
              setEditingRoom(null);
              setCurrentView('add-room');
            }}
            onEditRoom={handleStartEditRoom}
            onSelectRoom={handleSelectRoom}
            onNavigatePremium={() => setCurrentView('premium')}
            onOpenChat={handleOpenChat}
          />
        )}

        {currentView === 'premium' && (
          <PremiumPage
            onOpenAuth={() => handleOpenAuth('login')}
            onNavigateHome={() => handleNavigate('home')}
            onOpenChat={handleOpenChat}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel
            onSelectRoom={handleSelectRoom}
            onEditRoom={handleStartEditRoom}
            onOpenChat={handleOpenChat}
          />
        )}

        {currentView === 'messages' && (
          <MessagesView
            initialConversationId={selectedConversationId}
            onOpenAuth={() => handleOpenAuth('login')}
            onSelectRoomById={(roomId: string) => {
              const found = rooms.find((r) => r.id === roomId);
              if (found) {
                setActiveModalRoom(found);
              }
            }}
          />
        )}
      </main>

      {/* Global Modals */}
      <AuthModal
        key={`auth-modal-${authModalMode}-${authModalOpen}-${authEmail}`}
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthSuccessMessage(null);
        }}
        defaultMode={authModalMode}
        initialEmail={authEmail}
        initialResetToken={authResetToken}
        verificationSuccessMessage={authSuccessMessage}
        onAdminLoginSuccess={() => handleNavigate('admin')}
      />

      <RoomDetailModal
        room={activeModalRoom}
        onClose={() => setActiveModalRoom(null)}
        onOpenAuth={handleOpenAuth}
        onOpenChat={(convId) => handleNavigate('messages', { conversationId: convId })}
      />

      {/* Global Profile Picture System (Menu, Viewer, and Change Picker) */}
      <ProfilePictureModals />

      {/* Mandatory Nepal Mobile Number Modal */}
      <MandatoryPhoneModal />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight font-heading text-slate-900">
                RoomSewa Janakpur
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                जनकपुरधाम
              </span>
            </div>
            <p className="text-xs text-slate-500 text-center md:text-right">
              Direct room and flat rental platform for Janakpur, Nepal. Connecting seekers and verified room owners.
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>© {new Date().getFullYear()} RoomSewa Janakpur. All rights reserved.</span>
            <div className="flex items-center gap-4 font-medium">
              <span>Bhanu Chowk</span>
              <span>Shiva Chowk</span>
              <span>Ramanand Chowk</span>
              <span>Murali Chowk</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} solutionChannel="GMP_aistudio">
      <AuthProvider>
        <ContentProvider>
          <RoomProvider>
            <ChatProvider>
              <ProfilePictureProvider>
                <MainAppContent />
              </ProfilePictureProvider>
            </ChatProvider>
          </RoomProvider>
        </ContentProvider>
      </AuthProvider>
    </APIProvider>
  );
}
