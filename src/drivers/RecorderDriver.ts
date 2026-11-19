import {
  AudioChannel,
  ConnectionMedium,
  ConnectionStatus,
  MachineStatus,
  MasterBus,
  RecorderBrand,
  RecorderModel,
  TakeRecord,
  TimecodeState,
  TransmitterRF,
  TransportState,
} from '../types/recorder';

export type DriverEventListener = (event: string, payload: any) => void;

export abstract class RecorderDriver {
  public abstract readonly brand: RecorderBrand;
  public abstract readonly model: RecorderModel;
  public abstract readonly defaultMedium: ConnectionMedium;
  public abstract readonly maxChannels: number;
  public abstract readonly supports32BitFloat: boolean;
  public abstract readonly supportsZaxNet: boolean;

  protected listeners: Set<DriverEventListener> = new Set();
  protected status: ConnectionStatus = 'DISCONNECTED';
  protected transportState: TransportState = 'STOPPED';

  public addListener(listener: DriverEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  protected emit(event: string, payload: any) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, payload);
      } catch (err) {
        console.error('Driver listener error:', err);
      }
    });
  }

  // Connection management
  public abstract connect(target: string): Promise<boolean>;
  public abstract disconnect(): Promise<void>;
  
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getTransport(): TransportState {
    return this.transportState;
  }

  // Universal Transport Commands
  public abstract startRecord(): Promise<boolean>;
  public abstract stopRecord(): Promise<boolean>;
  public abstract play(): Promise<boolean>;
  public abstract pause(): Promise<boolean>;
  public abstract triggerFalseTake(currentTake: number): Promise<{ newTake: number; reverted: boolean }>;

  // Mixer & Channel Control
  public abstract setTrackArm(channelNumber: number, armed: boolean): Promise<boolean>;
  public abstract setFaderGain(channelNumber: number, gainDb: number): Promise<boolean>;
  public abstract setTrimGain(channelNumber: number, gainDb: number): Promise<boolean>;
  public abstract setPan(channelNumber: number, pan: number): Promise<boolean>;
  public abstract setPflSoloMute(channelNumber: number, pfl: boolean, solo: boolean, mute: boolean): Promise<boolean>;
  public abstract setTrackName(channelNumber: number, name: string): Promise<boolean>;

  // Timecode & Metadata
  public abstract jamTimecode(source: 'INTERNAL' | 'LTC_IN' | 'GENLOCK'): Promise<boolean>;
  public abstract updateTakeMetadata(scene: string, take: number, roll: string, notes: string): Promise<boolean>;

  // RF Transmitter Control (ZaxNet, Wisycom, Lectrosonics)
  public abstract setTransmitterGain(txId: string, gainOffsetDb: number): Promise<boolean>;
  public abstract setTransmitterPower(txId: string, power: 'ON' | 'STANDBY' | 'LOW_POWER'): Promise<boolean>;

  // Hardware Status Poll / Telemetry
  public abstract requestStatus(): Promise<{
    machine: MachineStatus;
    timecode: TimecodeState;
    channels: AudioChannel[];
    master: MasterBus;
    transmitters: TransmitterRF[];
  }>;
}
