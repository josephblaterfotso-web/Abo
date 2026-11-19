import { AatonDriver } from '../drivers/AatonDriver';
import { RecorderDriver } from '../drivers/RecorderDriver';
import { SoundDevicesDriver } from '../drivers/SoundDevicesDriver';
import { ZaxcomDriver } from '../drivers/ZaxcomDriver';
import { ZoomDriver } from '../drivers/ZoomDriver';
import {
  AudioChannel,
  ConnectionMedium,
  ConnectionStatus,
  FrameRate,
  MachineStatus,
  MasterBus,
  RecorderBrand,
  RecorderModel,
  TakeRecord,
  TimecodeState,
  TransmitterRF,
  TransportState,
} from '../types/recorder';

export interface DiscoveredDevice {
  id: string;
  name: string;
  brand: RecorderBrand;
  model: RecorderModel;
  medium: ConnectionMedium;
  signalStrengthDbm: number;
  ipAddress?: string;
  isPaired: boolean;
}

export type StateUpdateListener = () => void;

export class ConnectionManager {
  private static instance: ConnectionManager;

  public activeDriver: RecorderDriver;
  public brand: RecorderBrand = 'SOUND_DEVICES';
  public model: RecorderModel = 'SD_833';
  public status: ConnectionStatus = 'CONNECTED';
  public transport: TransportState = 'STOPPED';

  // Live state
  public channels: AudioChannel[] = [];
  public masterBus: MasterBus = {
    name: 'LR Bus',
    faderGainDb: 0,
    peakLeftDbFs: -60,
    peakRightDbFs: -60,
    limiterActive: false,
    clip: false,
  };
  public timecode: TimecodeState = {
    timecode: '01:00:00:00',
    frameRate: '25',
    isJamSynced: true,
    syncSource: 'INTERNAL',
    userBits: '20261110',
    driftFrames: 0,
  };
  public machineStatus: MachineStatus = {
    internalBatteryPercent: 88,
    externalPowerVolts: 14.8,
    powerSource: 'EXTERNAL_HIROSE',
    media1RemainingMinutes: 520,
    media1TotalGb: 512,
    media2RemainingMinutes: 520,
    media2TotalGb: 512,
    sampleRateKhz: 48,
    bitDepth: '24-bit',
    recorderTemperatureC: 38.2,
    headphoneVolumePercent: 74,
  };
  public transmitters: TransmitterRF[] = [];
  public takeHistory: TakeRecord[] = [];

  // Active Take info
  public currentScene: string = '12';
  public currentTake: number = 1;
  public currentTakeSuffix: string = '';
  public currentRoll: string = 'R001';
  public currentNotes: string = '';
  public recordStartTimecode: string = '01:00:00:00';
  public recordDurationSeconds: number = 0;

  private listeners: Set<StateUpdateListener> = new Set();
  private meterInterval: any = null;
  private timecodeInterval: any = null;
  private durationInterval: any = null;
  private frameCounter: number = 0;

