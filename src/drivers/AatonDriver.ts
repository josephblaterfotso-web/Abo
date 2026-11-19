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

export class AatonDriver extends RecorderDriver {
  public readonly brand: RecorderBrand = 'AATON';
  public readonly model: RecorderModel;
  public readonly defaultMedium: ConnectionMedium = 'WIFI_IP';
  public readonly maxChannels: number;
  public readonly supports32BitFloat: boolean = false; // Cantar uses custom ultra-low-noise linear analog preamps with 24-bit AD
  public readonly supportsZaxNet: boolean = false;

  private ipAddress: string = '192.168.1.100';
  private oscPort: number = 8000;

  constructor(model: RecorderModel = 'AATON_CANTAR_X3') {
    super();
    this.model = model;
    this.maxChannels = model === 'AATON_CANTAR_X3' ? 24 : 16;
  }

  public async connect(target: string): Promise<boolean> {
    this.status = 'CONNECTING';
    this.emit('status_change', this.status);

    try {
      this.ipAddress = target || '192.168.1.100';
      await new Promise((resolve) => setTimeout(resolve, 450));
      this.status = 'CONNECTED';
      this.emit('status_change', this.status);
      this.emit('log', `Connected to Aaton ${this.model} via Wi-Fi OSC & Madeline API (${this.ipAddress}:${this.oscPort})`);
      return true;
    } catch (err: any) {
      this.status = 'ERROR';
      this.emit('status_change', this.status);
      this.emit('error', `Failed to connect Aaton Cantar: ${err?.message || err}`);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    this.status = 'DISCONNECTED';
    this.emit('status_change', this.status);
    this.emit('log', 'Aaton Cantar OSC session terminated');
  }

  public async startRecord(): Promise<boolean> {
    this.transportState = 'RECORDING';
    this.emit('transport_change', this.transportState);
    // OSC command /cantar/transport/record 1
    this.emit('hardware_command', { cmd: 'OSC_SEND', address: '/cantar/transport/record', args: [1] });
    return true;
  }

  public async stopRecord(): Promise<boolean> {
    this.transportState = 'STOPPED';
    this.emit('transport_change', this.transportState);
    // OSC command /cantar/transport/stop 1
    this.emit('hardware_command', { cmd: 'OSC_SEND', address: '/cantar/transport/stop', args: [1] });
    return true;
  }

  public async play(): Promise<boolean> {
    this.transportState = 'PLAYING';
    this.emit('transport_change', this.transportState);
    this.emit('hardware_command', { cmd: 'OSC_SEND', address: '/cantar/transport/play', args: [1] });
    return true;
  }

  public async pause(): Promise<boolean> {
    this.transportState = 'PAUSED';
    this.emit('transport_change', this.transportState);
    this.emit('hardware_command', { cmd: 'OSC_SEND', address: '/cantar/transport/pause', args: [1] });
    return true;
  }

  public async triggerFalseTake(currentTake: number): Promise<{ newTake: number; reverted: boolean }> {
    const newTake = Math.max(1, currentTake - 1);
    this.emit('log', `Aaton Cantar: False Take flagged in Madeline report, roll index adjusted.`);
    this.emit('hardware_command', { cmd: 'OSC_SEND', address: '/cantar/take/false', args: [currentTake, newTake] });
    return { newTake, reverted: true };
  }

  public async setTrackArm(channelNumber: number, armed: boolean): Promise<boolean> {
    this.emit('hardware_command', { cmd: 'OSC_SEND', address: `/cantar/track/${channelNumber}/arm`, args: [armed ? 1 : 0] });
    return true;
  }

  public async setFaderGain(channelNumber: number, gainDb: number): Promise<boolean> {
    this.emit('hardware_command', { cmd: 'OSC_SEND', address: `/cantar/fader/${channelNumber}`, args: [gainDb] });
    return true;
  }

  public async setTrimGain(channelNumber: number, gainDb: number): Promise<boolean> {
    this.emit('hardware_command', { cmd: 'OSC_SEND', address: `/cantar/preamp/${channelNumber}`, args: [gainDb] });
    return true;
  }

  public async setPan(channelNumber: number, pan: number): Promise<boolean> {
    this.emit('hardware_command', { cmd: 'OSC_SEND', address: `/cantar/pan/${channelNumber}`, args: [pan] });
    return true;
  }

  public async setPflSoloMute(channelNumber: number, pfl: boolean, solo: boolean, mute: boolean): Promise<boolean> {
    this.emit('hardware_command', { cmd: 'OSC_SEND', address: `/cantar/track/${channelNumber}/monitor`, args: [pfl ? 1 : 0, solo ? 1 : 0, mute ? 1 : 0] });
    return true;
  }

  public async setTrackName(channelNumber: number, name: string): Promise<boolean> {
    this.emit('hardware_command', { cmd: 'OSC_SEND', address: `/cantar/track/${channelNumber}/label`, args: [name] });
    return true;
  }

  public async jamTimecode(source: 'INTERNAL' | 'LTC_IN' | 'GENLOCK'): Promise<boolean> {
    this.emit('jam_timecode', { source, brand: 'Aaton TCXO 0.1ppm precision clock' });
    return true;
  }

  public async updateTakeMetadata(scene: string, take: number, roll: string, notes: string): Promise<boolean> {
    this.emit('metadata_update', { scene, take, roll, notes, system: 'Madeline XML' });
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
        internalBatteryPercent: 94,
        externalPowerVolts: 15.2,
        powerSource: 'EXTERNAL_HIROSE',
        media1RemainingMinutes: 780,
        media1TotalGb: 1000,
        media2RemainingMinutes: 780,
        media2TotalGb: 512,
        sampleRateKhz: 48,
        bitDepth: '24-bit',
        recorderTemperatureC: 36.1,
        headphoneVolumePercent: 74,
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
        name: 'Mix 1-2',
        faderGainDb: 0,
        peakLeftDbFs: -16.4,
        peakRightDbFs: -16.9,
        limiterActive: false,
        clip: false,
      },
      transmitters: [],
    };
  }
}
