import React, { useState } from 'react';
import { AudioChannel, MasterBus } from '../types/recorder';
import { ChannelStrip } from './ChannelStrip';
import { AudioPeakMeter } from './AudioPeakMeter';
import { Sliders, Volume2, Filter } from 'lucide-react';

interface VirtualMixingSurfaceProps {
  channels: AudioChannel[];
  masterBus: MasterBus;
  onToggleArm: (id: number) => void;
  onSetFader: (id: number, val: number) => void;
  onSetTrim: (id: number, val: number) => void;
  onSetPan: (id: number, pan: number) => void;
  onTogglePfl: (id: number) => void;
  onToggleSolo: (id: number) => void;
  onToggleMute: (id: number) => void;
  onRename: (id: number, name: string) => void;
  onClearClip: (id: number) => void;
  onClearMasterClip: () => void;
}

export const VirtualMixingSurface: React.FC<VirtualMixingSurfaceProps> = ({
  channels,
  masterBus,
  onToggleArm,
  onSetFader,
  onSetTrim,
  onSetPan,
  onTogglePfl,
  onToggleSolo,
  onToggleMute,
  onRename,
  onClearClip,
  onClearMasterClip,
}) => {
  const [bankFilter, setBankFilter] = useState<'ALL' | 'ARMED' | 'BANK_1_8' | 'BANK_9_16'>('ALL');

  const filteredChannels = channels.filter((ch) => {
    if (bankFilter === 'ARMED') return ch.armed;
    if (bankFilter === 'BANK_1_8') return ch.number <= 8;
    if (bankFilter === 'BANK_9_16') return ch.number > 8;
    return true;
  });

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Surface Header & Filter Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span className="font-mono-broadcast text-xs font-bold text-slate-200 tracking-wider">
            VIRTUAL FADER SURFACE
          </span>
          <span className="text-[10px] font-mono-broadcast text-slate-400">
            ({channels.filter((c) => c.armed).length} Armed / {channels.length} Tracks)
          </span>
        </div>

        {/* Bank Selection Filter */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setBankFilter('ALL')}
            className={`px-2.5 py-1 text-[10px] font-mono-broadcast font-medium rounded transition-colors cursor-pointer ${
              bankFilter === 'ALL'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ALL
          </button>
          <button
            type="button"
            onClick={() => setBankFilter('ARMED')}
            className={`px-2.5 py-1 text-[10px] font-mono-broadcast font-medium rounded transition-colors cursor-pointer ${
              bankFilter === 'ARMED'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ARMED
          </button>
          {channels.length > 8 && (
            <>
              <button
                type="button"
                onClick={() => setBankFilter('BANK_1_8')}
                className={`px-2.5 py-1 text-[10px] font-mono-broadcast font-medium rounded transition-colors cursor-pointer ${
                  bankFilter === 'BANK_1_8'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1-8
              </button>
              <button
                type="button"
                onClick={() => setBankFilter('BANK_9_16')}
                className={`px-2.5 py-1 text-[10px] font-mono-broadcast font-medium rounded transition-colors cursor-pointer ${
                  bankFilter === 'BANK_9_16'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                9-16
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Surface Grid / Row */}
      <div className="flex-1 flex overflow-hidden">
        {/* Scrollable ISO Channel Strips */}
        <div className="flex-1 flex gap-2.5 p-3 overflow-x-auto overflow-y-hidden items-stretch">
          {filteredChannels.map((channel) => (
            <ChannelStrip
              key={channel.id}
              channel={channel}
              onToggleArm={onToggleArm}
              onSetFader={onSetFader}
              onSetTrim={onSetTrim}
              onSetPan={onSetPan}
              onTogglePfl={onTogglePfl}
              onToggleSolo={onToggleSolo}
              onToggleMute={onToggleMute}
              onRename={onRename}
              onClearClip={onClearClip}
            />
          ))}

          {filteredChannels.length === 0 && (
            <div className="w-full flex flex-col items-center justify-center text-slate-500 py-12">
              <Filter className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-mono-broadcast">No channels match current filter ({bankFilter})</p>
              <button
                type="button"
                onClick={() => setBankFilter('ALL')}
                className="mt-3 px-3 py-1 bg-slate-800 text-slate-200 text-xs rounded font-mono-broadcast hover:bg-slate-700 cursor-pointer"
              >
                Show All Channels
              </button>
            </div>
          )}
        </div>

        {/* Fixed Master L/R Mix Bus Section */}
        <div className="w-32 bg-slate-900/90 border-l border-slate-800 p-2.5 flex flex-col items-center justify-between shrink-0 select-none">
          {/* Master Title */}
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-mono-broadcast text-xs font-bold text-amber-400">
              MIX L/R
            </span>
            <span className="text-[9px] font-mono-broadcast text-slate-400">
              MASTER
            </span>
          </div>

          {/* Master Dual Stereo Meters */}
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono-broadcast text-slate-400 mb-0.5">L</span>
              <AudioPeakMeter
                peakDbFs={masterBus.peakLeftDbFs}
                clip={masterBus.clip}
                limiterActive={masterBus.limiterActive}
                onClearClip={onClearMasterClip}
                heightClass="h-44"
                showScale={true}
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono-broadcast text-slate-400 mb-0.5">R</span>
              <AudioPeakMeter
                peakDbFs={masterBus.peakRightDbFs}
                clip={masterBus.clip}
                limiterActive={masterBus.limiterActive}
                onClearClip={onClearMasterClip}
                heightClass="h-44"
                showScale={false}
              />
            </div>
          </div>

          {/* Master Fader readout & Controls */}
          <div className="w-full flex flex-col items-center gap-1 pt-1.5 border-t border-slate-800">
            <span className="text-[10px] font-mono-broadcast text-slate-300">
              {masterBus.faderGainDb >= 0 ? `+${masterBus.faderGainDb} dB` : `${masterBus.faderGainDb} dB`}
            </span>
            <div className="w-full flex items-center justify-center py-1">
              <span className="text-[9px] font-mono-broadcast text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                Dugan AutoMix
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
