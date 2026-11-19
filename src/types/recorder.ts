export type RecorderBrand = 'SOUND_DEVICES' | 'ZOOM' | 'AATON' | 'ZAXCOM';

export type RecorderModel = 
  // Sound Devices
  | 'SD_833' | 'SD_888' | 'SD_SCORPIO' | 'SD_MIXPRE10_II' | 'SD_MIXPRE6_II'
  // Zoom
  | 'ZOOM_F8N_PRO' | 'ZOOM_F8N' | 'ZOOM_F6' | 'ZOOM_F4'
  // Aaton Digital
  | 'AATON_CANTAR_X3' | 'AATON_CANTAR_MINI'
  // Zaxcom
  | 'ZAXCOM_NOVA' | 'ZAXCOM_NOVA_2' | 'ZAXCOM_NOMAD' | 'ZAXCOM_DEVA_24';

export type TransportState = 'STOPPED' | 'RECORDING' | 'PLAYING' | 'PAUSED';

export type ConnectionMedium = 'BLE' | 'WIFI_IP' | 'USB_SERIAL';

export type ConnectionStatus = 'DISCONNECTED' | 'SCANNING' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export type FrameRate = '23.976' | '24' | '25' | '29.97ND' | '29.97DF' | '30';

export interface AudioChannel {
  id: number;
  number: number;
  name: string;
  armed: boolean;
  faderGainDb: number; // -infinity to +12 dB (represented as number, e.g. -60 to 12)
  trimGainDb: number;  // 0 to +76 dB
  pan: number;         // -100 (Hard Left) to +100 (Hard Right), 0 is Center
  pfl: boolean;        // Pre-Fade Listen
  solo: boolean;
  mute: boolean;
  limiterActive: boolean;
  is32BitFloat: boolean;
  highPassFilterHz: number; // 0 (off), 40, 80, 120, 160
  peakDbFs: number;    // -60 to +6 (for 32-bit float headroom)
  rmsDbFs: number;
  clip: boolean;
  colorTag?: string;
  sourceInput: string; // e.g. 'Mic 1', 'Line 2', 'Dante 3', 'AES 4'
}

export interface MasterBus {
  name: string;
  faderGainDb: number;
  peakLeftDbFs: number;
  peakRightDbFs: number;
  limiterActive: boolean;
  clip: boolean;
}

export interface TimecodeState {
  timecode: string;       // e.g. "01:24:35:18"
  frameRate: FrameRate;
  isJamSynced: boolean;
  syncSource: 'INTERNAL' | 'LTC_IN' | 'GENLOCK' | 'BLE_SYNC';
  userBits: string;       // e.g. "20261110"
  driftFrames: number;
}

export interface MachineStatus {
  internalBatteryPercent: number;
  externalPowerVolts: number; // e.g. 14.4V Hirose smart battery
  powerSource: 'INTERNAL' | 'EXTERNAL_HIROSE' | 'USB_C';
  media1RemainingMinutes: number;
  media1TotalGb: number;
  media2RemainingMinutes: number;
  media2TotalGb: number;
  sampleRateKhz: 48 | 96 | 192;
  bitDepth: '24-bit' | '32-bit Float';
  recorderTemperatureC: number;
  headphoneVolumePercent: number;
}

export interface TransmitterRF {
  id: string;
  channelNumber: number;
  name: string;
  actor: string;
  frequencyMhz: number;
  rfSignalDbm: number; // e.g. -65 dBm
  batteryPercent: number;
  gainOffsetDb: number;
  powerState: 'ON' | 'STANDBY' | 'LOW_POWER';
  isMuted: boolean;
  brand: 'ZAXCOM_TRX' | 'WISYCOM' | 'LECTROSONICS' | 'SENNHEISER';
}

export interface TakeRecord {
  id: string;
  scene: string;
  take: number;
  takeSuffix?: string; // e.g. 'A', 'B'
  roll: string;
  startTc: string;
  endTc: string;
  durationSeconds: number;
  isCircled: boolean;
  isFalseTake: boolean;
  notes: string;
  tags: string[];
  trackNames: string[];
  sampleRate: string;
  bitDepth: string;
  channelsCount: number;
  timestamp: number;
  filename: string;
}

export interface SoundReportHeader {
  projectTitle: string;
  soundRecordist: string;
  boomOperator: string;
  productionCompany: string;
  director: string;
  location: string;
  soundRoll: string;
  date: string;
  frameRate: FrameRate;
  sampleRate: string;
  bitDepth: string;
}

export interface RfScanPoint {
  frequencyMhz: number;
  rssiDbm: number;
  peakDbm: number;
  tvChannel?: number;
  isOccupied: boolean;
  isIntermodRisk: boolean;
}

export interface ToiIntermodProduct {
  id: string;
  type: 'TOI_2F1_F2' | 'TOI_3F';
  freqMhz: number;
  formula: string;
  sourceTxNames: string[];
  affectedTxId?: string;
  affectedTxName?: string;
  deltaKhz?: number;
  severity: 'CRITICAL_COLLISION' | 'WARNING_NEARBY' | 'SAFE_DISTANCE';
}

export interface RfScanBand {
  id: string;
  name: string;
  startMhz: number;
  endMhz: number;
  stepKhz: number;
}
