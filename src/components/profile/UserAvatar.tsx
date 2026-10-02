import React from 'react';
import { useProfilePicture } from '../../context/ProfilePictureContext';
import { useAuth } from '../../context/AuthContext';
import { Camera, Crown, ShieldCheck } from 'lucide-react';
import { UserRole } from '../../types';

interface UserAvatarProps {
  photoURL?: string | null;
  displayName?: string;
  userId?: string;
  email?: string;
  role?: UserRole;
  isPremium?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'rounded';
  showBadge?: boolean;
  showCameraHover?: boolean;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClasses: Record<string, { container: string; icon: string; badge: string }> = {
  xs: { container: 'w-6 h-6', icon: 'w-3 h-3', badge: 'w-2 h-2 -bottom-0.5 -right-0.5' },
  sm: { container: 'w-8 h-8', icon: 'w-3.5 h-3.5', badge: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5' },
  md: { container: 'w-10 h-10', icon: 'w-4 h-4', badge: 'w-3 h-3 -bottom-0.5 -right-0.5' },
  lg: { container: 'w-14 h-14', icon: 'w-5 h-5', badge: 'w-4 h-4 -bottom-1 -right-1' },
  xl: { container: 'w-20 h-20', icon: 'w-6 h-6', badge: 'w-5 h-5 -bottom-1 -right-1' },
  '2xl': { container: 'w-28 h-28', icon: 'w-8 h-8', badge: 'w-6 h-6 -bottom-1.5 -right-1.5' },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  photoURL,
  displayName,
  userId,
  email,
  role,
  isPremium,
  size = 'md',
  shape = 'rounded',
  showBadge = true,
  showCameraHover = true,
  interactive = true,
  className = '',
  onClick,
}) => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const { openMenu, openViewer } = useProfilePicture();

  const isSelf = Boolean(
    (!userId && currentUser) ||
    (userId && currentUser && userId === currentUser.uid)
  );

  const resolvedPhoto = isSelf
    ? userProfile?.photoURL || photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid || 'user'}`
    : photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || displayName || 'user'}`;

  const resolvedName = isSelf
    ? userProfile?.displayName || displayName || 'My Profile'
    : displayName || 'User';

  const resolvedRole = isSelf
    ? userProfile?.role || role
    : role;

  const resolvedIsPremium = isSelf
    ? userProfile?.isPremium || isPremium
    : isPremium;

  const currentSize = sizeClasses[size] || sizeClasses.md;
  const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
      return;
    }

    if (!interactive) return;

    e.stopPropagation();

    if (isSelf) {
      openMenu({
        uid: currentUser?.uid || userId || 'self',
        displayName: resolvedName,
        email: currentUser?.email || email,
        photoURL: resolvedPhoto,
        role: resolvedRole,
        isCurrentUser: true
      });
    } else {
      openViewer({
        uid: userId,
        displayName: resolvedName,
        email,
        photoURL: resolvedPhoto,
        role: resolvedRole,
        isCurrentUser: false
      });
    }
  };

  return (
    <div
      onClick={interactive ? handleClick : undefined}
      className={`relative inline-block select-none shrink-0 group ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
      title={
        interactive
          ? isSelf
            ? 'Click to see or change profile picture'
            : `Click to see ${resolvedName}'s photo`
          : resolvedName
      }
    >
      {/* Avatar Image */}
      <img
        src={resolvedPhoto}
        alt={resolvedName}
        className={`${currentSize.container} ${radiusClass} object-cover bg-slate-100 border border-slate-200/80 shadow-2xs transition-transform ${
          interactive ? 'group-hover:scale-[1.02]' : ''
        }`}
      />

      {/* Camera Hover Overlay for Current User */}
      {interactive && isSelf && showCameraHover && (
        <div
          className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 ${radiusClass} flex items-center justify-center transition-opacity text-white backdrop-blur-[1px]`}
        >
          <Camera className={currentSize.icon} />
        </div>
      )}

      {/* Role / Premium Badges */}
      {showBadge && (
        <>
          {isAdmin || resolvedRole === 'admin' ? (
            <div
              className={`absolute ${currentSize.badge} bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xs ring-2 ring-white`}
              title="Super Admin"
            >
              <ShieldCheck className="w-[70%] h-[70%]" />
            </div>
          ) : resolvedIsPremium ? (
            <div
              className={`absolute ${currentSize.badge} bg-amber-400 text-slate-950 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white`}
              title="Gold Member"
            >
              <Crown className="w-[70%] h-[70%] fill-slate-950" />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};
