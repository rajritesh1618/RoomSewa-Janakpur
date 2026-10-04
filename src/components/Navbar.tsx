import React, { useState } from 'react';
import {
  Building2,
  Search,
  PlusCircle,
  ShieldCheck,
  Crown,
  User,
  LogOut,
  Menu,
  X,
  Heart,
  LayoutDashboard,
  Sparkles,
  MapPin,
  MessageSquare,
  Eye,
  Camera,
  ChevronDown
} from 'lucide-react';
import { JanakiMandirLogo, MithilaBorderStrip } from './common/MithilaMotifs';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useProfilePicture } from '../context/ProfilePictureContext';
import { useContent } from '../context/ContentContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, extraData?: any) => void;
  onOpenAuth: (defaultMode?: 'login' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenAuth }) => {
  const { currentUser, userProfile, logout, isAdmin, isPremium, isOwner } = useAuth();
  const { totalUnreadCount } = useChat();
  const { openMenu, openViewer, triggerFilePicker } = useProfilePicture();
  const { isNavVisible, isFeatureVisible, premiumConfig, appContent } = useContent();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const hasUsedFreeListing = Boolean(
    userProfile?.hasUsedFreeListing ||
    (userProfile?.lifetimeListingCount && userProfile.lifetimeListingCount >= 1)
  );
  // Only flag free quota as used if Premium restrictions are active (ON)
  const isFreeUsed = Boolean(premiumConfig.enabled) && !isPremium && !isAdmin && hasUsedFreeListing;

  const handleNav = (view: string, extra?: any) => {
    onNavigate(view, extra);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#fffdfa]/95 backdrop-blur border-b border-amber-200/90 shadow-xs">
      {/* Decorative Traditional Mithila Aripan Strip on Top */}
      <MithilaBorderStrip variant="saffron" className="opacity-80" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo & Tag */}
          <div
            id="brand-logo-btn"
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <JanakiMandirLogo size={46} className="group-hover:scale-105 transition-transform drop-shadow-xs" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 font-heading">
                  RoomSewa
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white shadow-xs">
                  Janakpur
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80 font-bold hidden sm:flex items-center gap-1.5 mt-0.5">
                <span>जनकपुरधाम</span>
                <span className="text-amber-500">•</span>
                <span className="text-stone-600 font-medium">Mithila Rentals</span>
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {isNavVisible('home') && (
              <button
                id="nav-home-btn"
                onClick={() => handleNav('home')}
                className={`px-3.5 py-2 text-sm font-bold rounded-xl transition-all ${
                  currentView === 'home'
                    ? 'bg-amber-100/80 text-amber-950 border border-amber-300/80 shadow-xs'
                    : 'text-stone-700 hover:text-amber-950 hover:bg-amber-50/70'
                }`}
              >
                Home
              </button>
            )}
            {isNavVisible('listings') && isFeatureVisible('search') && (
              <button
                id="nav-listings-btn"
                onClick={() => handleNav('listings')}
                className={`px-3.5 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  currentView === 'listings'
                    ? 'bg-amber-100/80 text-amber-950 border border-amber-300/80 shadow-xs'
                    : 'text-stone-700 hover:text-amber-950 hover:bg-amber-50/70'
                }`}
              >
                <Search className="w-4 h-4 text-amber-600" />
                Find Rooms
              </button>
            )}
            {isNavVisible('chowks') && isFeatureVisible('chowks') && (
              <button
                id="nav-chowks-btn"
                onClick={() => handleNav('chowks')}
                className={`px-3.5 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  currentView === 'chowks'
                    ? 'bg-amber-100/80 text-amber-950 border border-amber-300/80 shadow-xs'
                    : 'text-stone-700 hover:text-amber-950 hover:bg-amber-50/70'
                }`}
              >
                <MapPin className="w-4 h-4 text-rose-600" />
                Chowks
              </button>
            )}
            {isOwner && isNavVisible('premium') && isFeatureVisible('premium') && premiumConfig.enabled && (
              <button
                id="nav-premium-btn"
                onClick={() => handleNav('premium')}
                className={`px-3.5 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  currentView === 'premium'
                    ? 'bg-amber-200/80 text-amber-950 border border-amber-400/80 shadow-xs'
                    : 'text-amber-900 hover:text-amber-950 hover:bg-amber-100/60'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-600 fill-amber-500" />
                Premium (Rs {premiumConfig.priceNPR || 200})
              </button>
            )}
            {isNavVisible('messages') && isFeatureVisible('chat') && (
              <button
                id="nav-messages-btn"
                onClick={() => handleNav('messages')}
                className={`px-3.5 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 relative ${
                  currentView === 'messages'
                    ? 'bg-amber-100/80 text-amber-950 border border-amber-300/80 shadow-xs'
                    : 'text-stone-700 hover:text-amber-950 hover:bg-amber-50/70'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-orange-600" />
                <span>Messages</span>
                {totalUnreadCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-rose-600 text-white animate-pulse">
                    {totalUnreadCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Right actions: List Room, Auth & Profile */}
          <div className="hidden md:flex items-center gap-3">
            {isNavVisible('add-room') && isFeatureVisible('room_listing') && (
              <button
                id="nav-add-room-btn"
                onClick={() => {
                  if (!currentUser) {
                    onOpenAuth('login');
                  } else {
                    handleNav('add-room');
                  }
                }}
                className="inline-flex items-center gap-2 px-4.5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 rounded-xl shadow-md shadow-orange-600/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-200" />
                {isFreeUsed ? 'List Room' : 'List Room Free'}
              </button>
            )}

            {currentUser ? (
              <div className="relative">
                <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white">
                  {/* Clickable Profile Picture for Menu */}
                  <button
                    id="navbar-profile-pic-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openMenu();
                    }}
                    className="relative group rounded-xl overflow-hidden p-0.5"
                    title="Click to see or change profile picture"
                    aria-label="Profile picture menu"
                  >
                    <img
                      src={userProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`}
                      alt="User"
                      className="w-8 h-8 rounded-lg object-cover bg-slate-100 group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg text-white">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  <button
                    id="user-profile-menu-btn"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 px-1 py-1 text-left rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="hidden lg:block">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        {userProfile?.displayName || 'My Account'}
                        {isPremium && (
                          <span title="Premium Verified">
                            <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {isAdmin ? 'Admin' : userProfile?.role || 'Seeker'}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {/* User Profile Card with Photo Actions */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          openMenu();
                        }}
                        className="relative group shrink-0"
                        title="Click to see or change profile picture"
                      >
                        <img
                          src={userProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`}
                          alt="Avatar"
                          className="w-12 h-12 rounded-2xl object-cover bg-white border-2 border-white shadow-xs group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center text-white transition-opacity">
                          <Camera className="w-4 h-4" />
                        </div>
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {userProfile?.displayName || 'User'}
                          </p>
                          {isPremium && (
                            <Crown className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              openViewer();
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                          >
                            <Eye className="w-3 h-3" /> See Photo
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              triggerFilePicker();
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                          >
                            <Camera className="w-3 h-3" /> Change
                          </button>
                        </div>
                      </div>
                    </div>

                    {isNavVisible('profile') && isFeatureVisible('profile') && (
                      <button
                        id="dropdown-dashboard-btn"
                        onClick={() => handleNav('dashboard')}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        My Dashboard
                      </button>
                    )}

                    {isNavVisible('messages') && isFeatureVisible('chat') && (
                      <button
                        id="dropdown-messages-btn"
                        onClick={() => handleNav('messages')}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-indigo-600" />
                          <span>Messages</span>
                        </div>
                        {totalUnreadCount > 0 && (
                          <span className="px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-rose-500 text-white animate-pulse">
                            {totalUnreadCount}
                          </span>
                        )}
                      </button>
                    )}

                    {isNavVisible('favorites') && isFeatureVisible('favorites') && (
                      <button
                        id="dropdown-saved-btn"
                        onClick={() => handleNav('dashboard', { tab: 'saved' })}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <Heart className="w-4 h-4 text-rose-500" />
                        Saved Rooms
                      </button>
                    )}

                    {isNavVisible('profile') && isFeatureVisible('profile') && (
                      <button
                        id="dropdown-profile-btn"
                        onClick={() => handleNav('profile')}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        Profile Settings
                      </button>
                    )}

                    {isOwner && isNavVisible('premium') && isFeatureVisible('premium') && premiumConfig.enabled && (
                      <button
                        id="dropdown-premium-btn"
                        onClick={() => handleNav('premium')}
                        className="w-full text-left px-4 py-2.5 text-sm text-amber-900 bg-amber-50/70 hover:bg-amber-100 flex items-center gap-2 font-bold"
                      >
                        <Crown className="w-4 h-4 text-amber-600 fill-amber-500" />
                        Premium Dashboard
                      </button>
                    )}

                    {/* Admin Panel button is NEVER hidden by feature toggles */}
                    {isAdmin && (
                      <button
                        id="dropdown-admin-btn"
                        onClick={() => handleNav('admin')}
                        className="w-full text-left px-4 py-2.5 text-sm text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 flex items-center gap-2 font-bold"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        Admin Panel
                      </button>
                    )}

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      id="dropdown-logout-btn"
                      onClick={async () => {
                        await logout();
                        setUserDropdownOpen(false);
                        handleNav('home');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 text-sm font-bold text-amber-950 hover:bg-amber-100/60 rounded-xl transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  id="nav-signup-btn"
                  onClick={() => onOpenAuth('signup')}
                  className="px-4.5 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            {currentUser && (
              <button
                id="mobile-profile-pic-btn"
                onClick={() => openMenu()}
                className="p-1 rounded-xl border border-amber-200 relative group overflow-hidden bg-white"
                title="Click to see or change profile picture"
                aria-label="Profile picture menu"
              >
                <img
                  src={userProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`}
                  alt="avatar"
                  className="w-8 h-8 rounded-lg object-cover"
                />
              </button>
            )}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-amber-950 hover:bg-amber-100/60 rounded-xl cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-amber-200/90 bg-[#fffdfa] px-4 pt-3 pb-6 space-y-3">
          {currentUser && (
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openMenu();
                  }}
                  className="relative group shrink-0"
                  title="See or change profile picture"
                >
                  <img
                    src={userProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`}
                    alt="avatar"
                    className="w-10 h-10 rounded-xl object-cover border border-amber-200 shadow-2xs"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-white transition-opacity">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900 truncate">
                    {userProfile?.displayName || 'User'}
                  </p>
                  <p className="text-[10px] text-stone-500 truncate">{currentUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openViewer();
                  }}
                  className="px-2 py-1 text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3" /> See
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    triggerFilePicker();
                  }}
                  className="px-2 py-1 text-[11px] font-bold text-stone-700 bg-white border border-amber-200 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3 h-3" /> Change
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {isNavVisible('home') && (
              <button
                onClick={() => handleNav('home')}
                className="flex-1 min-w-[120px] px-3 py-2.5 text-sm font-bold rounded-xl bg-amber-50/70 border border-amber-200/60 text-stone-800 text-center cursor-pointer"
              >
                Home
              </button>
            )}
            {isNavVisible('listings') && isFeatureVisible('search') && (
              <button
                onClick={() => handleNav('listings')}
                className="flex-1 min-w-[120px] px-3 py-2.5 text-sm font-bold rounded-xl bg-amber-50/70 border border-amber-200/60 text-stone-800 text-center cursor-pointer"
              >
                Browse Rooms
              </button>
            )}
            {isNavVisible('chowks') && isFeatureVisible('chowks') && (
              <button
                onClick={() => handleNav('chowks')}
                className="flex-1 min-w-[120px] px-3 py-2.5 text-sm font-bold rounded-xl bg-amber-50/70 border border-amber-200/60 text-stone-800 text-center cursor-pointer"
              >
                Janakpur Chowks
              </button>
            )}
            {isOwner && isNavVisible('premium') && isFeatureVisible('premium') && premiumConfig.enabled && (
              <button
                id="mobile-nav-premium-btn"
                onClick={() => handleNav('premium')}
                className="flex-1 min-w-[120px] px-3 py-2.5 text-sm font-bold rounded-xl bg-amber-200/80 border border-amber-300 text-amber-950 text-center flex items-center justify-center gap-1 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                Premium (Rs {premiumConfig.priceNPR || 200})
              </button>
            )}
          </div>

          {isNavVisible('add-room') && isFeatureVisible('room_listing') && (
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth('login');
                else handleNav('add-room');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-slate-900 rounded-xl"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              {isFreeUsed ? 'List Room (Owners)' : 'Add Room (Free / Owners)'}
            </button>
          )}

          {currentUser ? (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              {isNavVisible('profile') && isFeatureVisible('profile') && (
                <button
                  onClick={() => handleNav('dashboard')}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  User Dashboard
                </button>
              )}
              {isNavVisible('messages') && isFeatureVisible('chat') && (
                <button
                  onClick={() => handleNav('messages')}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <span>Messages</span>
                  </div>
                  {totalUnreadCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-rose-500 text-white">
                      {totalUnreadCount}
                    </span>
                  )}
                </button>
              )}
              {isNavVisible('favorites') && isFeatureVisible('favorites') && (
                <button
                  onClick={() => handleNav('dashboard', { tab: 'saved' })}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                >
                  <Heart className="w-4 h-4 text-rose-500" />
                  Saved Rooms
                </button>
              )}
              {isNavVisible('profile') && isFeatureVisible('profile') && (
                <button
                  onClick={() => handleNav('profile')}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Edit Profile
                </button>
              )}
              {isOwner && isNavVisible('premium') && isFeatureVisible('premium') && premiumConfig.enabled && (
                <button
                  id="mobile-drawer-premium-btn"
                  onClick={() => handleNav('premium')}
                  className="w-full text-left px-3 py-2 text-sm font-bold text-amber-900 bg-amber-50/70 hover:bg-amber-100 rounded-lg flex items-center gap-2"
                >
                  <Crown className="w-4 h-4 text-amber-600 fill-amber-500" />
                  Premium Dashboard
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => handleNav('admin')}
                  className="w-full text-left px-3 py-2 text-sm font-bold text-indigo-700 bg-indigo-50 rounded-lg flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Admin Panel
                </button>
              )}
              <button
                onClick={async () => {
                  await logout();
                  setMobileMenuOpen(false);
                  handleNav('home');
                }}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('login');
                }}
                className="flex-1 py-2.5 text-center text-sm font-bold text-slate-700 bg-slate-100 rounded-xl"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signup');
                }}
                className="flex-1 py-2.5 text-center text-sm font-bold text-white bg-indigo-600 rounded-xl"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
