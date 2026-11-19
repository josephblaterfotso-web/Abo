import React, { useState, useEffect } from 'react';
import { ConnectionManager, DiscoveredDevice } from './services/ConnectionManager';
import {
  AudioChannel,
  FrameRate,
  MachineStatus,
  MasterBus,
  RecorderBrand,
  RecorderModel,
  TakeRecord,
  TimecodeState,
  TransmitterRF,
  TransportState,
} from './types/recorder';
import { TopMachineBar } from './components/TopMachineBar';
import { TransportBar } from './components/TransportBar';
import { VirtualMixingSurface } from './components/VirtualMixingSurface';
import { MetadataEditor } from './components/MetadataEditor';
import { SoundReportView } from './components/SoundReportView';
import { RfMatrixView } from './components/RfMatrixView';
import { RfScannerView } from './components/RfScannerView';
import { HardwareConnectModal } from './components/HardwareConnectModal';
import {
  Sliders,
  FileText,
  FileSpreadsheet,
  Radio,
  Layers,
  Sparkles,
  Activity,
} from 'lucide-react';

export default function App() {
  const manager = ConnectionManager.getInstance();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'MIXER' | 'METADATA' | 'REPORT' | 'RF' | 'RF_SCAN'>('MIXER');

  // Daylight vs Plateau Dark Mode
  const [isDaylightMode, setIsDaylightMode] = useState<boolean>(false);

  // Connect modal
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);

  // Reactive state from ConnectionManager
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = manager.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => unsubscribe();
  }, [manager]);

  // Handle recorder brand & model selection
  const handleSelectRecorder = (brand: RecorderBrand, model: RecorderModel) => {
    manager.setRecorder(brand, model);
  };

  // Handle channel operations
  const handleToggleArm = (id: number) => manager.toggleTrackArm(id);
  const handleSetFader = (id: number, val: number) => manager.setFaderGain(id, val);
  const handleSetTrim = (id: number, val: number) => manager.setTrimGain(id, val);
  const handleSetPan = (id: number, pan: number) => manager.setPan(id, pan);
  const handleTogglePfl = (id: number) => manager.togglePfl(id);
  const handleToggleSolo = (id: number) => manager.toggleSolo(id);
  const handleToggleMute = (id: number) => manager.toggleMute(id);
  const handleRename = (id: number, name: string) => manager.setTrackName(id, name);
  const handleClearClip = (id: number) => manager.clearClip(id);
  const handleClearMasterClip = () => manager.clearMasterClip();

  // Transport operations
  const handleRecord = () => manager.record();
  const handleStop = () => manager.stop();
  const handlePlay = () => manager.play();
  const handlePause = () => manager.pause();
  const handleFalseTake = () => manager.falseTake();
  const handleToggleCircle = () => manager.toggleCircleLastTake();
  const handleAddQuickTag = (tag: string) => {
    manager.currentNotes = manager.currentNotes ? `${manager.currentNotes}, ${tag}` : tag;
    setTick((t) => t + 1);
  };

  // Metadata operations
  const handleUpdateScene = (sc: string) => {
    manager.currentScene = sc;
    setTick((t) => t + 1);
  };
  const handleUpdateTake = (tk: number) => {
    manager.currentTake = tk;
    setTick((t) => t + 1);
  };
  const handleUpdateTakeSuffix = (suf: string) => {
    manager.currentTakeSuffix = suf;
    setTick((t) => t + 1);
  };
  const handleUpdateRoll = (rl: string) => {
    manager.currentRoll = rl;
    setTick((t) => t + 1);
  };
  const handleUpdateNotes = (nts: string) => {
    manager.currentNotes = nts;
    setTick((t) => t + 1);
  };
  const handleApplyPreset = (names: string[]) => {
    names.forEach((name, idx) => {
      if (manager.channels[idx]) {
        manager.setTrackName(manager.channels[idx].id, name);
      }
    });
    setTick((t) => t + 1);
  };

  // Sound Report operations
  const handleToggleTakeCircle = (takeId: string) => {
    const target = manager.takeHistory.find((t) => t.id === takeId);
    if (target) {
      target.isCircled = !target.isCircled;
      setTick((t) => t + 1);
    }
  };
  const handleUpdateTakeNotes = (takeId: string, notes: string) => {
    const target = manager.takeHistory.find((t) => t.id === takeId);
    if (target) {
      target.notes = notes;
      setTick((t) => t + 1);
    }
  };
  const handleDeleteTake = (takeId: string) => {
    manager.takeHistory = manager.takeHistory.filter((t) => t.id !== takeId);
    setTick((t) => t + 1);
  };

  // RF Transmitter operations
  const handleSetRfPower = (txId: string, power: 'ON' | 'STANDBY' | 'LOW_POWER') => {
    manager.setTransmitterPower(txId, power);
  };
  const handleSetRfGain = (txId: string, gain: number) => {
    manager.setTransmitterGain(txId, gain);
  };
  const handleSetRfFrequency = (txId: string, freq: number) => {
    manager.setTransmitterFrequency(txId, freq);
  };

  const isLastTakeCircled =
    manager.takeHistory.length > 0 && manager.takeHistory[0].isCircled;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDaylightMode
          ? 'bg-[#faf5ee] text-[#2b1f1a] daylight-mode'
          : 'bg-black text-slate-100 dark'
      }`}
    >
      {/* 1. TOP BAR (Top Bar Contract: 1-line wordmark, clean nav tabs, 1 primary action) */}
      <header className="relative flex items-center justify-between gap-4 px-4 py-2.5 bg-slate-950 border-b border-slate-800 shrink-0 overflow-x-auto">
        {/* Subtle African chevron divider along header bottom */}
        <div className="african-divider-chevron w-full absolute bottom-0 left-0 right-0 pointer-events-none opacity-40" />

        {/* Brand Zone: 1-line Wordmark */}
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
          <span className="font-mono-broadcast text-lg font-black tracking-widest text-amber-500">
            ABO
          </span>
          <span className="hidden sm:inline text-[11px] font-mono-broadcast text-slate-400">
            · Audio Broadcast Orchestrator
          </span>
        </div>

        {/* Navigation Tabs: clean single-line links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('MIXER')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono-broadcast font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'MIXER'
                ? 'bg-[#c2593f] text-white font-bold shadow-sm border border-[#a63e17]'
                : 'text-slate-400 hover:text-amber-200 hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>MIXER</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('METADATA')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono-broadcast font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'METADATA'
                ? 'bg-[#c2593f] text-white font-bold shadow-sm border border-[#a63e17]'
                : 'text-slate-400 hover:text-amber-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>METADATA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REPORT')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono-broadcast font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'REPORT'
                ? 'bg-[#c2593f] text-white font-bold shadow-sm border border-[#a63e17]'
                : 'text-slate-400 hover:text-amber-200 hover:bg-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>SOUND REPORT</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RF')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono-broadcast font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'RF'
                ? 'bg-[#b45309] text-white font-bold shadow-sm border border-[#92400e]'
                : 'text-slate-400 hover:text-amber-200 hover:bg-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>RF & ZAXNET</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RF_SCAN')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono-broadcast font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'RF_SCAN'
                ? 'bg-[#c2593f] text-white font-bold shadow-sm border border-[#a63e17]'
                : 'text-amber-400/80 hover:text-amber-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>RF SCAN & TOI</span>
          </button>
        </nav>

        {/* Primary Action Zone: Quick Connect / Hardware Settings */}
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
          <button
            type="button"
            onClick={() => setIsConnectModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-amber-400 border border-amber-600/60 text-xs font-mono-broadcast font-bold cursor-pointer transition-colors"
          >
            LINK HARDWARE
          </button>
        </div>
      </header>

      {/* 2. MACHINE STATUS & TIMECODE TOP BAR */}
      <TopMachineBar
        brand={manager.brand}
        model={manager.model}
        status={manager.status}
        machine={manager.machineStatus}
        timecode={manager.timecode}
        transmitters={manager.transmitters}
        isDaylightMode={isDaylightMode}
        onToggleDaylight={() => setIsDaylightMode(!isDaylightMode)}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onJamTimecode={() => manager.jamTimecode()}
        onSetFrameRate={(fps: FrameRate) => manager.setTimecodeFrameRate(fps)}
        onSetTransmitterPower={handleSetRfPower}
      />

      {/* 3. CENTRAL MAIN WORKSPACE (SWIPEABLE / TABBED VIEWS) */}
      <main className="flex-1 flex flex-col p-2 sm:p-4 max-w-7xl w-full mx-auto overflow-hidden">
        {activeTab === 'MIXER' && (
          <div className="flex-1 flex flex-col h-full min-h-[500px]">
            <VirtualMixingSurface
              channels={manager.channels}
              masterBus={manager.masterBus}
              onToggleArm={handleToggleArm}
              onSetFader={handleSetFader}
              onSetTrim={handleSetTrim}
              onSetPan={handleSetPan}
              onTogglePfl={handleTogglePfl}
              onToggleSolo={handleToggleSolo}
              onToggleMute={handleToggleMute}
              onRename={handleRename}
              onClearClip={handleClearClip}
              onClearMasterClip={handleClearMasterClip}
            />
          </div>
        )}

        {activeTab === 'METADATA' && (
          <div className="flex-1 overflow-y-auto">
            <MetadataEditor
              scene={manager.currentScene}
              take={manager.currentTake}
              takeSuffix={manager.currentTakeSuffix}
              roll={manager.currentRoll}
              notes={manager.currentNotes}
              channels={manager.channels}
              onUpdateScene={handleUpdateScene}
              onUpdateTake={handleUpdateTake}
              onUpdateTakeSuffix={handleUpdateTakeSuffix}
              onUpdateRoll={handleUpdateRoll}
              onUpdateNotes={handleUpdateNotes}
              onApplyPreset={handleApplyPreset}
            />
          </div>
        )}

        {activeTab === 'REPORT' && (
          <div className="flex-1 overflow-y-auto">
            <SoundReportView
              takes={manager.takeHistory}
              onToggleCircle={handleToggleTakeCircle}
              onUpdateNotes={handleUpdateTakeNotes}
              onDeleteTake={handleDeleteTake}
            />
          </div>
        )}

        {activeTab === 'RF' && (
          <div className="flex-1 overflow-y-auto">
            <RfMatrixView
              transmitters={manager.transmitters}
              onSetPower={handleSetRfPower}
              onSetGain={handleSetRfGain}
              supportsZaxNet={manager.activeDriver.supportsZaxNet}
              onNavigateToScan={() => setActiveTab('RF_SCAN')}
            />
          </div>
        )}

        {activeTab === 'RF_SCAN' && (
          <div className="flex-1 overflow-y-auto">
            <RfScannerView
              transmitters={manager.transmitters}
              onUpdateTransmitterFrequency={handleSetRfFrequency}
              supportsZaxNet={manager.activeDriver.supportsZaxNet}
            />
          </div>
        )}
      </main>

      {/* 4. UNIVERSAL TRANSPORT BAR (Deltas, Record Shield, False Take, Circle Take) */}
      <TransportBar
        transport={manager.transport}
        durationSeconds={manager.recordDurationSeconds}
        currentTake={manager.currentTake}
        currentScene={manager.currentScene}
        isLastTakeCircled={isLastTakeCircled}
        onRecord={handleRecord}
        onStop={handleStop}
        onPlay={handlePlay}
        onPause={handlePause}
        onFalseTake={handleFalseTake}
        onToggleCircle={handleToggleCircle}
        onAddQuickTag={handleAddQuickTag}
      />

      {/* 5. HARDWARE MULTIPROTOCOL MODAL */}
      {isConnectModalOpen && (
        <HardwareConnectModal
          currentBrand={manager.brand}
          currentModel={manager.model}
          onSelectRecorder={handleSelectRecorder}
          onScan={() => manager.scanForDevices()}
          onClose={() => setIsConnectModalOpen(false)}
        />
      )}
    </div>
  );
}
