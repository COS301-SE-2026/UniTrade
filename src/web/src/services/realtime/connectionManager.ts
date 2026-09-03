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
  private isAdminGroupJoined = false;

  private readonly stateListeners: Set<(state: ConnectionState) => void> =
    new Set();
  private readonly disputeOutcomeListeners = new Set<
    (e: { message: string; reason?: string }) => void
  >();

  private readonly reconnectedListeners: Set<() => void> = new Set();
  private readonly messageListeners = new Set<(m: ChatMessage) => void>();
  private readonly readListeners = new Set<(e: MessagesReadEvent) => void>();
  private readonly reservationListeners = new Set<(r: Reservation) => void>();
  private readonly listingQuestionAskedListeners = new Set<
    (e: { listingId: string; questionId: string }) => void
  >();
  private readonly listingQuestionAnsweredListeners = new Set<
    (e: { listingId: string; questionId: string }) => void
  >();
  private readonly listingListeners = new Set<
    (listingId: string, event: "reserved" | "released" | "created") => void
  >();
  private readonly pinGeneratedListeners = new Set<
    (e: { reservationId: string; pin: string }) => void
  >();
  private readonly paymentCompletedListeners = new Set<
    (e: { reservationId: string }) => void
  >();
  private readonly pinConfirmedListeners = new Set<
    (e: { reservationId: string }) => void
  >();
  private readonly disputeCreatedListeners = new Set<
    (data: { caseId: string; type: string }) => void
  >();
  private readonly disputeResolvedListeners = new Set<
    (data: { caseId: string; status: string }) => void
  >();

  private readonly savedSearchMatchListeners = new Set<
    (e: {
      listingId: string;
      title: string;
      price: number;
      message: string;
    }) => void
  >();

  private readonly verificationCreatedListeners = new Set<
    (e: { caseId: string }) => void
  >();

  private readonly forceLogoutListeners = new Set<(e: { reason: string}) => void>();
  private readonly verificationResubmissionListeners = new Set<(e: {reason: string | null}) => void>()

  connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = (async () => {
      this.connection = createHubConnection();
      const conn = this.connection;

      conn.on("ReceiveMessage", (m: ChatMessage) =>
        this.messageListeners.forEach((cb) => cb(m)),
      );
      conn.on("MessagesRead", (e: MessagesReadEvent) =>
        this.readListeners.forEach((cb) => cb(e)),
      );
      conn.on("ReservationUpdated", (r: Reservation) =>
        this.reservationListeners.forEach((cb) => cb(r)),
      );

      conn.on("ListingReserved", (p: { listingId: string }) => {
        this.listingListeners.forEach((cb) => cb(p.listingId, "reserved"));
      });
      conn.on("pin_confirmed", (e: { reservationId: string }) =>
        this.pinConfirmedListeners.forEach((cb) => cb(e)),
      );
      conn.on("ListingReserved", (p: { listingId: string }) => {
        this.listingListeners.forEach((cb) => cb(p.listingId, "reserved"));
      });
      conn.on("ListingReleased", (p: { listingId: string }) => {
        this.listingListeners.forEach((cb) => cb(p.listingId, "released"));
      });
      conn.on("ListingCreated", (p: { listingId: string }) => {
        this.listingListeners.forEach((cb) => cb(p.listingId, "created"));
      });
      conn.on("pin_generated", (e: { reservationId: string; pin: string }) =>
        this.pinGeneratedListeners.forEach((cb) => cb(e)),
      );

      conn.on("payment_completed", (e: { reservationId: string }) =>
        this.paymentCompletedListeners.forEach((cb) => cb(e)),
      );

      conn.on(
        "saved_search_match",
        (e: {
          listingId: string;
          title: string;
          price: number;
          message: string;
        }) => this.savedSearchMatchListeners.forEach((cb) => cb(e)),
      );

      conn.on(
        "listing_question_asked",
        (e: { listingId: string; questionId: string }) =>
          this.listingQuestionAskedListeners.forEach((cb) => cb(e)),
      );
      conn.on(
        "listing_question_answered",
        (e: { listingId: string; questionId: string }) =>
          this.listingQuestionAnsweredListeners.forEach((cb) => cb(e)),
      );
      conn.on("dispute_created", (data: { caseId: string; type: string }) =>
        this.disputeCreatedListeners.forEach((cb) => cb(data)),
      );
      conn.on("verification_created", (e: { caseId: string }) =>
        this.verificationCreatedListeners.forEach((cb) => cb(e)),
      );
      conn.on("dispute_resolved", (data: { caseId: string; status: string }) =>
        this.disputeResolvedListeners.forEach((cb) => cb(data)),
      );
      conn.on("dispute_outcome", (e: { message: string; reason?: string }) =>
        this.disputeOutcomeListeners.forEach((cb) => cb(e)),
        this.verificationCreatedListeners.forEach((cb) => cb(e)),);
      conn.on(
        "dispute_resolved",
        (data: { caseId: string; status: string }) =>
          this.disputeResolvedListeners.forEach((cb) => cb(data)),
      );
      conn.on("force_logout", (e: {reason: string}) => 
      this.forceLogoutListeners.forEach((cb) => cb(e)),);
      conn.on("verification_resubmission_required", (e: {reason: string | null}) =>
      this.verificationResubmissionListeners.forEach((cb) => cb(e)))
      conn.onreconnecting(() => {
        this.notifyState("Reconnecting");
      });

      conn.onreconnected(async () => {
        await Promise.allSettled(
          [...this.joinedRooms].map((id) => conn.invoke("JoinRoom", id)),
        );
        if (this.isAdminGroupJoined) {
          await conn.invoke("JoinAdminGroup").catch(() => {});
        }

        this.notifyState("Connected");
        this.reconnectedListeners.forEach((cb) => cb());
      });

      conn.onclose(() => {
        this.connection = null;
        this.connectPromise = null;
        this.notifyState("Disconnected");
      });

      await conn.start();
      await Promise.allSettled(
        [...this.joinedRooms].map((id) => conn.invoke("JoinRoom", id)),
      );
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
      await this.connection!.invoke("LeaveRoom", reservationId).catch(() => {});
    }
  }
  async disconnect(): Promise<void> {
    this.joinedRooms.clear();
    await this.connection?.stop();
  }

  async joinAdminGroup(): Promise<void> {
    this.isAdminGroupJoined = true;
    await this.connect();
    await this.connection!.invoke("JoinAdminGroup");
  }

  async leaveAdminGroup(): Promise<void> {
    this.isAdminGroupJoined = false;
    await this.connection?.invoke("LeaveAdminGroup").catch(() => {});
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
  onListingChanged(
    cb: (listingId: string, event: "reserved" | "released" | "created") => void,
  ): Unsubscribe {
    this.listingListeners.add(cb);
    return () => this.listingListeners.delete(cb);
  }
  onPinConfirmed(
    callback: (e: { reservationId: string }) => void,
  ): Unsubscribe {
    this.pinConfirmedListeners.add(callback);
    return () => this.pinConfirmedListeners.delete(callback);
  }
  onDisputeOutcome(
    e: (e: { message: string; reason?: string }) => void,
  ): Unsubscribe {
    this.disputeOutcomeListeners.add(e);
    return () => this.disputeOutcomeListeners.delete(e);
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

  onPinGenerated(
    callback: (e: { reservationId: string; pin: string }) => void,
  ): Unsubscribe {
    this.pinGeneratedListeners.add(callback);
    return () => this.pinGeneratedListeners.delete(callback);
  }

  onPaymentCompleted(
    callback: (e: { reservationId: string }) => void,
  ): Unsubscribe {
    this.paymentCompletedListeners.add(callback);
    return () => this.paymentCompletedListeners.delete(callback);
  }

  onListingQuestionAsked(
    cb: (e: { listingId: string; questionId: string }) => void,
  ): Unsubscribe {
    this.listingQuestionAskedListeners.add(cb);
    return () => this.listingQuestionAskedListeners.delete(cb);
  }
  onListingQuestionAnswered(
    cb: (e: { listingId: string; questionId: string }) => void,
  ): Unsubscribe {
    this.listingQuestionAnsweredListeners.add(cb);
    return () => this.listingQuestionAnsweredListeners.delete(cb);
  }
  onSavedSearchMatch(
    callback: (e: {
      listingId: string;
      title: string;
      price: number;
      message: string;
    }) => void,
  ): Unsubscribe {
    this.savedSearchMatchListeners.add(callback);
    return () => this.savedSearchMatchListeners.delete(callback);
  }
  onReconnected(callback: () => void): Unsubscribe {
    this.reconnectedListeners.add(callback);
    return () => this.reconnectedListeners.delete(callback);
  }

  onDisputeCreated(
    callback: (data: { caseId: string; type: string }) => void,
  ): Unsubscribe {
    this.disputeCreatedListeners.add(callback);
    return () => this.disputeCreatedListeners.delete(callback);
  }

  onVerificationCreated(
    callback: (e: { caseId: string }) => void,
  ): Unsubscribe {
    this.verificationCreatedListeners.add(callback);
    return () => this.verificationCreatedListeners.delete(callback);
  }


  onDisputeResolved(
    callback: (data: { caseId: string; status: string }) => void,
  ): Unsubscribe {
    this.disputeResolvedListeners.add(callback);
    return () => this.disputeResolvedListeners.delete(callback);
  }

  onForceLogout(
    callback: (e: {reason: string}) => void,
  ): Unsubscribe {
    this.forceLogoutListeners.add(callback);
    return () => this.forceLogoutListeners.delete(callback);
  }

  onVerificationResubmissionRequired(
    callback: (e: { reason: string | null}) => void,
  ): Unsubscribe {
    this.verificationResubmissionListeners.add(callback);
    return () => this.verificationResubmissionListeners.delete(callback);
  }
  private notifyState(state: ConnectionState): void {
    this.stateListeners.forEach((cb) => cb(state));
  }
}

function createHubConnection(): IHubConnection {
  return new RealHubConnection();
}

export const connectionManager = new ConnectionManager();
