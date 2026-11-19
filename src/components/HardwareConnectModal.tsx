import React, { useState } from 'react';
import {
  ConnectionMedium,
  RecorderBrand,
  RecorderModel,
} from '../types/recorder';
import { DiscoveredDevice } from '../services/ConnectionManager';
import {
  Bluetooth,
  Wifi,
  Usb,
  X,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Radio,
} from 'lucide-react';

interface HardwareConnectModalProps {
  currentBrand: RecorderBrand;
  currentModel: RecorderModel;
  onSelectRecorder: (brand: RecorderBrand, model: RecorderModel) => void;
  onScan: () => Promise<DiscoveredDevice[]>;
  onClose: () => void;
}

export const HardwareConnectModal: React.FC<HardwareConnectModalProps> = ({
  currentBrand,
  currentModel,
  onSelectRecorder,
  onScan,
  onClose,
}) => {
  const [selectedMedium, setSelectedMedium] = useState<ConnectionMedium>('BLE');
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([
    {
      id: 'sd-833-01',
      name: 'Sound Devices 833 (Cart #1)',
      brand: 'SOUND_DEVICES',
      model: 'SD_833',
      medium: 'BLE',
      signalStrengthDbm: -54,
      isPaired: currentModel === 'SD_833',
    },
    {
      id: 'zoom-f8n-01',
      name: 'Zoom F8n Pro (BTA-1)',
      brand: 'ZOOM',
      model: 'ZOOM_F8N_PRO',
      medium: 'BLE',
      signalStrengthDbm: -63,
      isPaired: currentModel === 'ZOOM_F8N_PRO',
    },
    {
      id: 'aaton-x3-01',
      name: 'Aaton CantarX3 (192.168.1.100)',
      brand: 'AATON',
      model: 'AATON_CANTAR_X3',
      medium: 'WIFI_IP',
      ipAddress: '192.168.1.100',
      signalStrengthDbm: -45,
      isPaired: currentModel === 'AATON_CANTAR_X3',
    },
    {
      id: 'zaxcom-nova-01',
      name: 'Zaxcom Nova 2 (ZaxNet)',
      brand: 'ZAXCOM',
      model: 'ZAXCOM_NOVA_2',
      medium: 'BLE',
      signalStrengthDbm: -58,
      isPaired: currentModel === 'ZAXCOM_NOVA_2',
    },
  ]);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const results = await onScan();
      setDevices(results);
    } finally {
      setIsScanning(false);
    }
  };

  const modelOptions: Record<
    RecorderBrand,
    { label: string; models: { id: RecorderModel; name: string; specs: string }[] }
  > = {
    SOUND_DEVICES: {
      label: 'Sound Devices',
      models: [
        { id: 'SD_833', name: '833', specs: '8 ISO tracks, Dugan Automix, 6 faders' },
        { id: 'SD_888', name: '888', specs: '16 ISO tracks, Dante, 8 faders' },
        { id: 'SD_SCORPIO', name: 'Scorpio', specs: '32 ISO tracks, 32-bus, 16 preamps' },
        { id: 'SD_MIXPRE10_II', name: 'MixPre-10 II', specs: '10 tracks, 32-bit float, USB audio' },
      ],
    },
    ZOOM: {
      label: 'Zoom Corporation',
      models: [
        { id: 'ZOOM_F8N_PRO', name: 'F8n Pro', specs: '8 inputs, Dual A/D 32-bit float, BTA-1' },
        { id: 'ZOOM_F6', name: 'F6', specs: '6 inputs, 32-bit float, ultra-compact bag' },
        { id: 'ZOOM_F4', name: 'F4', specs: '6 tracks, high-precision TCXO TC' },
      ],
    },
    AATON: {
      label: 'Aaton Digital',
      models: [
        { id: 'AATON_CANTAR_X3', name: 'CantarX3', specs: '24 tracks, Wi-Fi OSC, Madeline App, ultra-analog preamps' },
        { id: 'AATON_CANTAR_MINI', name: 'CantarMini', specs: '16 tracks, lightweight bag recorder' },
      ],
    },
    ZAXCOM: {
      label: 'Zaxcom',
      models: [
        { id: 'ZAXCOM_NOVA_2', name: 'Nova 2', specs: '16 tracks, 4 dual receivers, NeverClip, ZaxNet' },
        { id: 'ZAXCOM_NOMAD', name: 'Nomad 12', specs: '12 tracks, ZaxNet RF control, AutoMixer' },
        { id: 'ZAXCOM_DEVA_24', name: 'Deva 24', specs: '24 tracks, cart centerpiece, touch display' },
      ],
    },
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400" />
            <h3 className="font-mono-broadcast text-sm font-bold text-white tracking-wide">
              RECORDER HARDWARE & PROTOCOL MANAGER
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Medium Selector (BLE / Wi-Fi IP / USB Serial) */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono-broadcast text-slate-400 uppercase font-semibold">
              INTERFACE MEDIUM:
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedMedium('BLE')}
                className={`px-3 py-1 text-xs font-mono-broadcast rounded flex items-center gap-1.5 cursor-pointer transition-colors ${
                  selectedMedium === 'BLE'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span>Bluetooth LE</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMedium('WIFI_IP')}
                className={`px-3 py-1 text-xs font-mono-broadcast rounded flex items-center gap-1.5 cursor-pointer transition-colors ${
                  selectedMedium === 'WIFI_IP'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Wi-Fi / OSC / IP</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMedium('USB_SERIAL')}
                className={`px-3 py-1 text-xs font-mono-broadcast rounded flex items-center gap-1.5 cursor-pointer transition-colors ${
                  selectedMedium === 'USB_SERIAL'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Usb className="w-3.5 h-3.5" />
                <span>USB Serial</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleScan}
            disabled={isScanning}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-mono-broadcast flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Scan Devices'}</span>
          </button>
        </div>

        {/* Content Body: Discovered list + Model Switcher */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          {/* Section 1: Discovered / Nearby Recorders */}
          <div>
            <h4 className="text-[11px] font-mono-broadcast font-bold text-slate-300 uppercase mb-2">
              DISCOVERED & PAIRED FIELD RECORDERS
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                    dev.model === currentModel
                      ? 'bg-blue-950/40 border-blue-600 shadow-xs'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-broadcast text-xs font-bold text-white">
                        {dev.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono-broadcast text-slate-400">
                      {dev.medium === 'BLE' ? 'Bluetooth LE' : dev.ipAddress ? `IP: ${dev.ipAddress}` : 'USB OTG'} · RSSI {dev.signalStrengthDbm} dBm
                    </span>
                  </div>

                  {dev.model === currentModel ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono-broadcast text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      CONNECTED
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectRecorder(dev.brand, dev.model);
                        onClose();
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono-broadcast font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Quick Model Profile Switcher */}
          <div>
            <h4 className="text-[11px] font-mono-broadcast font-bold text-slate-300 uppercase mb-2">
              MANUAL MODEL SELECTION (ALL 4 BRANDS SUPPORTED)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(modelOptions).map(([brandKey, group]) => (
                <div
                  key={brandKey}
                  className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-2"
                >
                  <span className="text-[10px] font-mono-broadcast font-bold text-blue-400 uppercase">
                    {group.label}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {group.models.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onSelectRecorder(brandKey as RecorderBrand, m.id);
                          onClose();
                        }}
                        className={`text-left p-2 rounded-lg border text-xs font-mono-broadcast transition-all cursor-pointer ${
                          m.id === currentModel
                            ? 'bg-blue-600 text-white border-blue-400 font-bold'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{m.name}</span>
                          {m.id === currentModel && (
                            <span className="text-[9px] bg-blue-800 px-1.5 rounded">ACTIVE</span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{m.specs}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[10px] font-mono-broadcast">
          <span>Active Driver: {currentBrand} Protocol Engine · Low Latency (≤ 15ms)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
