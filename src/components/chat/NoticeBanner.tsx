import React, { useState } from 'react';
import { Bell, X, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const NoticeBanner: React.FC = () => {
  const { notices } = useChat();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const activeNotice = notices.find((n) => !dismissedIds.includes(n.id) && (n.active !== false));

  if (!activeNotice) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  return (
    <aside
      aria-label="Official announcement"
      className={`border-b transition-all duration-200 ${
        activeNotice.isUrgent
          ? 'bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-rose-200 text-rose-950'
          : 'bg-indigo-50/90 border-indigo-100 text-indigo-950'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span
              className={`p-1.5 rounded-lg shrink-0 ${
                activeNotice.isUrgent ? 'bg-rose-500 text-white shadow-xs' : 'bg-indigo-600 text-white'
              }`}
            >
              {activeNotice.isUrgent ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white/70 border border-current/10">
                  Notice
                </span>
                <span className="text-xs font-bold truncate">{activeNotice.title}</span>
              </div>
              {isExpanded ? (
                <p className="text-xs mt-1 leading-relaxed opacity-90 whitespace-pre-line">
                  {activeNotice.content}
                </p>
              ) : (
                <p className="text-xs mt-0.5 truncate opacity-85 hidden sm:block">
                  {activeNotice.content}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-md hover:bg-black/5 text-current text-xs font-medium inline-flex items-center gap-1 px-1.5"
            >
              <span className="hidden md:inline">{isExpanded ? 'Show less' : 'Read more'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => handleDismiss(activeNotice.id)}
              className="p-1 rounded-md hover:bg-black/5 text-current"
              title="Dismiss announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
