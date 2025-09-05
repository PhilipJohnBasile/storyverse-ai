import { EventEmitter } from "events";
export interface WebSocketInterface extends EventEmitter {
    readyState: number;
    send(data: string): void;
    close(): void;
}
export interface WebSocketFactory {
    create(url: string, options?: any): WebSocketInterface;
}
export declare class DefaultWebSocketFactory implements WebSocketFactory {
    create(url: string, options?: any): WebSocketInterface;
}
