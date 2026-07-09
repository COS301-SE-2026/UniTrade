
export type ConnectionState =
  | 'Disconnected'
  | 'Connecting'
  | 'Connected'
  | 'Reconnecting'
  | 'Disconnecting';

export interface IHubConnection {
  readonly state: ConnectionState;

  start(): Promise<void>;
  stop(): Promise<void>;

  on(eventName: string, callback: (...args: any[]) => void): void;
  off(eventName: string, callback?: (...args: any[]) => void): void;

  invoke<T = void>(methodName: string, ...args: any[]): Promise<T>;

  onreconnecting(callback: (error?: Error) => void): void;
  onreconnected(callback: (connectionId?: string) => void): void;
  onclose(callback: (error?: Error) => void): void;
}

export type {
  ChatMessage,
  Reservation,
  MessagesReadEvent,
} from './Reservations.ts';
