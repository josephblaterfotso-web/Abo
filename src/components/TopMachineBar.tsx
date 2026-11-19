import React, { useState } from 'react';
import {
  ConnectionStatus,
  FrameRate,
  MachineStatus,
  RecorderBrand,
  RecorderModel,
  TimecodeState,
  TransmitterRF,
} from '../types/recorder';
import { BatteryTelemetryWidget } from './BatteryTelemetryWidget';
import {
  HardDrive,
  Radio,
  Clock,
  Sun,
  Moon,
  ChevronDown,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface TopMachineBarProps {
  brand: RecorderBrand;
  model: RecorderModel;
  status: ConnectionStatus;
  machine: MachineStatus;
  timecode: TimecodeState;
  transmitters: TransmitterRF[];
  isDaylightMode: boolean;
  onToggleDaylight: () => void;
  onOpenConnectModal: () => void;
  onJamTimecode: () => void;
  onSetFrameRate: (fps: FrameRate) => void;
  onSetTransmitterPower?: (txId: string, power: 'ON' | 'STANDBY' | 'LOW_POWER') => void;
}

export const TopMachineBar: React.FC<TopMachineBarProps> = ({
  brand,
  model,
  status,
  machine,
  timecode,
  transmitters,
  isDaylightMode,
  onToggleDaylight,
  onOpenConnectModal,
  onJamTimecode,
  onSetFrameRate,
  onSetTransmitterPower,
}) => {
  const [showFpsMenu, setShowFpsMenu] = useState(false);

  const formatBrandName = () => {
    switch (brand) {
      case 'SOUND_DEVICES':
        return 'Sound Devices';
      case 'ZOOM':
        return 'Zoom';
      case 'AATON':
        return 'Aaton Digital';
      case 'ZAXCOM':
        return 'Zaxcom';
    }
  };

  const formatModelName = () => {
    return model.replace(/^(SD_|ZOOM_|AATON_|ZAXCOM_)/, '').replace(/_/g, ' ');
  };

  const frameRates: FrameRate[] = ['23.976', '24', '25', '29.97ND', '29.97DF', '30'];

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 text-slate-100 px-3 py-2 select-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Section: Brand / Connection Status & Hardware Info */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onOpenConnectModal}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700/80 transition-colors text-left cursor-pointer group"
            title="Click to scan or switch recorder"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    status === 'CONNECTED'
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                      : status === 'CONNECTING'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="font-mono-broadcast text-xs font-bold text-white tracking-wide">
                  {formatBrandName()} {formatModelName()}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
              </div>
              <span className="text-[9px] font-mono-broadcast text-slate-400">
                {status === 'CONNECTED' ? 'Linked via BLE/IP · Online' : 'Offline / Scanning'}
              </span>
            </div>
          </button>

          {/* Detailed Battery & Power Telemetry Visual Component */}
          <BatteryTelemetryWidget
            machine={machine}
            transmitters={transmitters}
            onSetTransmitterPower={onSetTransmitterPower}
            isDaylightMode={isDaylightMode}
          />

          {/* Machine Storage & Format Telemetry */}
          <div className="hidden lg:flex items-center gap-3 px-2.5 py-1.5 pattern-african-kuba bg-slate-950/70 rounded-lg border border-slate-800 text-[10px] font-mono-broadcast">
            {/* Media Time Remaining */}
            <div className="flex items-center gap-1 text-slate-300" title="SD1 Media Remaining">
              <HardDrive className="w-3.5 h-3.5 text-amber-500" />
              <span>SD1: {Math.floor(machine.media1RemainingMinutes / 60)}h{Math.floor(machine.media1RemainingMinutes % 60)}m</span>
            </div>

            <span className="text-slate-700">|</span>

            {/* Audio Format */}
            <div className="flex items-center gap-1 text-amber-400">
              <span>{machine.sampleRateKhz}k / {machine.bitDepth}</span>
            </div>
          </div>
        </div>

        {/* Center Section: Master Timecode Display */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
          <Clock className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col items-center">
            <span className="font-mono-broadcast text-lg md:text-xl font-black text-emerald-400 tracking-wider">
              {timecode.timecode}
            </span>
          </div>

          {/* Frame Rate Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFpsMenu(!showFpsMenu)}
              className="px-1.5 py-0.5 rounded bg-slate-850 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono-broadcast text-slate-300 flex items-center gap-0.5 cursor-pointer"
              title="Timecode Frame Rate"
            >
              <span>{timecode.frameRate} fps</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>

            {showFpsMenu && (
              <div className="absolute right-0 top-full mt-1 w-24 bg-slate-900 border border-slate-700 rounded-md shadow-xl py-1 z-50">
                {frameRates.map((fps) => (
                  <button
                    key={fps}
                    type="button"
                    onClick={() => {
                      onSetFrameRate(fps);
                      setShowFpsMenu(false);
                    }}
                    className={`w-full px-2 py-1 text-left text-[11px] font-mono-broadcast hover:bg-amber-600 hover:text-white cursor-pointer ${
                      timecode.frameRate === fps ? 'text-amber-400 font-bold bg-slate-800' : 'text-slate-300'
                    }`}
                  >
                    {fps} fps
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Jam Sync Button */}
          <button
            type="button"
            onClick={onJamTimecode}
            className={`px-2 py-1 rounded text-[10px] font-mono-broadcast font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              timecode.isJamSynced
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                : 'bg-amber-600 text-white animate-pulse'
            }`}
            title="Jam Sync Timecode to Master Clock"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>JAM TC</span>
          </button>
        </div>

        {/* Right Section: Theme Toggle & Display Mode */}
        <div className="flex items-center gap-2">
          {/* Earthy Terracotta & Ochre Daylight / OLED Dark Toggle */}
          <button
            type="button"
            onClick={onToggleDaylight}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono-broadcast transition-all cursor-pointer ${
              isDaylightMode
                ? 'bg-[#c2593f] text-white border-[#9c3d23] font-bold shadow-[0_0_12px_rgba(194,89,63,0.5)]'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850 hover:text-amber-400'
            }`}
            title={isDaylightMode ? 'Switch to Plateau Dark OLED Mode' : 'Switch to Earthy Terracotta / Ochre Daylight Mode'}
          >
            {isDaylightMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-200 fill-current" />
                <span className="hidden md:inline">OCHRE DAYLIGHT</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">OLED DARK</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
