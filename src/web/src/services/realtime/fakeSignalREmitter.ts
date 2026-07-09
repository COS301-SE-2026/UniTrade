import type { IHubConnection, ConnectionState } from '../../types/hubConnection.ts';
import type { ChatMessage, MessagesReadEvent } from '../../types/Reservations';

type Listener = (...args: any[]) => void;

interface BroadcastPayload {
  event: string;
  args: any[];
}

const CHANNEL_NAME = 'unitrade-fake-signalr';

const PERIODIC_MESSAGE_INTERVAL_MS = 15000;

export class FakeHubConnection implements IHubConnection {
  private channel: BroadcastChannel;
  private listeners: Map<string, Set<Listener>> = new Map();
  private reconnectingCallbacks: ((error?: Error) => void)[] = [];
  private reconnectedCallbacks: ((connectionId?: string) => void)[] = [];
  private closeCallbacks: ((error?: Error) => void)[] = [];
  private periodicTimer: ReturnType<typeof setInterval> | null = null;
  private _state: ConnectionState = 'Disconnected';

  constructor() {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.onmessage = (e: MessageEvent<BroadcastPayload>) => {
      this.dispatch(e.data.event, e.data.args);
    };
  }

  get state(): ConnectionState {
    return this._state;
  }

  async start(): Promise<void> {
    this._state = 'Connecting';
    
    await delay(300);
    this._state = 'Connected';

    if (PERIODIC_MESSAGE_INTERVAL_MS > 0) {
      this.periodicTimer = setInterval(() => {
        this.dispatch('ReceiveMessage', [buildFakeMessage()]);
      }, PERIODIC_MESSAGE_INTERVAL_MS);
    }
  }

  async stop(): Promise<void> {
    this._state = 'Disconnecting';
    if (this.periodicTimer) clearInterval(this.periodicTimer);
    await delay(100);
    this._state = 'Disconnected';
    this.closeCallbacks.forEach((cb) => cb());
  }

  on(eventName: string, callback: Listener): void {
    if (!this.listeners.has(eventName)) this.listeners.set(eventName, new Set());
    this.listeners.get(eventName)!.add(callback);
  }

  off(eventName: string, callback?: Listener): void {
    if (!callback) {
      this.listeners.delete(eventName);
      return;
    }
    this.listeners.get(eventName)?.delete(callback);
  }

  async invoke<T = void>(methodName: string, ...args: any[]): Promise<T> {
    await delay(150); // simulate round-trip

    if (methodName === 'SendMessage') {
      const [content] = args as [string, string];
      const message = buildFakeMessage(content);
      this.broadcast('ReceiveMessage', [message]);
      return message as unknown as T;
    }

    if (methodName === 'MarkRead') {
      const [reservationId, upToMessageId] = args as [string, string];
      const event: MessagesReadEvent = {
        reservationId,
        upToMessageId,
        readerId: 'mock-current-user',
      };
      this.broadcast('MessagesRead', [event]);
      return undefined as unknown as T;
    }

    throw new Error(`FakeHubConnection: unrecognized method "${methodName}"`);
  }

  onreconnecting(callback: (error?: Error) => void): void {
    this.reconnectingCallbacks.push(callback);
  }

  onreconnected(callback: (connectionId?: string) => void): void {
    this.reconnectedCallbacks.push(callback);
  }

  onclose(callback: (error?: Error) => void): void {
    this.closeCallbacks.push(callback);
  }

  simulateDisconnectAndReconnect(): void {
    this._state = 'Reconnecting';
    this.reconnectingCallbacks.forEach((cb) => cb());
    setTimeout(() => {
      this._state = 'Connected';
      this.reconnectedCallbacks.forEach((cb) => cb('fake-connection-id'));
    }, 1000);
  }

  private dispatch(event: string, args: any[]): void {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }

  private broadcast(event: string, args: any[]): void {
    this.dispatch(event, args); // fire locally too
    this.channel.postMessage({ event, args } satisfies BroadcastPayload);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let fakeMessageCounter = 0;
function buildFakeMessage(content?: string): ChatMessage {
  fakeMessageCounter += 1;
  return {
    messageId: `fake-msg-${fakeMessageCounter}`,
    senderId: 'mock-counterparty-1',
    messageType: 'text',
    content: content ?? 'Hey, is this still available?',
    payload: null,
    sentAt: new Date().toISOString(),
    readAt: null,
  };
}
