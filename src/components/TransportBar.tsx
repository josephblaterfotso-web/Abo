import React, { useState } from 'react';
import { TransportState } from '../types/recorder';
import {
  Play,
  Square,
  Pause,
  Circle,
  RotateCcw,
  Star,
  Tag,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react';

interface TransportBarProps {
  transport: TransportState;
  durationSeconds: number;
  currentTake: number;
  currentScene: string;
  isLastTakeCircled: boolean;
  onRecord: () => void;
  onStop: () => void;
  onPlay: () => void;
  onPause: () => void;
  onFalseTake: () => void;
  onToggleCircle: () => void;
  onAddQuickTag: (tag: string) => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  transport,
  durationSeconds,
  currentTake,
  currentScene,
  isLastTakeCircled,
  onRecord,
  onStop,
  onPlay,
  onPause,
  onFalseTake,
  onToggleCircle,
  onAddQuickTag,
}) => {
  const [showFalseTakeModal, setShowFalseTakeModal] = useState(false);
  const [showQuickTags, setShowQuickTags] = useState(false);
  const [isRecLockEnabled, setIsRecLockEnabled] = useState(false);

  const quickTags = [
    'Room Tone',
    'Wildtrack',
    'Overlap',
    'Aborted',
    'Boom in shot',
    'Planes / Traffic',
    'Good take ⭐',
    'Director liked it',
    'Hold for siren',
  ];

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isRecording = transport === 'RECORDING';

  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800 p-2 sm:px-4 select-none relative z-30">
      <div className="flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Left Section: Active Take Kicker & Quick Tags */}
        <div className="flex items-center gap-2">
          {/* Active Scene / Take preview */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono-broadcast text-slate-400 uppercase">
                Scene / Take
              </span>
              <span className="font-mono-broadcast text-xs font-bold text-white">
                S{currentScene} / T{currentTake}
              </span>
            </div>
            {isRecording && (
              <span className="font-mono-broadcast text-xs font-black text-rose-500 animate-pulse ml-1">
                REC {formatDuration(durationSeconds)}
              </span>
            )}
          </div>

          {/* Quick Tag Button & Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowQuickTags(!showQuickTags)}
              className="px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-mono-broadcast flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Add Quick Marker / Sound Tag to current take"
            >
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">TAGS</span>
            </button>

            {showQuickTags && (
              <div className="absolute left-0 bottom-full mb-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
                <div className="text-[10px] font-mono-broadcast text-slate-400 mb-1.5 px-1 font-semibold uppercase">
                  Quick Sound Tags
                </div>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {quickTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        onAddQuickTag(t);
                        setShowQuickTags(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs font-mono-broadcast text-slate-200 hover:bg-blue-600 hover:text-white rounded transition-colors cursor-pointer"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Circle Take ⭐ Toggle */}
          <button
            type="button"
            onClick={onToggleCircle}
            className={`px-2.5 py-2 rounded-lg border text-xs font-mono-broadcast flex items-center gap-1.5 cursor-pointer transition-all ${
              isLastTakeCircled
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Circle / Print Take (Mark as keeper for Post-Production)"
          >
            <Star className={`w-3.5 h-3.5 ${isLastTakeCircled ? 'fill-current' : ''}`} />
            <span className="hidden md:inline">CIRCLE TAKE</span>
          </button>
        </div>

        {/* Center: Universal Transport Core Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* STOP Button */}
          <button
            type="button"
            onClick={onStop}
            className={`px-4 sm:px-5 py-2.5 rounded-xl border font-mono-broadcast font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              transport === 'STOPPED'
                ? 'bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
            title="Stop Transport"
          >
            <Square className="w-4 h-4 fill-current text-slate-300" />
            <span className="hidden sm:inline">STOP</span>
          </button>

          {/* PLAY / PAUSE Button */}
          {transport === 'PLAYING' ? (
            <button
              type="button"
              onClick={onPause}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 font-mono-broadcast font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Pause Playback"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline">PAUSE</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onPlay}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-mono-broadcast font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Play Selected Take"
            >
              <Play className="w-4 h-4 fill-current text-emerald-400" />
              <span className="hidden sm:inline">PLAY</span>
            </button>
          )}

          {/* RECORD Button with safety shield toggle */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsRecLockEnabled(!isRecLockEnabled)}
              className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                isRecLockEnabled
                  ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title={isRecLockEnabled ? 'REC Lock Enabled (Prevents accidental tap)' : 'REC Lock Disabled'}
            >
              {isRecLockEnabled ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isRecLockEnabled) {
                  onRecord();
                } else {
                  // Require double click or unlock
                  alert('REC Safety Lock is active! Tap the lock icon to unlock.');
                }
              }}
              className={`px-5 sm:px-6 py-2.5 rounded-xl border font-mono-broadcast font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-[0_0_16px_rgba(225,29,72,0.8)] animate-pulse'
                  : 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border-rose-800/80'
              }`}
              title="Universal REC (Sound Devices / Zoom / Aaton / Zaxcom)"
            >
              <Circle className={`w-4 h-4 fill-current ${isRecording ? 'text-white' : 'text-rose-500'}`} />
              <span>RECORD</span>
            </button>
          </div>
        </div>

        {/* Right: Dedicated 1-Click FALSE TAKE Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFalseTakeModal(true)}
            className="px-3 py-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/80 text-amber-400 font-mono-broadcast font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Mark previous take as FALSE TAKE and decrement take counter"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>FALSE TAKE</span>
          </button>
        </div>
      </div>

      {/* Safety Confirmation Modal for FALSE TAKE */}
      {showFalseTakeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 mb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-mono-broadcast font-bold text-sm">CONFIRM FALSE TAKE</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              This action will mark the previous take as <strong>[FALSE TAKE]</strong> in the iXML
              Sound Report and rollback Take <strong>{currentTake}</strong> to <strong>{Math.max(1, currentTake - 1)}</strong>.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFalseTakeModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono-broadcast text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onFalseTake();
                  setShowFalseTakeModal(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-mono-broadcast font-bold text-white cursor-pointer shadow-md"
              >
                Confirm False Take
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
