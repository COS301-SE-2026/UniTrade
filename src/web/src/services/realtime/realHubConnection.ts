import * as signalR from '@microsoft/signalr';
import type { IHubConnection, ConnectionState } from '../../types/hubConnection';
import {getApiUrl} from '../../config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (...args: any[]) => void;

function mapState(state: signalR.HubConnectionState): ConnectionState{
    switch(state) {
        case signalR.HubConnectionState.Connected:
            return 'Connected';
        case signalR.HubConnectionState.Connecting:
            return 'Connecting'
        case signalR.HubConnectionState.Reconnecting:
            return 'Reconnecting'
        case signalR.HubConnectionState.Disconnecting:
            return 'Disconnecting';
        default:
            return 'Disconnected'
    }
}

export class RealHubConnection implements IHubConnection {
    private connection: signalR.HubConnection;

    constructor() {
        const origin = new URL(getApiUrl()).origin;
        const hubUrl = `${origin}/chathub`

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                withCredentials: true,
            })
            .withAutomaticReconnect()
            .build();
    }

    get state(): ConnectionState {
        return mapState(this.connection.state);
    }

    async start(): Promise<void> {
        await this.connection.start();
    }

    async stop(): Promise<void> {
        await this.connection.stop();
    }

    on(eventName: string, callback: Listener): void {
        this.connection.on(eventName, callback);
    }

    off(eventName: string, callback?: Listener): void {
        if (callback) {
            this.connection.off(eventName, callback);
        } else {
            this.connection.off(eventName);
        }
    }

    async invoke<T = void>(methodName: string, ...args: unknown[]): Promise<T> {
        return this.connection.invoke<T>(methodName, ...args);
    }

    onreconnecting(callback: (error?: Error) => void): void {
        this.connection.onreconnecting(callback);
    }
    onreconnected(callback: (connectionId?: string) => void): void {
        this.connection.onreconnected(callback);
    }

    onclose(callback: (error?: Error) => void): void {
        this.connection.onclose(callback);
    }
}