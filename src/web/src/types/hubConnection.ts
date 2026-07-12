
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(eventName: string, callback: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(eventName: string, callback?: (...args: any[]) => void): void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
