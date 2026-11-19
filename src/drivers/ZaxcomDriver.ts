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

export class ZaxcomDriver extends RecorderDriver {
  public readonly brand: RecorderBrand = 'ZAXCOM';
  public readonly model: RecorderModel;
  public readonly defaultMedium: ConnectionMedium = 'BLE';
  public readonly maxChannels: number;
  public readonly supports32BitFloat: boolean = false; // Zaxcom uses patented NeverClip dual A/D with 137 dB dynamic range
  public readonly supportsZaxNet: boolean = true;

  private connectedPort: string = 'ZaxMote-BLE-Nova';

  constructor(model: RecorderModel = 'ZAXCOM_NOVA') {
    super();
    this.model = model;
    this.maxChannels = model === 'ZAXCOM_DEVA_24' ? 24 : model === 'ZAXCOM_NOVA_2' ? 16 : 12;
  }

  public async connect(target: string): Promise<boolean> {
    this.status = 'CONNECTING';
    this.emit('status_change', this.status);

    try {
      this.connectedPort = target || 'ZaxMote-BLE-Nova';
      await new Promise((resolve) => setTimeout(resolve, 380));
      this.status = 'CONNECTED';
      this.emit('status_change', this.status);
      this.emit('log', `Connected to Zaxcom ${this.model} via ZaxMote & ZaxNet 2.4GHz RF Link`);
      return true;
    } catch (err: any) {
      this.status = 'ERROR';
      this.emit('status_change', this.status);
      this.emit('error', `Failed to connect Zaxcom: ${err?.message || err}`);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    this.status = 'DISCONNECTED';
    this.emit('status_change', this.status);
    this.emit('log', 'Zaxcom remote link stopped');
  }

  public async startRecord(): Promise<boolean> {
    this.transportState = 'RECORDING';
    this.emit('transport_change', this.transportState);
    // ZaxNet triggers internal Nova recording + broadcasts REC trigger to all TRX bodypack transmitters
    this.emit('hardware_command', { cmd: 'ZAXNET_TRANSPORT_REC', trxSync: true });
    return true;
  }

  public async stopRecord(): Promise<boolean> {
    this.transportState = 'STOPPED';
    this.emit('transport_change', this.transportState);
    this.emit('hardware_command', { cmd: 'ZAXNET_TRANSPORT_STOP', trxSync: true });
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
    this.emit('log', `Zaxcom: False Take marked. Next take: ${newTake}`);
    this.emit('hardware_command', { cmd: 'ZAXCOM_FALSE_TAKE', take: newTake });
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
    this.emit('jam_timecode', { source, brand: 'Zaxcom ZaxNet 2.4GHz TC broadcast' });
    return true;
  }

  public async updateTakeMetadata(scene: string, take: number, roll: string, notes: string): Promise<boolean> {
    this.emit('metadata_update', { scene, take, roll, notes, zaxnet: true });
    return true;
  }

  public async setTransmitterGain(txId: string, gainOffsetDb: number): Promise<boolean> {
    // Direct ZaxNet 2.4GHz remote preamp gain change command
    this.emit('hardware_command', { cmd: 'ZAXNET_TX_GAIN', txId, gainDb: gainOffsetDb });
    this.emit('tx_gain', { txId, gainOffsetDb });
    return true;
  }

  public async setTransmitterPower(txId: string, power: 'ON' | 'STANDBY' | 'LOW_POWER'): Promise<boolean> {
    // Direct ZaxNet power mode command to transmitters
    this.emit('hardware_command', { cmd: 'ZAXNET_TX_POWER', txId, power });
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
        internalBatteryPercent: 82,
        externalPowerVolts: 14.1,
        powerSource: 'EXTERNAL_HIROSE',
        media1RemainingMinutes: 540,
        media1TotalGb: 512,
        media2RemainingMinutes: 540,
        media2TotalGb: 512,
        sampleRateKhz: 48,
        bitDepth: '24-bit',
        recorderTemperatureC: 37.5,
        headphoneVolumePercent: 70,
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
        name: 'Main L/R',
        faderGainDb: 0,
        peakLeftDbFs: -19.0,
        peakRightDbFs: -19.4,
        limiterActive: false,
        clip: false,
      },
      transmitters: [],
    };
  }
}
