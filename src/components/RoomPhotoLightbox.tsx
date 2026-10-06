import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Image as ImageIcon,
  Building
} from 'lucide-react';

interface RoomPhotoLightboxProps {
  isOpen: boolean;
  photos: string[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
  onIndexChange?: (newIndex: number) => void;
}

export const RoomPhotoLightbox: React.FC<RoomPhotoLightboxProps> = ({
  isOpen,
  photos,
  initialIndex = 0,
  title = 'Room Listing',
  onClose,
  onIndexChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Sync index when modal opens
  useEffect(() => {
    if (isOpen) {
      const validIndex = Math.max(0, Math.min(initialIndex, Math.max(0, photos.length - 1)));
      setCurrentIndex(validIndex);
      setIsZoomed(false);
      setImageLoaded(false);
      setImageError(false);
    }
  }, [isOpen]);

  const validPhotos = photos && photos.length > 0 ? photos : [];
  const currentPhotoUrl = validPhotos[currentIndex] || '';

  const goToIndex = useCallback(
    (nextIdx: number) => {
      setIsZoomed(false);
      setImageLoaded(false);
      setImageError(false);
      setCurrentIndex(nextIdx);
      if (onIndexChange) {
        onIndexChange(nextIdx);
      }
    },
    [onIndexChange]
  );

  const handlePrev = useCallback(() => {
    if (validPhotos.length <= 1) return;
    const nextIdx = currentIndex > 0 ? currentIndex - 1 : validPhotos.length - 1;
    goToIndex(nextIdx);
  }, [validPhotos.length, currentIndex, goToIndex]);

  const handleNext = useCallback(() => {
    if (validPhotos.length <= 1) return;
    const nextIdx = currentIndex < validPhotos.length - 1 ? currentIndex + 1 : 0;
    goToIndex(nextIdx);
  }, [validPhotos.length, currentIndex, goToIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Prevent background scrolling when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || validPhotos.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Room Photo Lightbox"
      className="fixed inset-0 z-[60] flex flex-col bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/80 to-transparent">
        {/* Title and Room Photo Badge */}
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-amber-500 text-stone-950">
                Room Photo
              </span>
              <span className="text-xs text-stone-400 font-medium hidden sm:inline">
                Photo {currentIndex + 1} of {validPhotos.length}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-md sm:max-w-xl">
              {title}
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom Toggle */}
          <button
            type="button"
            onClick={() => setIsZoomed((prev) => !prev)}
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            title={isZoomed ? 'Zoom out to fit' : 'Zoom in'}
            aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            {isZoomed ? <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" /> : <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Open full resolution image */}
          <a
            href={currentPhotoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            title="Open original room photo in new tab"
            aria-label="Open original image in new tab"
          >
            <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>

          {/* Close Lightbox */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-all shadow-lg ml-1"
            title="Close viewer (Esc)"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        onClick={(e) => {
          // Click backdrop to close
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Navigation Previous Button */}
        {validPhotos.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous room photo"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-stone-900/80 hover:bg-amber-600 text-white backdrop-blur-md flex items-center justify-center shadow-xl border border-white/10 hover:border-amber-400 transition-all hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}

        {/* Navigation Next Button */}
        {validPhotos.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next room photo"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-stone-900/80 hover:bg-amber-600 text-white backdrop-blur-md flex items-center justify-center shadow-xl border border-white/10 hover:border-amber-400 transition-all hover:scale-105 active:scale-95"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}

        {/* Image Container */}
        <div
          className={`relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200 ${
            isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={() => setIsZoomed((prev) => !prev)}
        >
          {/* Loading spinner */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Error fallback */}
          {imageError ? (
            <div className="flex flex-col items-center justify-center p-8 bg-stone-900/90 rounded-2xl border border-white/10 text-center max-w-sm">
              <ImageIcon className="w-12 h-12 text-stone-500 mb-3" />
              <p className="text-white font-bold text-sm">Room photo could not be loaded</p>
              <p className="text-stone-400 text-xs mt-1">
                The uploaded listing image may be unavailable or deleted.
              </p>
            </div>
          ) : (
            <img
              key={currentPhotoUrl}
              src={currentPhotoUrl}
              alt={`${title} - Room photo ${currentIndex + 1}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`max-w-[92vw] max-h-[75vh] sm:max-h-[80vh] w-auto h-auto object-contain rounded-xl sm:rounded-2xl shadow-2xl transition-opacity duration-200 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </div>
      </div>

      {/* Bottom Bar: Thumbnails & Counter */}
      <div className="relative z-20 px-4 py-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent flex flex-col items-center gap-2">
        {/* Photo Counter Pill */}
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-300 bg-stone-900/80 px-3.5 py-1 rounded-full border border-white/10">
          <span>Photo {currentIndex + 1} of {validPhotos.length}</span>
          <span className="text-stone-500">•</span>
          <span className="text-amber-400">Click photo to zoom</span>
        </div>

        {/* Thumbnail Carousel Strip */}
        {validPhotos.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 pt-1 scrollbar-thin px-2">
            {validPhotos.map((photo, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToIndex(idx)}
                className={`relative w-14 sm:w-18 h-10 sm:h-12 rounded-lg overflow-hidden shrink-0 transition-all border-2 ${
                  currentIndex === idx
                    ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105 opacity-100 shadow-md'
                    : 'border-white/20 opacity-60 hover:opacity-90 hover:border-white/40'
                }`}
                aria-label={`View room photo ${idx + 1}`}
              >
                <img
                  src={photo}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
