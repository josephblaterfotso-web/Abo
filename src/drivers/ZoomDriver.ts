import { RecorderDriver } from './RecorderDriver';
import {
  AudioChannel,
  ConnectionMedium,
  MachineStatus,
  MasterBus,
  RecorderBrand,
  RecorderModel,
  TimecodeState,
  TransmitterRF,
} from '../types/recorder';

export class ZoomDriver extends RecorderDriver {
  public readonly brand: RecorderBrand = 'ZOOM';
  public readonly model: RecorderModel;
  public readonly defaultMedium: ConnectionMedium = 'BLE';
  public readonly maxChannels: number;
  public readonly supports32BitFloat: boolean = true; // Zoom F8n Pro & F6 feature Dual A/D 32-bit float
  public readonly supportsZaxNet: boolean = false;

  private connectedAddress: string | null = null;
  private bta1BleUuid = '0000180a-0000-1000-8000-00805f9b34fb'; // Zoom BTA-1 / F-Control BLE

  constructor(model: RecorderModel = 'ZOOM_F8N_PRO') {
    super();
    this.model = model;
    this.maxChannels = model === 'ZOOM_F6' ? 6 : model === 'ZOOM_F4' ? 6 : 8;
  }

  public async connect(target: string): Promise<boolean> {
    this.status = 'CONNECTING';
    this.emit('status_change', this.status);

    try {
      this.connectedAddress = target || 'ZOOM-F8n-Pro-BTA1';
      await new Promise((resolve) => setTimeout(resolve, 350));
      this.status = 'CONNECTED';
      this.emit('status_change', this.status);
      this.emit('log', `Connected to ${this.model} via BTA-1 BLE & F-Control protocol`);
      return true;
    } catch (err: any) {
      this.status = 'ERROR';
      this.emit('status_change', this.status);
      this.emit('error', `Failed to connect Zoom: ${err?.message || err}`);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    this.status = 'DISCONNECTED';
    this.connectedAddress = null;
    this.emit('status_change', this.status);
    this.emit('log', 'Zoom F-Control session disconnected');
  }

  public async startRecord(): Promise<boolean> {
    this.transportState = 'RECORDING';
    this.emit('transport_change', this.transportState);
    // Zoom SysEx / BLE MIDI Transport REC
    this.emit('hardware_command', { cmd: 'ZOOM_F_REC', sysex: [0xF0, 0x52, 0x00, 0x6E, 0x01, 0xF7] });
    return true;
  }

  public async stopRecord(): Promise<boolean> {
    this.transportState = 'STOPPED';
    this.emit('transport_change', this.transportState);
    this.emit('hardware_command', { cmd: 'ZOOM_F_STOP', sysex: [0xF0, 0x52, 0x00, 0x6E, 0x00, 0xF7] });
    return true;
  }

  public async play(): Promise<boolean> {
    this.transportState = 'PLAYING';
    this.emit('transport_change', this.transportState);
    return true;
  }

  public async pause(): Promise<boolean> {
    this.transportState = 'PAUSED';
    this.emit('transport_change', this.transportState);
    return true;
  }

  public async triggerFalseTake(currentTake: number): Promise<{ newTake: number; reverted: boolean }> {
    const newTake = Math.max(1, currentTake - 1);
    this.emit('log', `Zoom F-Series: False Take marked. Next take: ${newTake}`);
    this.emit('hardware_command', { cmd: 'ZOOM_FALSE_TAKE', take: newTake });
    return { newTake, reverted: true };
  }

  public async setTrackArm(channelNumber: number, armed: boolean): Promise<boolean> {
    this.emit('channel_arm', { channel: channelNumber, armed });
    return true;
  }

  public async setFaderGain(channelNumber: number, gainDb: number): Promise<boolean> {
    this.emit('channel_fader', { channel: channelNumber, gainDb });
    return true;
  }

  public async setTrimGain(channelNumber: number, gainDb: number): Promise<boolean> {
    this.emit('channel_trim', { channel: channelNumber, gainDb });
    return true;
  }

  public async setPan(channelNumber: number, pan: number): Promise<boolean> {
    this.emit('channel_pan', { channel: channelNumber, pan });
    return true;
  }

  public async setPflSoloMute(channelNumber: number, pfl: boolean, solo: boolean, mute: boolean): Promise<boolean> {
    this.emit('channel_pfl_solo_mute', { channel: channelNumber, pfl, solo, mute });
    return true;
  }

  public async setTrackName(channelNumber: number, name: string): Promise<boolean> {
    this.emit('channel_name', { channel: channelNumber, name });
    return true;
  }

  public async jamTimecode(source: 'INTERNAL' | 'LTC_IN' | 'GENLOCK'): Promise<boolean> {
    this.emit('jam_timecode', { source, brand: 'Zoom High-Precision TCXO' });
    return true;
  }

  public async updateTakeMetadata(scene: string, take: number, roll: string, notes: string): Promise<boolean> {
    this.emit('metadata_update', { scene, take, roll, notes });
    return true;
  }

  public async setTransmitterGain(txId: string, gainOffsetDb: number): Promise<boolean> {
    this.emit('tx_gain', { txId, gainOffsetDb });
    return true;
  }

  public async setTransmitterPower(txId: string, power: 'ON' | 'STANDBY' | 'LOW_POWER'): Promise<boolean> {
    this.emit('tx_power', { txId, power });
    return true;
  }

  public async requestStatus(): Promise<{
    machine: MachineStatus;
    timecode: TimecodeState;
    channels: AudioChannel[];
    master: MasterBus;
    transmitters: TransmitterRF[];
  }> {
    return {
      machine: {
        internalBatteryPercent: 79,
        externalPowerVolts: 12.4,
        powerSource: 'EXTERNAL_HIROSE',
        media1RemainingMinutes: 620,
        media1TotalGb: 256,
        media2RemainingMinutes: 620,
        media2TotalGb: 256,
        sampleRateKhz: 48,
        bitDepth: '32-bit Float',
        recorderTemperatureC: 34.2,
        headphoneVolumePercent: 68,
      },
      timecode: {
        timecode: '01:14:22:15',
        frameRate: '25',
        isJamSynced: true,
        syncSource: 'INTERNAL',
        userBits: '20261110',
        driftFrames: 0,
      },
      channels: [],
      master: {
        name: 'Stereo Out',
        faderGainDb: 0,
        peakLeftDbFs: -20.4,
        peakRightDbFs: -20.8,
        limiterActive: false,
        clip: false,
      },
      transmitters: [],
    };
  }
}
