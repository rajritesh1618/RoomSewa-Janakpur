import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface PhotoViewerModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <a
          href={imageUrl}
          download="roomsewa-image.jpg"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Download or open original"
        >
          <ExternalLink className="w-5 h-5" />
        </a>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl">
        <img
          src={imageUrl}
          alt="Room attachment"
          className="w-full h-full object-contain max-h-[85vh] rounded-2xl shadow-2xl"
        />
      </div>
    </div>
  );
};
