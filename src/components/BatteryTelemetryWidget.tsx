import React, { useState, useRef, useEffect } from 'react';
import { MachineStatus, TransmitterRF } from '../types/recorder';
import {
  Battery,
  BatteryCharging,
  BatteryWarning,
  Zap,
  ChevronDown,
  Radio,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Power,
  X,
  Gauge,
} from 'lucide-react';

interface BatteryTelemetryWidgetProps {
  machine: MachineStatus;
  transmitters: TransmitterRF[];
  onSetTransmitterPower?: (txId: string, power: 'ON' | 'STANDBY' | 'LOW_POWER') => void;
  isDaylightMode?: boolean;
}

export const BatteryTelemetryWidget: React.FC<BatteryTelemetryWidgetProps> = ({
  machine,
  transmitters,
  onSetTransmitterPower,
  isDaylightMode = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calculations for Recorder External Battery (Hirose 14.4V nominal Li-Ion/BDS)
  // Standard 4S Li-Ion: 16.8V (100%), 14.8V (~75%), 13.2V (~30%), 12.0V (empty cutoff)
  const extVolts = machine.externalPowerVolts;
  const extMinVolts = 11.8;
  const extMaxVolts = 16.8;
  const extPercent = Math.max(
    0,
    Math.min(100, Math.round(((extVolts - extMinVolts) / (extMaxVolts - extMinVolts)) * 100))
  );
  const extRuntimeHours = (extPercent / 100) * 6.5; // Estimated runtime in hours based on ~18W cart consumption

  // Calculations for Recorder Internal Battery (2S Li-ion or NiMH tray)
  const intPercent = machine.internalBatteryPercent;
  const intVolts = (7.0 + (intPercent / 100) * 1.4).toFixed(1); // 7.0V to 8.4V 2S cell

  // Transmitters Battery Analysis
  const lowestTxBattery = transmitters.length > 0
    ? Math.min(...transmitters.map((t) => t.batteryPercent))
    : 100;
  const hasLowTxWarning = lowestTxBattery < 25;
  const isCritical = extVolts < 12.2 || intPercent < 15 || lowestTxBattery < 15;

  // Helper to estimate transmitter cell voltage
  const getTransmitterVoltage = (tx: TransmitterRF) => {
    if (tx.brand === 'WISYCOM') {
      // 2x AA NiMH or Alkaline (2.0V - 3.1V)
      return (2.1 + (tx.batteryPercent / 100) * 0.95).toFixed(2);
    }
    // Zaxcom / Lectrosonics 1S Li-Ion or Dual (3.4V to 4.2V)
    return (3.5 + (tx.batteryPercent / 100) * 0.7).toFixed(2);
  };

  // Helper to estimate transmitter runtime
  const getTransmitterRuntime = (percent: number, powerState: string) => {
    if (powerState === 'STANDBY') return 'Standby (12h+)';
    const baseHours = powerState === 'LOW_POWER' ? 6.5 : 4.5;
    const hours = (percent / 100) * baseHours;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${String(m).padStart(2, '0')}m`;
  };

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Integrated Trigger in TopMachineBar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border font-mono-broadcast text-xs transition-all cursor-pointer group ${
          isCritical
            ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-[0_0_10px_rgba(225,29,72,0.5)] animate-pulse'
            : hasLowTxWarning
            ? 'bg-amber-950/70 border-amber-500 text-amber-200'
            : 'bg-slate-950/80 hover:bg-slate-800 border-slate-700/80 text-slate-200'
        }`}
        title="Click to view detailed battery telemetry for recorder and all transmitters"
      >
        {/* Recorder Power Stack */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex items-center justify-center">
            <Zap className={`w-3.5 h-3.5 ${extVolts < 12.5 ? 'text-rose-400' : 'text-amber-400'}`} />
          </div>
          <div className="flex flex-col text-left leading-tight">
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <span className="text-amber-400">{extVolts}V</span>
              <span className="text-slate-500 font-normal">/</span>
              <span className="text-emerald-400">{intPercent}%</span>
            </div>
            <span className="text-[8px] text-slate-400 uppercase tracking-tighter">
              BDS · INT
            </span>
          </div>
        </div>

        <div className="w-px h-5 bg-slate-700/80" />

        {/* Transmitters Battery Stack */}
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-blue-400" />
          <div className="flex flex-col text-left leading-tight">
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <span className="text-slate-300">{transmitters.length} TX</span>
              <span
                className={`text-[9px] px-1 rounded ${
                  hasLowTxWarning ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-emerald-400'
                }`}
              >
                Min {lowestTxBattery}%
              </span>
            </div>
            <span className="text-[8px] text-slate-400 uppercase tracking-tighter">
              RF POW
            </span>
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : 'group-hover:text-white'
          }`}
        />
      </button>

      {/* Flyout Telemetry Popover Drawer */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-80 sm:w-96 max-w-[95vw] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 sm:p-4 z-50 text-slate-100 font-mono-broadcast overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="text-xs font-bold text-white tracking-wider">
                  POWER & BATTERY TELEMETRY
                </h3>
                <span className="text-[9px] text-slate-400 block">
                  Recorder Rails · Hirose BDS · ZaxNet / Wireless TX
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Low Battery Alert Banner if applicable */}
          {(hasLowTxWarning || isCritical) && (
            <div className="mt-2.5 p-2 bg-amber-950/60 border border-amber-600/80 rounded-lg flex items-center gap-2 text-amber-300 text-[10px]">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {isCritical
                  ? 'CRITICAL POWER: Check recorder or transmitter batteries immediately!'
                  : `Transmitter battery below 25% (${transmitters.find((t) => t.batteryPercent < 25)?.actor || 'TX'}). Plan battery swap at next cut.`}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-3.5 mt-3 max-h-[70vh] overflow-y-auto pr-1">
            {/* SECTION 1: FIELD RECORDER POWER SYSTEM */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Recorder Power Rails
                </span>
                <span className="text-emerald-400 flex items-center gap-1 text-[9px]">
                  <ShieldCheck className="w-3 h-3" /> Redundant Dual-Supply
                </span>
              </div>

              {/* Primary: Hirose External BDS */}
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                    <span className="text-xs font-bold text-white">
                      Hirose DC / BDS Smart Battery
                    </span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                    ACTIVE
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-amber-400">{extVolts}</span>
                    <span className="text-xs text-amber-300 font-bold">V</span>
                    <span className="text-[10px] text-slate-400 ml-2">
                      ({extPercent}% · 14.4V Li-Ion)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-300" title="Estimated remaining runtime">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>~{Math.floor(extRuntimeHours)}h {Math.round((extRuntimeHours % 1) * 60)}m</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden border border-slate-700/50">
                  <div
                    className={`h-full transition-all duration-300 ${
                      extVolts < 12.2
                        ? 'bg-rose-500'
                        : extVolts < 13.2
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${extPercent}%` }}
                  />
                </div>
              </div>

              {/* Secondary: Internal Li-Ion / Tray */}
              <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-850 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-slate-200 font-semibold block text-[11px]">
                      Internal Tray Battery
                    </span>
                    <span className="text-[9px] text-slate-400">
                      Seamless Failover Backup · {intVolts} V
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400">{intPercent}%</span>
                  <div className="w-12 h-1.5 bg-slate-850 rounded-full overflow-hidden border border-slate-700/50">
                    <div
                      className="h-full bg-emerald-400"
                      style={{ width: `${intPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: WIRELESS TRANSMITTERS (TX) */}
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-blue-400" />
                  Connected Transmitters ({transmitters.length})
                </span>
                <span className="text-[9px] text-slate-400">
                  ZaxNet / Wireless Link
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {transmitters.map((tx) => {
                  const txVolt = getTransmitterVoltage(tx);
                  const isTxLow = tx.batteryPercent < 25;
                  const isTxCritical = tx.batteryPercent < 15;

                  return (
                    <div
                      key={tx.id}
                      className={`p-2.5 rounded-lg border transition-all ${
                        isTxCritical
                          ? 'bg-rose-950/40 border-rose-800/80'
                          : isTxLow
                          ? 'bg-amber-950/30 border-amber-800/60'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      {/* Top Row: Actor, Channel & Brand */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              tx.powerState === 'STANDBY'
                                ? 'bg-slate-500'
                                : isTxCritical
                                ? 'bg-rose-500 animate-pulse'
                                : isTxLow
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                          <span className="text-xs font-bold text-white">
                            {tx.actor}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            ({tx.name} · CH {tx.channelNumber})
                          </span>
                        </div>

                        {/* Power State Tag */}
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                            tx.powerState === 'ON'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : tx.powerState === 'LOW_POWER'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {tx.powerState}
                        </span>
                      </div>

                      {/* Middle: Voltage, Percentage & Runtime */}
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className={`text-base font-black ${
                              isTxCritical
                                ? 'text-rose-400'
                                : isTxLow
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {tx.batteryPercent}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({txVolt} V)
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{getTransmitterRuntime(tx.batteryPercent, tx.powerState)}</span>
                        </div>
                      </div>

                      {/* Battery Visual Bar */}
                      <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden border border-slate-700/50 mb-2">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isTxCritical
                              ? 'bg-rose-500'
                              : isTxLow
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${tx.batteryPercent}%` }}
                        />
                      </div>

                      {/* Quick Power Save Action directly inside battery widget */}
                      {onSetTransmitterPower && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-850/80 text-[9px]">
                          <span className="text-slate-400">Quick Power:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onSetTransmitterPower(tx.id, 'ON')}
                              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                                tx.powerState === 'ON'
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'bg-slate-850 text-slate-400 hover:text-white'
                              }`}
                            >
                              ON
                            </button>
                            <button
                              type="button"
                              onClick={() => onSetTransmitterPower(tx.id, 'LOW_POWER')}
                              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                                tx.powerState === 'LOW_POWER'
                                  ? 'bg-amber-600 text-white font-bold'
                                  : 'bg-slate-850 text-slate-400 hover:text-white'
                              }`}
                            >
                              LOW
                            </button>
                            <button
                              type="button"
                              onClick={() => onSetTransmitterPower(tx.id, 'STANDBY')}
                              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                                tx.powerState === 'STANDBY'
                                  ? 'bg-slate-700 text-amber-300 font-bold'
                                  : 'bg-slate-850 text-slate-400 hover:text-white'
                              }`}
                            >
                              STANDBY
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[8px] text-slate-400">
            <span>Threshold: Low &lt; 25% · Cutoff 11.8V</span>
            <span>Continuous Polling 30Hz</span>
          </div>
        </div>
      )}
    </div>
  );
};
