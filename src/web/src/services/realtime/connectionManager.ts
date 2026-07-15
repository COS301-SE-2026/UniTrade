import type {
  IHubConnection,
  ConnectionState,
} from "../../types/hubConnection.ts";
import type {
  ChatMessage,
  Reservation,
  MessagesReadEvent,
} from "../../types/Reservations.ts";
import { RealHubConnection } from "./realHubConnection.ts";

type Unsubscribe = () => void;

class ConnectionManager {
  private connection: IHubConnection | null = null;
  private connectPromise: Promise<void> | null = null;
  private readonly joinedRooms = new Set<string>();

  private readonly stateListeners: Set<(state: ConnectionState) => void> = new Set();
  private readonly reconnectedListeners: Set<() => void> = new Set();
  private readonly messageListeners = new Set<(m: ChatMessage) => void>();
  private readonly readListeners = new Set<(e: MessagesReadEvent) => void>();
  private readonly reservationListeners = new Set<(r: Reservation) => void>();

  connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = (async () => {
      this.connection = createHubConnection();
      const conn = this.connection;

      conn.on("ReceiveMessage", (m: ChatMessage) =>
        this.messageListeners.forEach((cb) => cb(m)),
      );
      conn.on("MessageRed", (e: MessagesReadEvent) =>
        this.readListeners.forEach((cb) => cb(e)),
      );
      conn.on("ReservationUpdated", (r: Reservation) =>
        this.reservationListeners.forEach((cb) => cb(r)),
      );

      conn.onreconnecting(() => {
        this.notifyState("Reconnecting");
      });

      conn.onreconnected(async () => {
        await Promise.allSettled(
          [...this.joinedRooms].map((id) =>
            conn.invoke("JoinRoom", id),
          ),
        );

        this.notifyState("Connected");
        this.reconnectedListeners.forEach((cb) => cb());
      });

      conn.onclose(() => {
        this.connection = null;
        this.connectPromise = null;
        this.notifyState("Disconnected");
      });

      await conn.start();
      this.notifyState("Connected");
    })();

    this.connectPromise.catch(() => {
      this.connection = null;
      this.connectPromise = null;
    });

    return this.connectPromise;
  }

  async joinRoom(reservationId: string): Promise<void> {
    this.joinedRooms.add(reservationId);
    await this.connect();
    await this.connection!.invoke("JoinRoom", reservationId);
  }

  async leaveRoom(reservationId: string): Promise<void> {
    this.joinedRooms.delete(reservationId);
    if (this.getState() === "Connected") {
      await this.connection!.invoke("LeaveRoom", reservationId).catch(() => { });
    }
  }
  async disconnect(): Promise<void> {
    this.joinedRooms.clear();
    await this.connection?.stop();
  }

  getState(): ConnectionState {
    return this.connection?.state ?? "Disconnected";
  }

  onMessageReceived(callback: (message: ChatMessage) => void): Unsubscribe {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  onMessagesRead(callback: (event: MessagesReadEvent) => void): Unsubscribe {
    this.readListeners.add(callback);
    return () => this.readListeners.delete(callback);
  }

  onReservationUpdated(callback: (r: Reservation) => void): Unsubscribe {
    this.reservationListeners.add(callback);
    return () => this.reservationListeners.delete(callback);
  }
  async sendMessage(
    reservationId: string,
    content: string,
    clientId: string,
  ): Promise<ChatMessage> {
    if (!this.connection) throw new Error("Connection not started");
    return this.connection.invoke<ChatMessage>(
      "SendMessage",
      reservationId,
      content,
      clientId,
    );
  }

  async markRead(reservationId: string, upToMessageId: number): Promise<void> {
    if (!this.connection) throw new Error("Connection not started");
    await this.connection.invoke("ReadReceipts", reservationId, upToMessageId);
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
  return new RealHubConnection();
}

export const connectionManager = new ConnectionManager();
