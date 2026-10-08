import React, { useState } from 'react';
import { 
  Home, 
  Search, 
  MapPin, 
  PlusCircle, 
  Crown, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { JanakiMandirLogo, MithilaBorderStrip } from './common/MithilaMotifs';
import { PWAInstallButton } from './PWAInstallButton';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenAuth }) => {
  const { currentUser, userProfile, isOwner, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#fffdfa]/95 backdrop-blur-md border-b border-amber-200 shadow-xs safe-pt">
      <MithilaBorderStrip />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div 
            onClick={() => handleNav('home')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <JanakiMandirLogo size={40} className="transition-transform group-hover:scale-105" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mithila text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-800 via-rose-800 to-amber-900 bg-clip-text text-transparent">
                  RoomSewa
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  जनकपुर
                </span>
              </div>
              <p className="text-[10px] text-amber-900/60 font-medium -mt-1 hidden sm:block">
                Mithila's Room Finder
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => handleNav('listings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentView === 'listings' 
                  ? 'bg-amber-100 text-amber-900' 
                  : 'text-stone-700 hover:text-amber-800 hover:bg-amber-50'
              }`}
            >
              Find Rooms
            </button>
            <button
              onClick={() => handleNav('chowks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentView === 'chowks' 
                  ? 'bg-amber-100 text-amber-900' 
                  : 'text-stone-700 hover:text-amber-800 hover:bg-amber-50'
              }`}
            >
              Chowks
            </button>
            <button
              onClick={() => handleNav('premium')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentView === 'premium' 
                  ? 'bg-amber-100 text-amber-900' 
                  : 'text-stone-700 hover:text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>Premium</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => handleNav('admin')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  currentView === 'admin' 
                    ? 'bg-rose-100 text-rose-900 font-bold' 
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>

          {/* Right actions: PWA Install Button, List Room, Auth */}
          <div className="hidden md:flex items-center gap-3">
            <PWAInstallButton variant="navbar" />

            {currentUser ? (
              <>
                <button
                  onClick={() => handleNav('add-room')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>List Room</span>
                </button>

                <button
                  onClick={() => handleNav('dashboard')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-200 transition"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>{userProfile?.name || 'Dashboard'}</span>
                </button>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 text-stone-500 hover:text-rose-700 rounded-lg hover:bg-stone-100 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-700 to-rose-700 hover:from-amber-800 hover:to-rose-800 text-white text-xs font-semibold shadow-xs transition"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile hamburger & Install button */}
          <div className="flex md:hidden items-center gap-2">
            <PWAInstallButton variant="navbar" className="text-[11px] py-1 px-2.5" />
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 hover:bg-amber-50 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-amber-200 bg-[#fffdfa] px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleNav('home')}
              className={`text-left px-3 py-2 rounded-lg text-sm font-semibold ${
                currentView === 'home' ? 'bg-amber-100 text-amber-900' : 'text-stone-700'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNav('listings')}
              className={`text-left px-3 py-2 rounded-lg text-sm font-semibold ${
                currentView === 'listings' ? 'bg-amber-100 text-amber-900' : 'text-stone-700'
              }`}
            >
              Find Rooms
            </button>
            <button
              onClick={() => handleNav('chowks')}
              className={`text-left px-3 py-2 rounded-lg text-sm font-semibold ${
                currentView === 'chowks' ? 'bg-amber-100 text-amber-900' : 'text-stone-700'
              }`}
            >
              Explore Chowks
            </button>
            <button
              onClick={() => handleNav('premium')}
              className={`text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                currentView === 'premium' ? 'bg-amber-100 text-amber-900' : 'text-stone-700'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-600" />
              <span>Premium Listings</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => handleNav('admin')}
                className="text-left px-3 py-2 rounded-lg text-sm font-bold text-rose-700 bg-rose-50"
              >
                Admin Panel (Feature Builder)
              </button>
            )}

            {currentUser ? (
              <>
                <button
                  onClick={() => handleNav('add-room')}
                  className="text-left px-3 py-2 rounded-lg text-sm font-semibold text-emerald-800 bg-emerald-50 mt-2"
                >
                  + Post / List Room
                </button>
                <button
                  onClick={() => handleNav('dashboard')}
                  className="text-left px-3 py-2 rounded-lg text-sm font-semibold text-stone-700"
                >
                  Dashboard ({userProfile?.name})
                </button>
                <button
                  onClick={logout}
                  className="text-left px-3 py-2 rounded-lg text-sm font-semibold text-rose-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full mt-2 py-2.5 bg-amber-700 text-white rounded-xl text-sm font-bold text-center"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
