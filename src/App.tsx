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
import { JanakiMandirLogo, MithilaBorderStrip, MithilaLotusIcon } from './components/common/MithilaMotifs';
import { RoomListing } from './types';
import { APIProvider } from '@vis.gl/react-google-maps';
import { applyActionCode, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from './lib/firebase';
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

  // Handle URL actions: Firebase Auth email verification & password reset action codes
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    const action = searchParams.get('action');
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    const emailVerified = searchParams.get('emailVerified');

    // 1. Firebase Auth Action Code: verifyEmail
    if ((mode === 'verifyEmail' || action === 'verify-email') && oobCode) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      applyActionCode(auth, oobCode)
        .then(async () => {
          if (auth.currentUser) {
            await auth.currentUser.reload();
          }
          if (emailParam) setAuthEmail(emailParam);
          setAuthModalMode('login');
          setAuthSuccessMessage('🎉 Your email has been successfully verified! You can now log in using your Gmail and password.');
          setAuthModalOpen(true);
        })
        .catch((err: any) => {
          console.error('Error applying action code:', err);
          setAuthModalMode('login');
          if (err?.code === 'auth/invalid-action-code') {
            setAuthSuccessMessage('Notice: This verification link has expired or has already been used. If your account is verified, you can sign in directly.');
          } else {
            setAuthSuccessMessage('Notice: ' + (err?.message || 'Verification link could not be verified. Please request a new verification email.'));
          }
          setAuthModalOpen(true);
        });
    }
    // 2. Firebase Auth Action Code: resetPassword
    else if ((mode === 'resetPassword' || action === 'reset-password') && oobCode) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
          setAuthEmail(email);
          setAuthResetToken(oobCode);
          setAuthModalMode('reset-password');
          setAuthSuccessMessage('Please set a new password for your account.');
          setAuthModalOpen(true);
        })
        .catch((err: any) => {
          console.error('Error verifying reset code:', err);
          setAuthModalMode('forgot-password');
          setAuthSuccessMessage('Notice: This password reset link has expired or is invalid. Please request a new link.');
          setAuthModalOpen(true);
        });
    }
    // 3. Simple emailVerified redirect confirmation
    else if (emailVerified === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      setAuthModalMode('login');
      setAuthSuccessMessage('🎉 Your email has been verified! You can now log in using your Gmail and password.');
      setAuthModalOpen(true);
    }
    // 4. Legacy custom verification link compatibility
    else if (action === 'verify-email' && token && emailParam) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      verifyEmailRoomSewa(token, emailParam)
        .then((res) => {
          setAuthEmail(emailParam);
          setAuthModalMode('login');
          setAuthSuccessMessage(
            res.message || '🎉 Your RoomSewa account has been verified! You can now log in using your Gmail and password.'
          );
          setAuthModalOpen(true);
        })
        .catch((err) => {
          setAuthEmail(emailParam);
          setAuthModalMode('login');
          setAuthSuccessMessage(err.message || 'Verification could not be completed.');
          setAuthModalOpen(true);
        });
    } else if (action === 'reset-password' && token && emailParam) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      setAuthEmail(emailParam);
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

      {/* Footer - Mithila Heritage & Janaki Mandir Theme */}
      <footer className="bg-gradient-to-b from-[#22120a] via-[#180c07] to-[#0e0704] text-[#fbf9f5] border-t border-amber-600/30 mt-20 relative overflow-hidden">
        {/* Decorative Aripan Frieze Border */}
        <MithilaBorderStrip variant="cream" className="opacity-60" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Col 1: Brand & Mithila Tribute */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <JanakiMandirLogo size={48} className="drop-shadow-md" />
                <div>
                  <h3 className="font-heading font-black text-xl text-white tracking-tight">
                    RoomSewa
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      जनकपुरधाम
                    </span>
                    <span className="text-[11px] text-amber-200/70 font-medium">Mithila Rentals</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-amber-100/70 leading-relaxed">
                Janakpurdham's dedicated direct room & flat rental network. Connecting students, professionals, and families with verified local room owners.
              </p>
            </div>

            {/* Col 2: Janakpur Landmarks */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                <MithilaLotusIcon size={14} color="#f59e0b" />
                Sacred Landmarks
              </h4>
              <ul className="space-y-2 text-xs text-amber-100/70">
                <li className="hover:text-amber-300 transition-colors">Janaki Mandir (नौ लखा मन्दिर)</li>
                <li className="hover:text-amber-300 transition-colors">Dhanush Sagar & Ganga Sagar</li>
                <li className="hover:text-amber-300 transition-colors">Ram Mandir & Vivah Mandap</li>
                <li className="hover:text-amber-300 transition-colors">Sankat Mochan Temple</li>
                <li className="hover:text-amber-300 transition-colors">Mithila Art & Craft Center</li>
              </ul>
            </div>

            {/* Col 3: Popular Rental Chowks */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                Popular Chowks
              </h4>
              <ul className="space-y-2 text-xs text-amber-100/70">
                <li>Bhanu Chowk & Station Road</li>
                <li>Shiva Chowk & Ramanand Chowk</li>
                <li>Murali Chowk & Hospital Road</li>
                <li>Pidari Chowk & Zero Mile</li>
                <li>Mills Area & Janakpur Campus</li>
              </ul>
            </div>

            {/* Col 4: Trust & Guarantees */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                RoomSewa Trust
              </h4>
              <ul className="space-y-2 text-xs text-amber-100/70">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  100% Direct Owners (Zero Commission)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Verified Nepal Mobile (+977)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Verified Gold Badges
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Built specifically for Janakpurdham
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-amber-900/40 flex flex-col sm:flex-row items-center justify-between text-[11px] text-amber-200/50 gap-3">
            <span>© {new Date().getFullYear()} RoomSewa Janakpur. All rights reserved.</span>
            <div className="flex items-center gap-3 font-medium">
              <span>जनकपुरधाम, धनुषा, नेपाल</span>
              <span>•</span>
              <span className="text-amber-300">जय जानकी माता</span>
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
