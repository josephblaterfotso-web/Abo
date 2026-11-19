import React from 'react';
import { TransmitterRF } from '../types/recorder';
import { Radio, Battery, Power, VolumeX, Volume2, Wifi, Activity, Sparkles } from 'lucide-react';

interface RfMatrixViewProps {
  transmitters: TransmitterRF[];
  onSetPower: (txId: string, power: 'ON' | 'STANDBY' | 'LOW_POWER') => void;
  onSetGain: (txId: string, gain: number) => void;
  supportsZaxNet: boolean;
  onNavigateToScan?: () => void;
}

export const RfMatrixView: React.FC<RfMatrixViewProps> = ({
  transmitters,
  onSetPower,
  onSetGain,
  supportsZaxNet,
  onNavigateToScan,
}) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-950 text-slate-100 rounded-xl border border-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="font-mono-broadcast text-sm font-bold text-white tracking-wide">
              WIRELESS RF & TRANSMITTER REMOTE (ZAXNET / WISYCOM)
            </h2>
            <span className="text-[10px] font-mono-broadcast text-slate-400">
              Remote Preamp Trim · Standby Power Save · Battery Telemetry
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToScan && (
            <button
              type="button"
              onClick={onNavigateToScan}
              className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-mono-broadcast font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>RF SPECTRUM & TOI SCANNER</span>
            </button>
          )}

          {supportsZaxNet && (
            <span className="px-2.5 py-1 bg-blue-950 text-blue-400 border border-blue-800 rounded text-[10px] font-mono-broadcast font-bold">
              ZaxNet 2.4 GHz Active
            </span>
          )}
        </div>
      </div>

      {/* Transmitter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {transmitters.map((tx) => (
          <div
            key={tx.id}
            className={`p-3 rounded-lg border flex flex-col justify-between gap-3 transition-colors ${
              tx.powerState === 'STANDBY'
                ? 'bg-slate-900/40 border-slate-800 opacity-75'
                : 'bg-slate-900 border-slate-700/80'
            }`}
          >
            {/* Top row: Actor & Channel Number */}
            <div
              className={`flex items-center justify-between transition-colors ${
                tx.powerState === 'STANDBY'
                  ? 'african-inactive-panel-header -mx-3 -mt-3 p-3 rounded-t-lg border-b'
                  : 'pb-1 border-b border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    tx.powerState === 'STANDBY'
                      ? 'bg-amber-500/70'
                      : 'bg-emerald-400'
                  }`}
                />
                <div>
                  <h3 className="font-mono-broadcast text-xs font-bold text-white">
                    {tx.actor} ({tx.name})
                  </h3>
                  <span className="text-[9px] font-mono-broadcast text-slate-400">
                    Routing: CH {tx.channelNumber} · {tx.brand.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Frequency */}
              <div className="text-right">
                <span className="text-xs font-mono-broadcast font-bold text-amber-400">
                  {tx.frequencyMhz.toFixed(2)} MHz
                </span>
              </div>
            </div>

            {/* Middle row: Battery & RF RSSI */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded border border-slate-800 text-[10px] font-mono-broadcast">
              {/* Battery */}
              <div className="flex items-center gap-1.5">
                <Battery
                  className={`w-3.5 h-3.5 ${
                    tx.batteryPercent < 20 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'
                  }`}
                />
                <span className="text-slate-300">
                  Batt: <strong>{tx.batteryPercent}%</strong>
                </span>
              </div>

              {/* RF Signal */}
              <div className="flex items-center gap-1.5 justify-end">
                <Wifi className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-300">
                  RSSI: <strong>{tx.rfSignalDbm} dBm</strong>
                </span>
              </div>
            </div>

            {/* Remote Gain Trim Control */}
            <div className="flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800 text-xs font-mono-broadcast">
              <span className="text-slate-400 text-[10px]">REMOTE GAIN</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSetGain(tx.id, Math.max(-12, tx.gainOffsetDb - 1))}
                  className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="font-bold text-amber-400 min-w-[32px] text-center">
                  {tx.gainOffsetDb > 0 ? `+${tx.gainOffsetDb}` : tx.gainOffsetDb} dB
                </span>
                <button
                  type="button"
                  onClick={() => onSetGain(tx.id, Math.min(12, tx.gainOffsetDb + 1))}
                  className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Power State Buttons: ON / STANDBY / LOW */}
            <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={() => onSetPower(tx.id, 'ON')}
                className={`py-1 rounded text-[9px] font-mono-broadcast font-bold cursor-pointer transition-colors ${
                  tx.powerState === 'ON'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                ON (TX)
              </button>
              <button
                type="button"
                onClick={() => onSetPower(tx.id, 'LOW_POWER')}
                className={`py-1 rounded text-[9px] font-mono-broadcast font-bold cursor-pointer transition-colors ${
                  tx.powerState === 'LOW_POWER'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                LOW PWR
              </button>
              <button
                type="button"
                onClick={() => onSetPower(tx.id, 'STANDBY')}
                className={`py-1 rounded text-[9px] font-mono-broadcast font-bold cursor-pointer transition-colors ${
                  tx.powerState === 'STANDBY'
                    ? 'bg-slate-700 text-amber-300 font-black'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                STANDBY
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
