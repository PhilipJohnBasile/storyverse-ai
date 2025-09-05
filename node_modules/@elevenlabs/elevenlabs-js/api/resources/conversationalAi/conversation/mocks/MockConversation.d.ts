import { EventEmitter } from "events";
import { WebSocketInterface, WebSocketFactory } from "../interfaces/WebSocketInterface";
import { ConversationClient } from "../interfaces/ConversationClient";
import { AudioInterface } from "../AudioInterface";
export declare class MockWebSocket extends EventEmitter implements WebSocketInterface {
    readyState: number;
    private mockMessages;
    send(data: string): void;
    close(): void;
    simulateMessage(message: any): void;
    simulateError(error: Error): void;
    simulateOpen(): void;
    getSentMessages(): any[];
    getLastMessage(): any;
    clearMessages(): void;
}
export declare class MockWebSocketFactory implements WebSocketFactory {
    private mockWebSocket;
    create(url: string, options?: any): WebSocketInterface;
    getMockWebSocket(): MockWebSocket;
}
export declare class MockAudioInterface extends AudioInterface {
    private inputCallback?;
    private outputBuffer;
    private isStarted;
    start(inputCallback: (audio: Buffer) => void): void;
    stop(): void;
    output(audio: Buffer): void;
    interrupt(): void;
    simulateAudioInput(audio: Buffer): void;
    getOutputBuffer(): Buffer[];
    clearOutputBuffer(): void;
    isAudioStarted(): boolean;
}
export declare class MockConversationClient implements ConversationClient {
    private mockSignedUrl;
    conversationalAi: {
        conversations: {
            getSignedUrl: jest.Mock<any, any, any>;
        };
    };
    setMockSignedUrl(url: string): void;
}
