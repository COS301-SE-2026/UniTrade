import { FakeHubConnection } from './fakeSignalREmitter';
import type { IHubConnection, ConnectionState } from '../../types/hubConnection.ts';
import type { ChatMessage, Reservation, MessagesReadEvent } from '../../types/Reservations.ts';

type Unsubscribe = () => void;

const JOIN_GROUPS_METHOD = 'JoinReservationGroups';

class ConnectionManager {
  private connection: IHubConnection | null = null;
  private connectPromise: Promise<void> | null = null;

  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  private reconnectedListeners: Set<() => void> = new Set();

  connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = (async () => {
      this.connection = createHubConnection();

      this.connection.onreconnecting(() => {
        this.notifyState('Reconnecting');
      });

      this.connection.onreconnected(() => {
        this.notifyState('Connected');
  
        this.reconnectedListeners.forEach((cb) => cb());
      });

      this.connection.onclose(() => {
        this.notifyState('Disconnected');
      });

      await this.connection.start();
      this.notifyState('Connected');

      try {
        await this.connection.invoke(JOIN_GROUPS_METHOD);
      } catch {
       //nothing, forlinting not to fail
      }
    })();

    return this.connectPromise;
  }

  async disconnect(): Promise<void> {
    await this.connection?.stop();
    this.connection = null;
    this.connectPromise = null;
  }

  getState(): ConnectionState {
    return this.connection?.state ?? 'Disconnected';
  }


  onMessageReceived(callback: (message: ChatMessage) => void): Unsubscribe {
    this.connection?.on('ReceiveMessage', callback);
    return () => this.connection?.off('ReceiveMessage', callback);
  }

  onMessagesRead(callback: (event: MessagesReadEvent) => void): Unsubscribe {
    this.connection?.on('MessagesRead', callback);
    return () => this.connection?.off('MessagesRead', callback);
  }

  async sendMessage(reservationId: string, content: string): Promise<ChatMessage> {
    if (!this.connection) throw new Error('Connection not started');
    return this.connection.invoke<ChatMessage>('SendMessage', reservationId, content);
  }

  async markRead(reservationId: string, upToMessageId: string): Promise<void> {
    if (!this.connection) throw new Error('Connection not started');
    await this.connection.invoke('MarkRead', reservationId, upToMessageId);
  }

  onReservationUpdated(callback: (reservation: Reservation) => void): Unsubscribe {
    this.connection?.on('ReservationUpdated', callback);
    return () => this.connection?.off('ReservationUpdated', callback);
  }


  onStateChange(callback: (state: ConnectionState) => void): Unsubscribe {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  onReconnected(callback: () => void): Unsubscribe {
    this.reconnectedListeners.add(callback);
    return () => this.reconnectedListeners.delete(callback);
  }

  private notifyState(state: ConnectionState): void {
    this.stateListeners.forEach((cb) => cb(state));
  }
}

function createHubConnection(): IHubConnection {
  return new FakeHubConnection();

}

export const connectionManager = new ConnectionManager();
