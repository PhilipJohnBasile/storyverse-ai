import { ClientToolResultEvent } from "./events";
/**
 * Handles registration and execution of client-side tools that can be called by the agent.
 *
 * Supports both synchronous and asynchronous tools running in a dedicated event loop,
 * ensuring non-blocking operation of the main conversation thread.
 */
export declare class ClientTools {
    private tools;
    /**
     * Register a new tool that can be called by the AI agent.
     *
     * @param toolName Unique identifier for the tool
     * @param handler Function that implements the tool's logic
     * @param isAsync Whether the handler is an async function (auto-detected if not specified)
     */
    register(toolName: string, handler: (parameters: Record<string, any>) => any | Promise<any>, isAsync?: boolean): void;
    /**
     * Execute a registered tool with the given parameters.
     *
     * @param toolName Name of the tool to execute
     * @param parameters Parameters to pass to the tool
     * @returns The result of the tool execution
     */
    handle(toolName: string, parameters: Record<string, any>): Promise<any>;
    /**
     * Execute a tool and send its result via the provided callback.
     *
     * This method is non-blocking and handles both sync and async tools.
     *
     * @param toolName Name of the tool to execute
     * @param parameters Parameters to pass to the tool (should include tool_call_id)
     * @param callback Function to call with the result
     */
    executeToolAsync(toolName: string, parameters: Record<string, any>, callback: (response: ClientToolResultEvent) => void): void;
    /**
     * Get a list of all registered tool names.
     *
     * @returns Array of tool names
     */
    getRegisteredTools(): string[];
    /**
     * Check if a tool is registered.
     *
     * @param toolName Name of the tool to check
     * @returns True if the tool is registered
     */
    isToolRegistered(toolName: string): boolean;
    /**
     * Unregister a tool.
     *
     * @param toolName Name of the tool to unregister
     * @returns True if the tool was found and removed
     */
    unregister(toolName: string): boolean;
    /**
     * Clear all registered tools.
     */
    clear(): void;
}
