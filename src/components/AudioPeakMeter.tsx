import React from 'react';

interface AudioPeakMeterProps {
  peakDbFs: number;
  rmsDbFs?: number;
  clip: boolean;
  limiterActive: boolean;
  is32BitFloat?: boolean;
  onClearClip?: () => void;
  orientation?: 'vertical' | 'horizontal';
  showScale?: boolean;
  heightClass?: string;
}

export const AudioPeakMeter: React.FC<AudioPeakMeterProps> = ({
  peakDbFs,
  rmsDbFs = -60,
  clip,
  limiterActive,
  is32BitFloat = false,
  onClearClip,
  orientation = 'vertical',
  showScale = true,
  heightClass = 'h-36',
}) => {
  // Normalize dBFS: -60 dB to +6 dB -> 0% to 100%
  // 0 dB is at 90.9% if max is +6dB, or 100% if 24-bit max is 0dB
  const minDb = -60;
  const maxDb = is32BitFloat ? 6 : 0;
  const range = maxDb - minDb;

  const clampDb = Math.max(minDb, Math.min(maxDb, peakDbFs));
  const peakPercent = Math.max(0, Math.min(100, ((clampDb - minDb) / range) * 100));

  const clampRms = Math.max(minDb, Math.min(maxDb, rmsDbFs));
  const rmsPercent = Math.max(0, Math.min(100, ((clampRms - minDb) / range) * 100));

  if (orientation === 'horizontal') {
    return (
      <div className="flex items-center gap-2 w-full">
        {/* Horizontal Meter Bar */}
        <div className="relative flex-1 h-3.5 bg-slate-900 rounded-sm overflow-hidden border border-slate-700/60 flex items-center">
          {/* Segments gradient background */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
            style={{ width: `${peakPercent}%` }}
          />
          {/* RMS marker */}
          <div
            className="absolute inset-y-0 w-0.5 bg-white/90 z-10"
            style={{ left: `${rmsPercent}%` }}
          />
          {/* 0dB unity tick */}
          <div
            className="absolute inset-y-0 w-px bg-white/40 z-20"
            style={{ left: is32BitFloat ? '90.9%' : '98%' }}
          />
        </div>

        {/* Clip / Limiter LED */}
        <div className="flex items-center gap-1 shrink-0">
          {limiterActive && (
            <span
              title="Limiter Active"
              className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
            />
          )}
          <button
            type="button"
            onClick={onClearClip}
            title={clip ? 'CLIP DETECTED - Click to reset' : 'Normal Headroom'}
            className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[8px] font-bold transition-colors ${
              clip
                ? 'bg-rose-600 text-white animate-pulse'
                : is32BitFloat
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {is32BitFloat ? '32F' : 'C'}
          </button>
        </div>
      </div>
    );
  }

  // Vertical Meter
  return (
    <div className={`relative flex items-center gap-1 ${heightClass} select-none`}>
      {/* dB Scale markings */}
      {showScale && (
        <div className="flex flex-col justify-between h-full text-[9px] font-mono-broadcast text-slate-400 dark:text-slate-500 pr-1 py-0.5 leading-none shrink-0 text-right w-6">
          <span className={is32BitFloat ? 'text-cyan-400 font-bold' : 'text-rose-500 font-bold'}>
            {is32BitFloat ? '+6' : '0'}
          </span>
          <span>-6</span>
          <span className="text-amber-400">-12</span>
          <span>-20</span>
          <span>-40</span>
          <span>-60</span>
        </div>
      )}

      {/* Meter column */}
      <div className="relative w-4 h-full bg-slate-900 rounded-xs border border-slate-700/80 overflow-hidden flex flex-col justify-end">
        {/* Graticule division lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-20 opacity-30">
          <div className="w-full h-px bg-white" />
          <div className="w-full h-px bg-white" />
          <div className="w-full h-px bg-white" />
          <div className="w-full h-px bg-white" />
          <div className="w-full h-px bg-white" />
        </div>

        {/* Dynamic Peak Fill */}
        <div
          className="w-full transition-all duration-75"
          style={{
            height: `${peakPercent}%`,
            background: is32BitFloat
              ? 'linear-gradient(to top, #10b981 0%, #10b981 60%, #f59e0b 80%, #ef4444 91%, #06b6d4 100%)'
              : 'linear-gradient(to top, #10b981 0%, #10b981 65%, #f59e0b 85%, #ef4444 100%)',
          }}
        />

        {/* RMS Line indicator */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-white/95 z-10 transition-all duration-100"
          style={{ bottom: `${rmsPercent}%` }}
        />
      </div>

      {/* LED indicators for Limiter & Clip on top */}
      <div className="flex flex-col items-center justify-between h-full py-1">
        {/* Clip LED */}
        <button
          type="button"
          onClick={onClearClip}
          title={clip ? 'CLIP (Click to clear)' : 'Clip Indicator'}
          className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[7px] font-mono-broadcast font-bold transition-colors ${
            clip
              ? 'bg-rose-600 text-white shadow-[0_0_8px_rgba(225,29,72,0.9)] animate-pulse cursor-pointer'
              : is32BitFloat
              ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
              : 'bg-slate-800 text-slate-500'
          }`}
        >
          {is32BitFloat ? '32' : 'C'}
        </button>

        {/* Limiter Active LED */}
        <div
          title="Analog / Digital Limiter"
          className={`w-2 h-2 rounded-full transition-colors ${
            limiterActive
              ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]'
              : 'bg-slate-800'
          }`}
        />

        {/* Peak readout */}
        <span className="text-[8px] font-mono-broadcast text-slate-400 dark:text-slate-400 leading-tight">
          {peakDbFs <= -59 ? '-∞' : `${peakDbFs > 0 ? '+' : ''}${peakDbFs.toFixed(0)}`}
        </span>
      </div>
    </div>
  );
};