  private constructor() {
    this.activeDriver = new SoundDevicesDriver('SD_833');
    this.initDefaultChannels(8);
    this.initDefaultTransmitters();
    this.initMockHistory();
    this.startAudioAndClockSimulation();
  }

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  public subscribe(listener: StateUpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('ConnectionManager listener error:', e);
      }
    });
  }

  private initDefaultChannels(count: number) {
    const defaultNames = [
      'BOOM 1',
      'LAV 1 - CLARA',
      'LAV 2 - PAUL',
      'LAV 3 - MARC',
      'PLANT CAR',
      'BOOM 2 WIDE',
      'AMBIENCE L',
      'AMBIENCE R',
      'SPARE 9',
      'SPARE 10',
      'SPARE 11',
      'SPARE 12',
    ];

    const colors = [
      '#3b82f6', // Blue (Boom)
      '#10b981', // Green (Lav Clara)
      '#f59e0b', // Amber (Lav Paul)
      '#ec4899', // Pink (Lav Marc)
      '#8b5cf6', // Violet
      '#06b6d4', // Cyan
      '#14b8a6', // Teal
      '#14b8a6', // Teal
    ];

    this.channels = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      number: i + 1,
      name: defaultNames[i] || `CH ${i + 1}`,
      armed: i < 4 || i === 4, // Default arm first 5 tracks
      faderGainDb: 0,
      trimGainDb: 34 + (i % 4) * 4,
      pan: i === 6 ? -100 : i === 7 ? 100 : 0,
      pfl: false,
      solo: false,
      mute: false,
      limiterActive: false,
      is32BitFloat: this.activeDriver.supports32BitFloat,
      highPassFilterHz: i < 4 ? 80 : 0,
      peakDbFs: -60,
      rmsDbFs: -60,
      clip: false,
      colorTag: colors[i % colors.length],
      sourceInput: i < 6 ? `Mic/Line ${i + 1}` : `AES ${i - 5}`,
    }));
  }

  private initDefaultTransmitters() {
    this.transmitters = [
      {
        id: 'tx-1',
        channelNumber: 2,
        name: 'TRX-101',
        actor: 'Clara',
        frequencyMhz: 572.25,
        rfSignalDbm: -62,
        batteryPercent: 92,
        gainOffsetDb: 0,
        powerState: 'ON',
        isMuted: false,
        brand: 'ZAXCOM_TRX',
      },
      {
        id: 'tx-2',
        channelNumber: 3,
        name: 'TRX-102',
        actor: 'Paul',
        frequencyMhz: 578.5,
        rfSignalDbm: -68,
        batteryPercent: 78,
        gainOffsetDb: +2,
        powerState: 'ON',
        isMuted: false,
        brand: 'ZAXCOM_TRX',
      },
      {
        id: 'tx-3',
        channelNumber: 4,
        name: 'WISY-201',
        actor: 'Marc',
        frequencyMhz: 590.1,
        rfSignalDbm: -74,
        batteryPercent: 64,
        gainOffsetDb: -3,
        powerState: 'ON',
        isMuted: false,
        brand: 'WISYCOM',
      },
      {
        id: 'tx-4',
        channelNumber: 5,
        name: 'LECTRO-SSM',
        actor: 'David',
        frequencyMhz: 595.5,
        rfSignalDbm: -79,
        batteryPercent: 24,
        gainOffsetDb: +1,
        powerState: 'ON',
        isMuted: false,
        brand: 'LECTROSONICS',
      },
    ];
  }

  private initMockHistory() {
    this.takeHistory = [
      {
        id: 'take-10-1',
        scene: '11',
        take: 1,
        roll: 'R001',
        startTc: '00:54:12:08',
        endTc: '00:55:40:22',
        durationSeconds: 88,
        isCircled: false,
        isFalseTake: false,
        notes: 'Rehearsal on action, boom shadow at end',
        tags: ['Boom shadow'],
        trackNames: ['BOOM 1', 'LAV 1 - CLARA', 'LAV 2 - PAUL'],
        sampleRate: '48 kHz',
        bitDepth: '24-bit',
        channelsCount: 6,
        timestamp: Date.now() - 3600000,
        filename: 'T11_01.WAV',
      },
      {
        id: 'take-10-2',
        scene: '11',
        take: 2,
        roll: 'R001',
        startTc: '00:56:02:14',
        endTc: '00:57:33:05',
        durationSeconds: 91,
        isCircled: true,
        isFalseTake: false,
        notes: 'BEST TAKE. Clean dialog, actors locked in',
        tags: ['Good take ⭐'],
        trackNames: ['BOOM 1', 'LAV 1 - CLARA', 'LAV 2 - PAUL'],
        sampleRate: '48 kHz',
        bitDepth: '24-bit',
        channelsCount: 6,
        timestamp: Date.now() - 2800000,
        filename: 'T11_02.WAV',
      },
      {
        id: 'take-10-3',
        scene: '11',
        take: 3,
        roll: 'R001',
        startTc: '00:58:10:00',
        endTc: '00:58:18:12',
        durationSeconds: 8,
        isCircled: false,
        isFalseTake: true,
        notes: '[FALSE TAKE] Camera cut immediately',
        tags: ['Aborted', 'False Take'],
        trackNames: ['BOOM 1', 'LAV 1 - CLARA', 'LAV 2 - PAUL'],
        sampleRate: '48 kHz',
        bitDepth: '24-bit',
        channelsCount: 6,
        timestamp: Date.now() - 2100000,
        filename: 'T11_03.WAV',
      },
      {
        id: 'take-10-4',
        scene: '11',
        take: 3,
        takeSuffix: 'WT',
        roll: 'R001',
        startTc: '00:59:00:00',
        endTc: '00:59:45:00',
        durationSeconds: 45,
        isCircled: true,
        isFalseTake: false,
        notes: 'Room tone recorded on location after scene 11',
        tags: ['Room Tone', 'Wildtrack'],
        trackNames: ['BOOM 1', 'BOOM 2 WIDE', 'AMBIENCE L', 'AMBIENCE R'],
        sampleRate: '48 kHz',
        bitDepth: '24-bit',
        channelsCount: 8,
        timestamp: Date.now() - 1500000,
        filename: 'T11_03WT.WAV',
      },
    ];
  }

  // Driver switching
  public setRecorder(brand: RecorderBrand, model: RecorderModel) {
    if (this.activeDriver) {
      this.activeDriver.disconnect();
    }

    this.brand = brand;
    this.model = model;

    switch (brand) {
      case 'SOUND_DEVICES':
        this.activeDriver = new SoundDevicesDriver(model);
        this.machineStatus.bitDepth = '24-bit';
        break;
      case 'ZOOM':
        this.activeDriver = new ZoomDriver(model);
        this.machineStatus.bitDepth = '32-bit Float';
        break;
      case 'AATON':
        this.activeDriver = new AatonDriver(model);
        this.machineStatus.bitDepth = '24-bit';
        break;
      case 'ZAXCOM':
        this.activeDriver = new ZaxcomDriver(model);
        this.machineStatus.bitDepth = '24-bit';
        break;
    }

    this.status = 'CONNECTED';
    this.initDefaultChannels(this.activeDriver.maxChannels);
    this.notify();
  }

  // Scanning simulation or Web Bluetooth
  public async scanForDevices(): Promise<DiscoveredDevice[]> {
    this.status = 'SCANNING';
    this.notify();

    await new Promise((r) => setTimeout(r, 900));

    const list: DiscoveredDevice[] = [
      {
        id: 'sd-833-01',
        name: 'Sound Devices 833 (Cart #1)',
        brand: 'SOUND_DEVICES',
        model: 'SD_833',
        medium: 'BLE',
        signalStrengthDbm: -54,
        isPaired: this.model === 'SD_833',
      },
      {
        id: 'sd-888-02',
        name: 'Sound Devices 888 (Bag)',
        brand: 'SOUND_DEVICES',
        model: 'SD_888',
        medium: 'BLE',
        signalStrengthDbm: -72,
        isPaired: false,
      },
      {
        id: 'zoom-f8n-01',
        name: 'Zoom F8n Pro (BTA-1)',
        brand: 'ZOOM',
        model: 'ZOOM_F8N_PRO',
        medium: 'BLE',
        signalStrengthDbm: -63,
        isPaired: this.model === 'ZOOM_F8N_PRO',
      },
      {
        id: 'aaton-x3-01',
        name: 'Aaton CantarX3 (192.168.1.100)',
        brand: 'AATON',
        model: 'AATON_CANTAR_X3',
        medium: 'WIFI_IP',
        ipAddress: '192.168.1.100',
        signalStrengthDbm: -45,
        isPaired: this.model === 'AATON_CANTAR_X3',
      },
      {
        id: 'zaxcom-nova-01',
        name: 'Zaxcom Nova 2 (ZaxNet)',
        brand: 'ZAXCOM',
        model: 'ZAXCOM_NOVA_2',
        medium: 'BLE',
        signalStrengthDbm: -58,
        isPaired: this.model === 'ZAXCOM_NOVA_2',
      },
    ];

    this.status = 'CONNECTED';
    this.notify();
    return list;
  }

  // Transport Methods
  public async record(): Promise<boolean> {
    if (this.transport === 'RECORDING') return true;

    await this.activeDriver.startRecord();
    this.transport = 'RECORDING';
    this.recordStartTimecode = this.timecode.timecode;
    this.recordDurationSeconds = 0;

    if (this.durationInterval) clearInterval(this.durationInterval);
    this.durationInterval = setInterval(() => {
      this.recordDurationSeconds += 1;
      this.machineStatus.media1RemainingMinutes = Math.max(0, this.machineStatus.media1RemainingMinutes - 0.016);
      this.notify();
    }, 1000);

    this.notify();
    return true;
  }

  public async stop(): Promise<boolean> {
    if (this.transport === 'STOPPED') return true;

    const wasRecording = this.transport === 'RECORDING';
    await this.activeDriver.stopRecord();
    this.transport = 'STOPPED';

    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    // Save take record if we were recording
    if (wasRecording && this.recordDurationSeconds >= 1) {
      const newRecord: TakeRecord = {
        id: `take-${Date.now()}`,
        scene: this.currentScene,
        take: this.currentTake,
        takeSuffix: this.currentTakeSuffix,
        roll: this.currentRoll,
        startTc: this.recordStartTimecode,
        endTc: this.timecode.timecode,
        durationSeconds: this.recordDurationSeconds,
        isCircled: false,
        isFalseTake: false,
        notes: this.currentNotes,
        tags: this.currentNotes ? [this.currentNotes.slice(0, 20)] : [],
        trackNames: this.channels.filter((c) => c.armed).map((c) => c.name),
        sampleRate: `${this.machineStatus.sampleRateKhz} kHz`,
        bitDepth: this.machineStatus.bitDepth,
        channelsCount: this.channels.filter((c) => c.armed).length,
        timestamp: Date.now(),
        filename: `T${this.currentScene}_${String(this.currentTake).padStart(2, '0')}${this.currentTakeSuffix ? '_' + this.currentTakeSuffix : ''}.WAV`,
      };

      this.takeHistory.unshift(newRecord);

      // Auto-increment take
      this.currentTake += 1;
      this.currentNotes = '';
    }

    this.notify();
    return true;
  }

  public async play(): Promise<boolean> {
    await this.activeDriver.play();
    this.transport = 'PLAYING';
    this.notify();
    return true;
  }

  public async pause(): Promise<boolean> {
    await this.activeDriver.pause();
    this.transport = 'PAUSED';
    this.notify();
    return true;
  }

  // 1-Click False Take
  public async falseTake(): Promise<void> {
    // If currently recording, stop immediately and flag false take
    if (this.transport === 'RECORDING') {
      await this.stop();
    }

    // Mark previous take in history as false take
    if (this.takeHistory.length > 0) {
      const prevTake = this.takeHistory[0];
      prevTake.isFalseTake = true;
      prevTake.isCircled = false;
      if (!prevTake.notes.includes('[FALSE TAKE]')) {
        prevTake.notes = `[FALSE TAKE] ${prevTake.notes}`.trim();
      }
      if (!prevTake.tags.includes('False Take')) {
        prevTake.tags.push('False Take');
      }
    }

    // Revert current take counter
    const res = await this.activeDriver.triggerFalseTake(this.currentTake);
    this.currentTake = res.newTake;
    this.notify();
  }

  public toggleCircleLastTake() {
    if (this.takeHistory.length > 0) {
      this.takeHistory[0].isCircled = !this.takeHistory[0].isCircled;
      this.notify();
    }
  }

  // Channel Operations
  public toggleTrackArm(channelId: number) {
    const ch = this.channels.find((c) => c.id === channelId);
    if (ch) {
      ch.armed = !ch.armed;
      this.activeDriver.setTrackArm(ch.number, ch.armed);
      this.notify();
    }
  }

  public setFaderGain(channelId: number, gainDb: number) {
    const ch = this.channels.find((c) => c.id === channelId);
    if (ch) {
      ch.faderGainDb = Math.round(gainDb * 10) / 10;
      this.activeDriver.setFaderGain(ch.number, ch.faderGainDb);
      this.notify();
    }
  }

  public setTrimGain(channelId: number, trimDb: number) {
    const ch = this.channels.find((c) => c.id === channelId);
    if (ch) {
      ch.trimGainDb = Math.round(trimDb);
      this.activeDriver.setTrimGain(ch.number, ch.trimGainDb);
      this.notify();
    }
  }

  public setPan(channelId: number, pan: number) {
    const ch = this.channels.find((c) => c.id === channelId);
    if (ch) {
      ch.pan = pan;
      this.activeDriver.setPan(ch.number, pan);
      this.notify();
    }
  }

  public togglePfl(channelId: number) {
    const ch = this.channels.find((c) => c.id === channelId);
    if (ch) {
      ch.pfl = !ch.pfl;
      this.activeDriver.setPflSoloMute(ch.number, ch.pfl, ch.solo, ch.mute);
      this.notify();
    }
  }

  public toggleSolo(channelId: number) {
    const ch = this.channels.find((c) => c.id === channelId);
    if (ch) {
      ch.solo = !ch.solo;
      this.activeDriver.setPflSoloMute(ch.number, ch.pfl, ch.solo, ch.mute);
      this.notify();
    }
  }

  public toggleMute(channelId: number) {
    const ch = this.channels.find((c) => c.id === channelId);
    if (ch) {
      ch.mute = !ch.mute;
      this.activeDriver.setPflSoloMute(ch.number, ch.pfl, ch.solo, ch.mute);
      this.notify();
    }
  }

  public setTrackName(channelId: number, name: string) {
    const ch = this.channels.find((c) => c.id === channelId);
    if (ch) {
      ch.name = name;
      this.activeDriver.setTrackName(ch.number, name);
      this.notify();
    }
  }

  public clearClip(channelId: number) {
    const ch = this.channels.find((c) => c.id === channelId);
    if (ch) {
      ch.clip = false;
      this.notify();
    }
  }

  public clearMasterClip() {
    this.masterBus.clip = false;
    this.notify();
  }

  public setTimecodeFrameRate(fps: FrameRate) {
    this.timecode.frameRate = fps;
    this.notify();
  }

  public jamTimecode() {
    this.timecode.isJamSynced = true;
    this.timecode.driftFrames = 0;
    this.activeDriver.jamTimecode('INTERNAL');
    this.notify();
  }

  public setTransmitterPower(txId: string, power: 'ON' | 'STANDBY' | 'LOW_POWER') {
    const tx = this.transmitters.find((t) => t.id === txId);
    if (tx) {
      tx.powerState = power;
      this.activeDriver.setTransmitterPower(txId, power);
      this.notify();
    }
  }

  public setTransmitterGain(txId: string, gainOffset: number) {
    const tx = this.transmitters.find((t) => t.id === txId);
    if (tx) {
      tx.gainOffsetDb = gainOffset;
      this.activeDriver.setTransmitterGain(txId, gainOffset);
      this.notify();
    }
  }

  public setTransmitterFrequency(txId: string, freqMhz: number) {
    const tx = this.transmitters.find((t) => t.id === txId);
    if (tx) {
      tx.frequencyMhz = Math.round(freqMhz * 1000) / 1000;
      this.notify();
    }
  }

  // Realistic audio metering & Timecode continuous engine
  private startAudioAndClockSimulation() {
    // 30 Hz Meter refresh for smooth hardware ballistics
    this.meterInterval = setInterval(() => {
      const isRec = this.transport === 'RECORDING';
      const isPlay = this.transport === 'PLAYING';

      let maxLeft = -60;
      let maxRight = -60;

      this.channels.forEach((ch, idx) => {
        if (!ch.armed && !isPlay) {
          ch.peakDbFs = -60;
          ch.rmsDbFs = -60;
          return;
        }

        // Voice modulation algorithm
        const baseGain = ch.trimGainDb * 0.15;
        const speechActivity = Math.sin(Date.now() / (800 + idx * 300));
        const noiseFloor = -48 + Math.random() * 4;

        let dynamicPeak = noiseFloor;
        if (speechActivity > -0.2) {
          // Actor talking
          dynamicPeak = -24 + baseGain + Math.sin(Date.now() / 150) * 8 + Math.random() * 4;
        }

        // Apply fader gain
        dynamicPeak += ch.faderGainDb * 0.5;

        // Clip / Limiter detection
        if (dynamicPeak >= -0.5) {
          if (!ch.is32BitFloat) {
            ch.clip = true;
            ch.limiterActive = true;
            dynamicPeak = Math.min(0, dynamicPeak);
          } else {
            // 32-bit float allows +3dB to +6dB without hard clipping
            ch.limiterActive = dynamicPeak > 0;
            ch.clip = false;
          }
        } else if (dynamicPeak > -3) {
          ch.limiterActive = true;
        } else {
          ch.limiterActive = false;
        }

        // Smooth decay
        ch.peakDbFs = Math.max(-60, dynamicPeak);
        ch.rmsDbFs = Math.max(-60, dynamicPeak - 6);

        // Mix bus accumulation
        if (!ch.mute) {
          const panLeftFactor = (100 - ch.pan) / 100;
          const panRightFactor = (100 + ch.pan) / 100;
          maxLeft = Math.max(maxLeft, ch.peakDbFs * panLeftFactor);
          maxRight = Math.max(maxRight, ch.peakDbFs * panRightFactor);
        }
      });

      this.masterBus.peakLeftDbFs = maxLeft;
      this.masterBus.peakRightDbFs = maxRight;
      if (maxLeft >= -0.2 || maxRight >= -0.2) {
        this.masterBus.clip = true;
        this.masterBus.limiterActive = true;
      }

      this.notify();
    }, 40);

    // Frame clock for Timecode
    const fps = 25; // default 25 fps
    let frame = 0;
    let sec = 14;
    let min = 22;
    let hour = 1;

    this.timecodeInterval = setInterval(() => {
      frame++;
      if (frame >= fps) {
        frame = 0;
        sec++;
        if (sec >= 60) {
          sec = 0;
          min++;
          if (min >= 60) {
            min = 0;
            hour = (hour + 1) % 24;
          }
        }
      }

      this.timecode.timecode = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}:${String(frame).padStart(2, '0')}`;
    }, 1000 / fps);
  }
}
