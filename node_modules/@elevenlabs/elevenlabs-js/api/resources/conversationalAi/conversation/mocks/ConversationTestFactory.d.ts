import { Conversation } from "../Conversation";
import { MockAudioInterface, MockConversationClient, MockWebSocket } from "./MockConversation";
import { ClientTools } from "../ClientTools";
export interface TestConversationSetup {
    conversation: Conversation;
    mockWebSocket: MockWebSocket;
    mockAudio: MockAudioInterface;
    mockClient: MockConversationClient;
    mockTools: ClientTools;
}
export declare function createTestConversation(options?: {
    agentId?: string;
    requiresAuth?: boolean;
    config?: any;
}): TestConversationSetup;
