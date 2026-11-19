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

export class SoundDevicesDriver extends RecorderDriver {
  public readonly brand: RecorderBrand = 'SOUND_DEVICES';
  public readonly model: RecorderModel;
  public readonly defaultMedium: ConnectionMedium = 'BLE';
  public readonly maxChannels: number;
  public readonly supports32BitFloat: boolean = false; // 8-Series uses 32-bit linear/floating architecture internally with 24-bit output, MixPre-II has 32-bit float
  public readonly supportsZaxNet: boolean = false;

  private connectedAddress: string | null = null;
  private wingmanBleServiceUuid = '0000ff00-0000-1000-8000-00805f9b34fb';

  constructor(model: RecorderModel = 'SD_833') {
    super();
    this.model = model;
    this.maxChannels = model === 'SD_SCORPIO' ? 32 : model === 'SD_888' ? 16 : model === 'SD_833' ? 8 : 10;
  }

  public async connect(target: string): Promise<boolean> {
    this.status = 'CONNECTING';
    this.emit('status_change', this.status);

    // Simulate or invoke Web Bluetooth API if available
    try {
      this.connectedAddress = target || 'SD-833-SN10928';
      await new Promise((resolve) => setTimeout(resolve, 400));
      this.status = 'CONNECTED';
      this.emit('status_change', this.status);
      this.emit('log', `Connected to ${this.model} via Sound Devices Wingman BLE (${this.connectedAddress})`);
      return true;
    } catch (err: any) {
      this.status = 'ERROR';
      this.emit('status_change', this.status);
      this.emit('error', `Failed to connect Sound Devices: ${err?.message || err}`);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    this.status = 'DISCONNECTED';
    this.connectedAddress = null;
    this.emit('status_change', this.status);
    this.emit('log', 'Sound Devices remote session closed');
  }

  public async startRecord(): Promise<boolean> {
    // Wingman Protocol Command: 0x02 (TRANSPORT), 0x01 (REC)
    this.transportState = 'RECORDING';
    this.emit('transport_change', this.transportState);
    this.emit('hardware_command', { cmd: 'WINGMAN_REC', raw: [0x53, 0x44, 0x02, 0x01] });
    return true;
  }

  public async stopRecord(): Promise<boolean> {
    // Wingman Protocol Command: 0x02 (TRANSPORT), 0x00 (STOP)
    this.transportState = 'STOPPED';
    this.emit('transport_change', this.transportState);
    this.emit('hardware_command', { cmd: 'WINGMAN_STOP', raw: [0x53, 0x44, 0x02, 0x00] });
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
    this.emit('log', `Sound Devices: Marked previous take as False Take, reverted take to ${newTake}`);
    this.emit('hardware_command', { cmd: 'SD_FALSE_TAKE', take: newTake });
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
    this.emit('jam_timecode', { source, brand: 'Sound Devices Ambient Lockit Sync' });
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
        internalBatteryPercent: 88,
        externalPowerVolts: 14.8,
        powerSource: 'EXTERNAL_HIROSE',
        media1RemainingMinutes: 492,
        media1TotalGb: 512,
        media2RemainingMinutes: 492,
        media2TotalGb: 512,
        sampleRateKhz: 48,
        bitDepth: '24-bit',
        recorderTemperatureC: 38.4,
        headphoneVolumePercent: 72,
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
        name: 'LR Bus',
        faderGainDb: 0,
        peakLeftDbFs: -18.2,
        peakRightDbFs: -18.5,
        limiterActive: false,
        clip: false,
      },
      transmitters: [],
    };
  }
}
