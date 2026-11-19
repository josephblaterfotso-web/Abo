import React, { useState } from 'react';
import { AudioChannel } from '../types/recorder';
import { AudioPeakMeter } from './AudioPeakMeter';
import { Edit2, Check } from 'lucide-react';

interface ChannelStripProps {
  channel: AudioChannel;
  onToggleArm: (id: number) => void;
  onSetFader: (id: number, val: number) => void;
  onSetTrim: (id: number, val: number) => void;
  onSetPan: (id: number, pan: number) => void;
  onTogglePfl: (id: number) => void;
  onToggleSolo: (id: number) => void;
  onToggleMute: (id: number) => void;
  onRename: (id: number, name: string) => void;
  onClearClip: (id: number) => void;
}

export const ChannelStrip: React.FC<ChannelStripProps> = ({
  channel,
  onToggleArm,
  onSetFader,
  onSetTrim,
  onSetPan,
  onTogglePfl,
  onToggleSolo,
  onToggleMute,
  onRename,
  onClearClip,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(channel.name);

  const handleSaveName = () => {
    setIsEditingName(false);
    if (tempName.trim()) {
      onRename(channel.id, tempName.trim());
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-between p-2.5 rounded-lg border transition-all duration-150 select-none ${
        channel.armed
          ? 'bg-slate-900/90 dark:bg-slate-950 border-rose-900/60 shadow-xs'
          : 'bg-slate-900/50 dark:bg-slate-900/30 border-slate-800'
      } min-w-[120px] max-w-[140px] shrink-0`}
    >
      {/* Top Header: Channel Number & ARM button */}
      <div
        className={`w-full flex items-center justify-between gap-1 pb-1.5 border-b transition-colors ${
          channel.armed
            ? 'border-slate-800 bg-transparent'
            : 'african-inactive-panel-header -mx-2.5 -mt-2.5 px-2.5 pt-2 pb-1.5 rounded-t-lg border-b'
        }`}
      >
        <div className="flex items-center gap-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: channel.colorTag || '#3b82f6' }}
          />
          <span className="font-mono-broadcast text-xs font-bold text-slate-300">
            CH {channel.number}
          </span>
        </div>

        {/* Dedicated ARM Toggle Button */}
        <button
          type="button"
          onClick={() => onToggleArm(channel.id)}
          className={`px-2 py-0.5 rounded-sm text-[10px] font-mono-broadcast font-bold tracking-wider transition-all cursor-pointer ${
            channel.armed
              ? 'bg-rose-600 text-white shadow-[0_0_8px_rgba(225,29,72,0.8)]'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title={channel.armed ? 'Track Armed (Recording)' : 'Click to Arm Track'}
        >
          ARM
        </button>
      </div>

      {/* Track Name / Actor Tag */}
      <div className="w-full py-1 text-center border-b border-slate-800/80">
        {isEditingName ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="w-full px-1 py-0.5 text-[10px] bg-slate-950 text-white rounded border border-blue-500 font-mono-broadcast focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveName}
              className="p-0.5 text-emerald-400 hover:text-emerald-300"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setTempName(channel.name);
              setIsEditingName(true);
            }}
            className="w-full group flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-200 truncate hover:text-blue-400 transition-colors cursor-pointer"
            title="Click to rename track / actor"
          >
            <span className="truncate">{channel.name}</span>
            <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 shrink-0" />
          </button>
        )}
        <span className="text-[9px] font-mono-broadcast text-slate-500 block truncate">
          {channel.sourceInput}
        </span>
      </div>

      {/* Middle Core: Vertical Meter & Vertical Fader */}
      <div className="w-full flex items-center justify-center gap-3 py-2">
        {/* Peak & RMS Meter */}
        <AudioPeakMeter
          peakDbFs={channel.peakDbFs}
          rmsDbFs={channel.rmsDbFs}
          clip={channel.clip}
          limiterActive={channel.limiterActive}
          is32BitFloat={channel.is32BitFloat}
          onClearClip={() => onClearClip(channel.id)}
          heightClass="h-44"
          showScale={channel.number === 1}
        />

        {/* Fader Throw Slider */}
        <div className="flex flex-col items-center h-44 justify-between">
          <span className="text-[9px] font-mono-broadcast text-slate-400">
            {channel.faderGainDb > 0 ? `+${channel.faderGainDb}` : channel.faderGainDb <= -59 ? '-∞' : `${channel.faderGainDb}`}
          </span>

          {/* Fader Track */}
          <div className="relative h-32 flex items-center justify-center">
            {/* Unity (0 dB) Line Indicator */}
            <div className="absolute right-full mr-1 top-[20%] text-[8px] font-mono-broadcast text-amber-400">
              0-
            </div>
            <input
              type="range"
              min="-60"
              max="12"
              step="0.5"
              value={channel.faderGainDb}
              onChange={(e) => onSetFader(channel.id, parseFloat(e.target.value))}
              className="vertical-fader fader-slider h-32 w-5 cursor-pointer accent-blue-500"
              title={`Fader Gain: ${channel.faderGainDb} dB`}
            />
          </div>

          <button
            type="button"
            onClick={() => onSetFader(channel.id, 0)}
            className="text-[8px] font-mono-broadcast text-slate-400 hover:text-white px-1 rounded bg-slate-800"
            title="Reset to 0 dB Unity"
          >
            0 dB
          </button>
        </div>
      </div>

      {/* Pan & Trim Controls */}
      <div className="w-full flex flex-col gap-1.5 py-1.5 border-t border-slate-800">
        {/* Trim / Preamp Gain */}
        <div className="flex items-center justify-between text-[10px] font-mono-broadcast px-1">
          <span className="text-slate-400">TRIM</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSetTrim(channel.id, Math.max(0, channel.trimGainDb - 2))}
              className="w-4 h-4 bg-slate-800 text-slate-300 rounded flex items-center justify-center hover:bg-slate-700 text-[10px]"
            >
              -
            </button>
            <span className="text-blue-400 font-bold min-w-[28px] text-center">
              {channel.trimGainDb}dB
            </span>
            <button
              type="button"
              onClick={() => onSetTrim(channel.id, Math.min(76, channel.trimGainDb + 2))}
              className="w-4 h-4 bg-slate-800 text-slate-300 rounded flex items-center justify-center hover:bg-slate-700 text-[10px]"
            >
              +
            </button>
          </div>
        </div>

        {/* Pan Control */}
        <div className="flex items-center justify-between text-[10px] font-mono-broadcast px-1">
          <span className="text-slate-400">PAN</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSetPan(channel.id, -100)}
              className={`px-1 py-0.5 rounded text-[8px] ${
                channel.pan === -100 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              L
            </button>
            <button
              type="button"
              onClick={() => onSetPan(channel.id, 0)}
              className={`px-1 py-0.5 rounded text-[8px] ${
                channel.pan === 0 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              C
            </button>
            <button
              type="button"
              onClick={() => onSetPan(channel.id, 100)}
              className={`px-1 py-0.5 rounded text-[8px] ${
                channel.pan === 100 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              R
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Monitoring Switches: PFL / Solo / Mute */}
      <div className="w-full grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-800">
        <button
          type="button"
          onClick={() => onTogglePfl(channel.id)}
          className={`py-1 rounded text-[9px] font-mono-broadcast font-bold transition-colors cursor-pointer ${
            channel.pfl
              ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_6px_rgba(245,158,11,0.8)]'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Pre-Fade Listen (Headphone PFL)"
        >
          PFL
        </button>

        <button
          type="button"
          onClick={() => onToggleSolo(channel.id)}
          className={`py-1 rounded text-[9px] font-mono-broadcast font-bold transition-colors cursor-pointer ${
            channel.solo
              ? 'bg-yellow-400 text-slate-950 font-black'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Solo Track"
        >
          SOLO
        </button>

        <button
          type="button"
          onClick={() => onToggleMute(channel.id)}
          className={`py-1 rounded text-[9px] font-mono-broadcast font-bold transition-colors cursor-pointer ${
            channel.mute
              ? 'bg-rose-700 text-white font-black'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Mute Track"
        >
          MUTE
        </button>
      </div>
    </div>
  );
};
